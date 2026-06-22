//! daemon 侧交互式终端：每个项目一个常驻 PTY 会话，手机经双向 WebSocket
//! 实时收发。逻辑参照 src-tauri/src/pty.rs（PC 端），但输出通道从 Tauri
//! Channel 换成 tokio mpsc，以桥接阻塞 reader 线程与 async WebSocket。
//! 与 PC 桌面端的 Tauri 进程内 PTY 互不相干，各自独立 shell 会话。
use std::collections::HashMap;
use std::io::{Read, Write};
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};

use axum::{
    extract::{
        ws::{Message, WebSocket, WebSocketUpgrade},
        Path as AxPath, Query, State,
    },
    http::StatusCode,
    response::Response,
};
use dazi_core::{autopilot, project, prompt};
use futures::{SinkExt, StreamExt};
use portable_pty::{native_pty_system, ChildKiller, CommandBuilder, MasterPty, PtySize};
use serde::{Deserialize, Serialize};
use tokio::sync::mpsc;
use tokio::time::{interval_at, Duration, Instant, MissedTickBehavior};

use crate::http::{find_project_path, AppState};

const SCROLLBACK_MAX: usize = 256 * 1024; // 256KB 回放缓冲上限

/// 启动意图：纯 shell / handoff 注入项目上下文 / continue 续上次会话。
#[derive(Deserialize, Clone, Copy, PartialEq, Default)]
#[serde(rename_all = "lowercase")]
pub enum PtyLaunch {
    #[default]
    Shell,
    Handoff,
    Continue,
}

/// 服务端 → 客户端。
#[derive(Serialize, Clone)]
#[serde(tag = "type", rename_all = "lowercase")]
enum ServerMsg {
    Output { data: String },
    Exit,
}

/// 客户端 → 服务端。
#[derive(Deserialize)]
#[serde(tag = "type", rename_all = "lowercase")]
enum ClientMsg {
    Input { data: String },
    Resize { cols: u16, rows: u16 },
}

struct PtySession {
    writer: Mutex<Box<dyn Write + Send>>,
    master: Mutex<Box<dyn MasterPty + Send>>,
    killer: Mutex<Box<dyn ChildKiller + Send + Sync>>,
    scrollback: Mutex<Vec<u8>>,
    /// 当前连接的输出通道；重连时整体替换。reader 线程通过它推字节。
    /// 使用有界通道施加背压，避免极端输出下无限制堆积。
    out_tx: Mutex<Option<mpsc::Sender<ServerMsg>>>,
    alive: AtomicBool,
}

#[derive(Default)]
pub struct PtyManager {
    sessions: Mutex<HashMap<String, Arc<PtySession>>>,
}

impl PtyManager {
    /// 进程退出时杀掉全部子进程，避免孤儿。
    pub fn kill_all(&self) {
        let sessions = self.sessions.lock().unwrap();
        for s in sessions.values() {
            let _ = s.killer.lock().unwrap().kill();
        }
    }

    /// 结束指定项目的终端会话：kill 子进程并从池中移除。
    /// 返回 true = 确实有会话被结束；false = 本无会话。
    pub fn kill_session(&self, slug: &str) -> bool {
        let mut sessions = self.sessions.lock().unwrap();
        if let Some(s) = sessions.remove(slug) {
            let _ = s.killer.lock().unwrap().kill();
            true
        } else {
            false
        }
    }
}

/// 从字节缓冲中取出完整 UTF-8 前缀；不完整的尾部多字节序列留在 buf 中等下一次读。
/// 真正非法的字节用 lossy 替换，避免死锁在坏字节上。（照搬 PC 端 pty.rs）
fn drain_valid_utf8(buf: &mut Vec<u8>) -> String {
    match std::str::from_utf8(buf) {
        Ok(s) => {
            let out = s.to_string();
            buf.clear();
            out
        }
        Err(e) => {
            let valid = e.valid_up_to();
            match e.error_len() {
                None => {
                    let out = String::from_utf8_lossy(&buf[..valid]).into_owned();
                    buf.drain(..valid);
                    out
                }
                Some(bad) => {
                    let end = valid + bad;
                    let out = String::from_utf8_lossy(&buf[..end]).into_owned();
                    buf.drain(..end);
                    out
                }
            }
        }
    }
}

