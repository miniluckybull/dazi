// pty.rs — 任务级常驻 pty 会话：每个任务一个内嵌终端，后台保活，
// 前端通过 ipc::Channel 接收输出，webview 刷新后用 scrollback 回放恢复画面。
use std::collections::HashMap;
use std::io::{Read, Write};
use std::path::PathBuf;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};

use dazi_core::{autopilot, project, prompt};
use portable_pty::{native_pty_system, ChildKiller, CommandBuilder, MasterPty, PtySize};
use serde::{Deserialize, Serialize};
use tauri::ipc::Channel;

const SCROLLBACK_MAX: usize = 256 * 1024; // 256KB 回放缓冲上限

#[derive(Clone, Serialize)]
#[serde(tag = "type", content = "data", rename_all = "lowercase")]
pub enum PtyEvent {
    Output(String),
    Exit,
}

#[derive(Deserialize, Clone, Copy, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum PtyLaunch {
    /// 纯登录 shell
    Shell,
    /// 注入 handoff prompt 启动 claude，退出后回落 shell
    Handoff,
    /// claude -c 继续上次会话，退出后回落 shell
    Continue,
}

#[derive(Serialize)]
pub struct PtyOpenResult {
    pub created: bool,
    pub alive: bool,
    pub replay: String,
}

struct PtySession {
    writer: Mutex<Box<dyn Write + Send>>,
    master: Mutex<Box<dyn MasterPty + Send>>,
    killer: Mutex<Box<dyn ChildKiller + Send + Sync>>,
    scrollback: Mutex<Vec<u8>>,
    channel: Mutex<Option<Channel<PtyEvent>>>,
    alive: AtomicBool,
    /// 本会话内是否已启动过 claude（spawn 注入或 pty_launch 写入）。
    /// 防止向运行中的 claude 误注入命令文本。
    claude_launched: AtomicBool,
}

#[derive(Default)]
pub struct PtyManager {
    sessions: Mutex<HashMap<String, Arc<PtySession>>>,
}

impl PtyManager {
    /// App 退出时杀掉全部子进程，避免孤儿。
    pub fn kill_all(&self) {
        let sessions = self.sessions.lock().unwrap();
        for s in sessions.values() {
            let _ = s.killer.lock().unwrap().kill();
        }
    }
}

/// 从字节缓冲中取出完整 UTF-8 前缀；不完整的尾部多字节序列留在 buf 中等下一次读。
/// 真正非法的字节用 lossy 替换，避免死锁在坏字节上。
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
                // 流被 8KB 边界截断：保留尾部待续
                None => {
                    let out = String::from_utf8_lossy(&buf[..valid]).into_owned();
                    buf.drain(..valid);
                    out
                }
                // 真非法字节：连同替换符一起吐出，跳过坏字节继续
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
/// 保证会话不因 claude 结束而关闭。
fn build_command(cwd: &PathBuf, launch: PtyLaunch) -> Result<CommandBuilder, String> {
    let shell = autopilot::login_shell();
    let mut cmd = CommandBuilder::new(&shell);

    #[cfg(unix)]
    {
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
    }

    #[cfg(windows)]
    {
        // Windows 用 PowerShell：-NoExit 让命令执行完后窗口保持，
        // 单引号字符串语义与 Unix 相近，可复用 shell_single_quote 转义。
        match launch {
            PtyLaunch::Shell => {}
            PtyLaunch::Handoff => {
                let p = prompt::build_handoff_prompt(cwd);
                let claude = autopilot::shell_single_quote(&autopilot::resolve_claude_bin());
                let quoted = autopilot::shell_single_quote(&p);
                cmd.arg("-NoExit");
                cmd.arg("-Command");
                cmd.arg(format!(
                    "{claude} -p {quoted} --output-format json --permission-mode bypassPermissions"
                ));
            }
            PtyLaunch::Continue => {
                let claude = autopilot::shell_single_quote(&autopilot::resolve_claude_bin());
                cmd.arg("-NoExit");
                cmd.arg("-Command");
                cmd.arg(format!("{claude} -c"));
            }
        }
    }

    cmd.cwd(cwd);
    cmd.env("TERM", "xterm-256color");
    cmd.env("LANG", "zh_CN.UTF-8");
    Ok(cmd)
}