fn append_scrollback(scrollback: &Mutex<Vec<u8>>, data: &[u8]) {
    let mut sb = scrollback.lock().unwrap();
    sb.extend_from_slice(data);
    if sb.len() > SCROLLBACK_MAX {
        let cut = sb.len() - SCROLLBACK_MAX;
        sb.drain(..cut);
    }
}

/// 构造 pty 内运行的命令。Handoff/Continue 都在 claude 退出后 exec 回登录 shell，
/// 保证会话不因 claude 结束而关闭。（照搬 PC 端 pty.rs）
fn build_command(cwd: &Path, launch: PtyLaunch) -> CommandBuilder {
    let shell = autopilot::login_shell();
    let mut cmd = CommandBuilder::new(&shell);
    match launch {
        PtyLaunch::Shell => {
            cmd.arg("-l");
        }
        PtyLaunch::Handoff => {
            let p = prompt::build_handoff_prompt(cwd);
            let claude = autopilot::shell_single_quote(&autopilot::resolve_claude_bin());
            let quoted = autopilot::shell_single_quote(&p);
            cmd.arg("-lc");
            cmd.arg(format!("{claude} {quoted}; exec {shell} -l"));
        }
        PtyLaunch::Continue => {
            let claude = autopilot::shell_single_quote(&autopilot::resolve_claude_bin());
            cmd.arg("-lc");
            cmd.arg(format!("{claude} -c; exec {shell} -l"));
        }
    }
    cmd.cwd(cwd);
    cmd.env("TERM", "xterm-256color");
    cmd.env("LANG", "zh_CN.UTF-8");
    cmd
}

#[derive(Deserialize)]
pub struct WsTermQuery {
    token: Option<String>,
    #[serde(default)]
    launch: PtyLaunch,
    cols: Option<u16>,
    rows: Option<u16>,
}

/// 双向终端 WebSocket 入口。浏览器 ws 不能设 header，token 走查询参数。
/// 鉴权与 slug 解析必须在 spawn PTY 之前完成。
pub async fn ws_terminal_handler(
    ws: WebSocketUpgrade,
    AxPath(slug): AxPath<String>,
    Query(q): Query<WsTermQuery>,
    State(state): State<AppState>,
) -> Result<Response, StatusCode> {
    // 1) token 先于一切校验，失败立即 401，绝不开 PTY。
    let token = q.token.clone().unwrap_or_default();
    if !state.auth.verify(&token) {
        return Err(StatusCode::UNAUTHORIZED);
    }
    // 2) cwd 只来自 find_project_path 解析的工作区内项目，绝不接受客户端传路径。
    let cwd = find_project_path(&slug).map_err(|_| StatusCode::NOT_FOUND)?;
    if !cwd.exists() {
        return Err(StatusCode::NOT_FOUND);
    }
    let launch = q.launch;
    let cols = q.cols.unwrap_or(80);
    let rows = q.rows.unwrap_or(24);
    Ok(ws.on_upgrade(move |socket| {
        handle_terminal(socket, state, slug, cwd, launch, cols, rows)
    }))
}