#[tauri::command]
pub fn pty_open(
    state: tauri::State<'_, PtyManager>,
    slug: String,
    cwd: PathBuf,
    cols: u16,
    rows: u16,
    launch: PtyLaunch,
    on_event: Channel<PtyEvent>,
) -> Result<PtyOpenResult, String> {
    let mut sessions = state.sessions.lock().unwrap();

    // 已有存活会话：仅替换前端 channel，回放 scrollback（webview 刷新恢复路径）
    if let Some(s) = sessions.get(&slug) {
        if s.alive.load(Ordering::SeqCst) {
            let replay =
                String::from_utf8_lossy(&s.scrollback.lock().unwrap()).into_owned();
            *s.channel.lock().unwrap() = Some(on_event);
            return Ok(PtyOpenResult {
                created: false,
                alive: true,
                replay,
            });
        }
        // 已死会话：移除后重建
        sessions.remove(&slug);
    }

    if !cwd.exists() {
        return Err(format!("项目目录不存在: {}", cwd.display()));
    }

    let pty_system = native_pty_system();
    let pair = pty_system
        .openpty(PtySize {
            rows,
            cols,
            pixel_width: 0,
            pixel_height: 0,
        })
        .map_err(|e| format!("openpty 失败: {e}"))?;

    let cmd = build_command(&cwd, launch)?;
    let mut child = pair
        .slave
        .spawn_command(cmd)
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
        channel: Mutex::new(Some(on_event)),
        alive: AtomicBool::new(true),
        claude_launched: AtomicBool::new(launch != PtyLaunch::Shell),
    });
    sessions.insert(slug.clone(), session.clone());
    drop(sessions);

    // handoff 启动即视为已交接，保持侧栏琥珀色逻辑
    if launch == PtyLaunch::Handoff {
        let _ = project::mark_handed_off(&cwd);
    }

    // reader 线程：8KB 读取 → scrollback → channel（处理 UTF-8 截断）
    std::thread::spawn(move || {
        let mut pending: Vec<u8> = Vec::new();
        let mut buf = [0u8; 8192];
        loop {
            match reader.read(&mut buf) {
                Ok(0) | Err(_) => break,
                Ok(n) => {
                    append_scrollback(&session.scrollback, &buf[..n]);
                    pending.extend_from_slice(&buf[..n]);
                    let text = drain_valid_utf8(&mut pending);
                    if !text.is_empty() {
                        if let Some(ch) = session.channel.lock().unwrap().as_ref() {
                            let _ = ch.send(PtyEvent::Output(text));
                        }
                    }
                }
            }
        }
        let _ = child.wait(); // 回收子进程，避免僵尸
        session.alive.store(false, Ordering::SeqCst);
        if let Some(ch) = session.channel.lock().unwrap().as_ref() {
            let _ = ch.send(PtyEvent::Exit);
        }
    });

    Ok(PtyOpenResult {
        created: true,
        alive: true,
        replay: String::new(),
    })
}

/// 向已存活的 shell 会话写入 claude 启动命令（修复"先开终端再点 Send"时
/// ensureSession 吞掉 launch 意图的问题）。
/// 返回 true = 已处理（已写入命令，或 claude 已在跑无需重复）；
/// 返回 false = 无存活会话，前端应走 pty_open 直接 spawn。
#[tauri::command]
pub fn pty_launch(
    state: tauri::State<'_, PtyManager>,
    slug: String,
    cwd: PathBuf,
    launch: PtyLaunch,
) -> Result<bool, String> {
    if launch == PtyLaunch::Shell {
        return Ok(true);
    }
    let sessions = state.sessions.lock().unwrap();
    let Some(s) = sessions.get(&slug).cloned() else {
        return Ok(false);
    };
    drop(sessions);
    if !s.alive.load(Ordering::SeqCst) {
        return Ok(false);
    }
    // claude 已在本会话启动过：避免向运行中的 claude 注入文本，仅切 Tab 查看
    if s.claude_launched.swap(true, Ordering::SeqCst) {
        return Ok(true);
    }
    let claude = autopilot::shell_single_quote(&autopilot::resolve_claude_bin());
    let line = match launch {
        PtyLaunch::Handoff => {
            let p = prompt::build_handoff_prompt(&cwd);
            format!("{claude} {}\r", autopilot::shell_single_quote(&p))
        }
        PtyLaunch::Continue => format!("{claude} -c\r"),
        PtyLaunch::Shell => unreachable!(),
    };
    let write_result = s
        .writer
        .lock()
        .unwrap()
        .write_all(line.as_bytes())
        .map_err(|e| format!("写入失败: {e}"));
    if write_result.is_err() {
        s.claude_launched.store(false, Ordering::SeqCst);
        write_result?;
    }
    if launch == PtyLaunch::Handoff {
        let _ = project::mark_handed_off(&cwd);
    }
    Ok(true)
}

#[tauri::command]
pub fn pty_write(
    state: tauri::State<'_, PtyManager>,
    slug: String,
    data: String,
) -> Result<(), String> {
    let sessions = state.sessions.lock().unwrap();
    let s = sessions.get(&slug).ok_or("会话不存在")?.clone();
    drop(sessions);
    let r = s
        .writer
        .lock()
        .unwrap()
        .write_all(data.as_bytes())
        .map_err(|e| format!("写入失败: {e}"));
    r
}

#[tauri::command]
pub fn pty_resize(
    state: tauri::State<'_, PtyManager>,
    slug: String,
    cols: u16,
    rows: u16,
) -> Result<(), String> {
    let sessions = state.sessions.lock().unwrap();
    let s = sessions.get(&slug).ok_or("会话不存在")?.clone();
    drop(sessions);
    let r = s
        .master
        .lock()
        .unwrap()
        .resize(PtySize {
            rows,
            cols,
            pixel_width: 0,
            pixel_height: 0,
        })
        .map_err(|e| format!("resize 失败: {e}"));
    r
}

#[tauri::command]
pub fn pty_kill(state: tauri::State<'_, PtyManager>, slug: String) -> Result<(), String> {
    let mut sessions = state.sessions.lock().unwrap();
    if let Some(s) = sessions.remove(&slug) {
        let _ = s.killer.lock().unwrap().kill();
    }
    Ok(())
}