/// 获取存活会话或新建一个。新建时起 reader 线程把 PTY 输出推入 session.out_tx。
fn ensure_session(
    state: &AppState,
    slug: &str,
    cwd: &PathBuf,
    launch: PtyLaunch,
    cols: u16,
    rows: u16,
) -> Result<Arc<PtySession>, String> {
    let mut sessions = state.ptys.sessions.lock().unwrap();
    if let Some(s) = sessions.get(slug) {
        if s.alive.load(Ordering::SeqCst) {
            return Ok(s.clone());
        }
        sessions.remove(slug); // 已死：移除后重建
    }

    let pair = native_pty_system()
        .openpty(PtySize { rows, cols, pixel_width: 0, pixel_height: 0 })
        .map_err(|e| format!("openpty 失败: {e}"))?;
    let mut child = pair
        .slave
        .spawn_command(build_command(cwd, launch))
        .map_err(|e| format!("spawn 失败: {e}"))?;
    drop(pair.slave);

    let killer = child.clone_killer();
    let mut reader = pair
        .master
        .try_clone_reader()
        .map_err(|e| format!("clone reader 失败: {e}"))?;
    let writer = pair
        .master
        .take_writer()
        .map_err(|e| format!("take writer 失败: {e}"))?;

    let session = Arc::new(PtySession {
        writer: Mutex::new(writer),
        master: Mutex::new(pair.master),
        killer: Mutex::new(killer),
        scrollback: Mutex::new(Vec::new()),
        out_tx: Mutex::new(None),
        alive: AtomicBool::new(true),
    });
    sessions.insert(slug.to_string(), session.clone());
    drop(sessions);

    if launch == PtyLaunch::Handoff {
        let _ = project::mark_handed_off(cwd);
    }

    // reader 线程：8KB 读 → scrollback → mpsc（处理 UTF-8 截断）。
    let sess = session.clone();
    std::thread::spawn(move || {
        let mut pending: Vec<u8> = Vec::new();
        let mut buf = [0u8; 8192];
        loop {
            match reader.read(&mut buf) {
                Ok(0) | Err(_) => break,
                Ok(n) => {
                    append_scrollback(&sess.scrollback, &buf[..n]);
                    pending.extend_from_slice(&buf[..n]);
                    let text = drain_valid_utf8(&mut pending);
                    if !text.is_empty() {
                        if let Some(tx) = sess.out_tx.lock().unwrap().as_ref() {
                            // 有界通道满时丢弃旧帧，避免内存无限增长；
                            // 正常批量发送下不应出现丢弃。
                            let _ = tx.blocking_send(ServerMsg::Output { data: text });
                        }
                    }
                }
            }
        }
        let _ = child.wait(); // 回收子进程，避免僵尸
        sess.alive.store(false, Ordering::SeqCst);
        if let Some(tx) = sess.out_tx.lock().unwrap().as_ref() {
            let _ = tx.blocking_send(ServerMsg::Exit);
        }
    });

    Ok(session)
}

/// 控制 send_task 的辅助消息。
enum CtrlMsg {
    SendPing,
}

/// 单个 WebSocket 连接的完整生命周期：建桥、回放、收发循环、断开保活。
async fn handle_terminal(
    socket: WebSocket,
    state: AppState,
    slug: String,
    cwd: PathBuf,
    launch: PtyLaunch,
    cols: u16,
    rows: u16,
) {
    let session = match ensure_session(&state, &slug, &cwd, launch, cols, rows) {
        Ok(s) => s,
        Err(_) => {
            // 开 PTY 失败：直接关连接（升级已完成，无法再返回 HTTP 错误码）。
            let _ = socket.close().await;
            return;
        }
    };

    // 建 mpsc 桥，装入 session（重连时整体替换，前一个连接的 sender 被丢弃）。
    let (tx, mut rx) = mpsc::channel::<ServerMsg>(256);
    {
        let replay = String::from_utf8_lossy(&session.scrollback.lock().unwrap()).into_owned();
        if !replay.is_empty() {
            let _ = tx.send(ServerMsg::Output { data: replay }).await;
        }
        *session.out_tx.lock().unwrap() = Some(tx.clone());
    }

    let (mut ws_sink, mut ws_stream) = socket.split();
    let (ctrl_tx, mut ctrl_rx) = mpsc::channel::<CtrlMsg>(4);

    // 出向：mpsc → ws，带批量缓冲（4KB 阈值 / 16ms 截止）与 ping 响应。
    let send_task = tokio::spawn(async move {
        let mut batch = String::new();
        let mut deadline = interval_at(
            Instant::now() + Duration::from_millis(16),
            Duration::from_millis(16),
        );
        deadline.set_missed_tick_behavior(MissedTickBehavior::Delay);

        loop {
            tokio::select! {
                Some(msg) = rx.recv() => {
                    match msg {
                        ServerMsg::Output { data } => {
                            batch.push_str(&data);
                            if batch.len() >= 4096 {
                                if let Ok(json) = serde_json::to_string(&ServerMsg::Output {
                                    data: std::mem::take(&mut batch),
                                }) {
                                    if ws_sink.send(Message::Text(json)).await.is_err() { break; }
                                }
                            }
                        }
                        ServerMsg::Exit => {
                            if !batch.is_empty() {
                                if let Ok(json) = serde_json::to_string(&ServerMsg::Output {
                                    data: std::mem::take(&mut batch),
                                }) {
                                    let _ = ws_sink.send(Message::Text(json)).await;
                                }
                            }
                            if let Ok(json) = serde_json::to_string(&ServerMsg::Exit) {
                                if ws_sink.send(Message::Text(json)).await.is_err() { break; }
                            } else {
                                break;
                            }
                        }
                    }
                }
                Some(ctrl) = ctrl_rx.recv() => {
                    match ctrl {
                        CtrlMsg::SendPing => {
                            if ws_sink.send(Message::Ping(vec![])).await.is_err() {
                                break;
                            }
                        }
                    }
                }
                _ = deadline.tick() => {
                    if !batch.is_empty() {
                        if let Ok(json) = serde_json::to_string(&ServerMsg::Output {
                            data: std::mem::take(&mut batch),
                        }) {
                            if ws_sink.send(Message::Text(json)).await.is_err() { break; }
                        }
                    }
                }
            }
        }
    });

    // 入向：ws → PTY。写入量小，阻塞 Mutex 直接锁即可；同时维持心跳。
    let mut ping_interval = interval_at(
        Instant::now() + Duration::from_secs(15),
        Duration::from_secs(15),
    );
    ping_interval.set_missed_tick_behavior(MissedTickBehavior::Delay);
    let mut last_pong = Instant::now();

    loop {
        tokio::select! {
            Some(Ok(frame)) = ws_stream.next() => {
                match frame {
                    Message::Pong(_) => last_pong = Instant::now(),
                    Message::Text(t) => match serde_json::from_str::<ClientMsg>(&t) {
                        Ok(ClientMsg::Input { data }) => {
                            if let Ok(mut w) = session.writer.lock() {
                                let _ = w.write_all(data.as_bytes());
                            }
                        }
                        Ok(ClientMsg::Resize { cols, rows }) => {
                            if let Ok(m) = session.master.lock() {
                                let _ = m.resize(PtySize {
                                    rows,
                                    cols,
                                    pixel_width: 0,
                                    pixel_height: 0,
                                });
                            }
                        }
                        Err(_) => {}
                    },
                    Message::Close(_) => break,
                    _ => {}
                }
            }
            _ = ping_interval.tick() => {
                if last_pong.elapsed() > Duration::from_secs(30) {
                    break;
                }
                if ctrl_tx.send(CtrlMsg::SendPing).await.is_err() {
                    break;
                }
            }
        }
    }

    // ws 入向断开：收掉出向 task，清空 out_tx；PTY 保活，scrollback 续累积，等重连。
    drop(ctrl_tx);
    send_task.abort();
    let mut guard = session.out_tx.lock().unwrap();
    *guard = None;
}

/// 结束终端会话：kill PTY 子进程并移除。供手机端「结束会话」按钮调用，
/// 让跨端接力前的清理成为一次明确操作（避免两端 claude 同时读写同一会话历史）。
/// 走 protected 路由（Bearer token 中间件），故此处无需再校验 token。
pub async fn kill_terminal(
    AxPath(slug): AxPath<String>,
    State(state): State<AppState>,
) -> StatusCode {
    if state.ptys.kill_session(&slug) {
        StatusCode::NO_CONTENT
    } else {
        StatusCode::NOT_FOUND
    }
}
