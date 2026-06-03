// autopilot.rs — 无人值守 headless 运行 claude，把到期任务自动推进并回收结果。
use std::io::Read;
use std::os::unix::process::CommandExt;
use std::path::Path;
use std::process::{Command, Stdio};
use std::time::Duration;

/// 单次自动执行的结果。
#[derive(Debug, Clone)]
pub struct RunOutcome {
    pub ok: bool,
    /// 给 journal / 通知用的简短摘要（成功时是 result 摘要，失败时是错误信息）。
    pub summary: String,
    pub session_id: Option<String>,
}

const TIMEOUT_SECS: u64 = 600; // 10 分钟硬超时
const SUMMARY_MAX: usize = 600; // journal/run.message 截断长度

/// 解析 claude 可执行文件路径。GUI app 从 Finder 启动时 PATH 精简，
/// 拿不到 /opt/homebrew/bin，所以显式探测常见位置，最后回退裸 "claude"。
pub fn resolve_claude_bin() -> String {
    if let Ok(home) = std::env::var("HOME") {
        let candidates = [
            format!("{home}/.claude/local/claude"),
            "/opt/homebrew/bin/claude".to_string(),
            "/usr/local/bin/claude".to_string(),
        ];
        for c in candidates {
            if Path::new(&c).exists() {
                return c;
            }
        }
    }
    "claude".to_string()
}

/// claude 探活：跑 `claude --version`（快、不耗 token、不需登录态），
/// 用于 daemon 启动自检。Ok(版本串) / Err(原因)。
pub fn probe_claude() -> Result<String, String> {
    let bin = resolve_claude_bin();
    let inner = format!("{} --version", shell_single_quote(&bin));
    let out = Command::new("zsh")
        .arg("-lc")
        .arg(&inner)
        .stdin(Stdio::null())
        .output()
        .map_err(|e| format!("无法启动 claude: {e}"))?;
    if out.status.success() {
        Ok(String::from_utf8_lossy(&out.stdout).trim().to_string())
    } else {
        Err(format!(
            "claude --version 退出码 {:?}: {}",
            out.status.code(),
            String::from_utf8_lossy(&out.stderr).trim()
        ))
    }
}

/// 截断到 SUMMARY_MAX 字符，避免 journal / meta.yml 被超长输出撑爆。
fn truncate(s: &str) -> String {
    let t = s.trim();
    if t.chars().count() <= SUMMARY_MAX {
        t.to_string()
    } else {
        let cut: String = t.chars().take(SUMMARY_MAX).collect();
        format!("{cut}…（已截断）")
    }
}

/// 从 claude --output-format json 的 stdout 里提取结果。
/// 登录 shell 可能混入 rc 噪音，所以扫描所有行，取最后一个能解析成
/// 含 "result"/"session_id" 的 JSON 对象。
fn parse_outcome(stdout: &str) -> RunOutcome {
    let mut found: Option<serde_json::Value> = None;
    for line in stdout.lines() {
        let line = line.trim();
        if !line.starts_with('{') {
            continue;
        }
        if let Ok(v) = serde_json::from_str::<serde_json::Value>(line) {
            if v.get("result").is_some() || v.get("session_id").is_some() {
                found = Some(v);
            }
        }
    }
    // 整段也试一次（非逐行输出的情况）。
    if found.is_none() {
        if let Ok(v) = serde_json::from_str::<serde_json::Value>(stdout.trim()) {
            found = Some(v);
        }
    }
    match found {
        Some(v) => {
            let is_error = v
                .get("is_error")
                .and_then(|b| b.as_bool())
                .unwrap_or(false);
            let subtype = v.get("subtype").and_then(|s| s.as_str()).unwrap_or("");
            let result = v
                .get("result")
                .and_then(|s| s.as_str())
                .unwrap_or("")
                .to_string();
            let session_id = v
                .get("session_id")
                .and_then(|s| s.as_str())
                .map(|s| s.to_string());
            let ok = !is_error && subtype != "error_max_turns" && subtype != "error_during_execution";
            let summary = if result.trim().is_empty() {
                format!("claude 返回(subtype={subtype}) 无 result 文本")
            } else {
                truncate(&result)
            };
            RunOutcome { ok, summary, session_id }
        }
        None => RunOutcome {
            ok: false,
            summary: format!("无法解析 claude 输出:\n{}", truncate(stdout)),
            session_id: None,
        },
    }
}

/// 单引号包裹用于 zsh：把 ' 替换成 '\'' 。
fn shell_single_quote(s: &str) -> String {
    format!("'{}'", s.replace('\'', "'\\''"))
}

/// 杀掉整个进程组（pgid 为 zsh 组长的 pid）：先 TERM 给清理机会，再 KILL 兜底。
/// `kill -<n> -<pgid>` 的负号表示把信号发给整个进程组。
fn kill_group(pgid: u32) {
    let _ = Command::new("kill")
        .arg("-TERM")
        .arg(format!("-{pgid}"))
        .status();
    std::thread::sleep(Duration::from_millis(500));
    let _ = Command::new("kill")
        .arg("-KILL")
        .arg(format!("-{pgid}"))
        .status();
}

/// headless 运行 claude 执行 autopilot prompt（bypassPermissions，真正改文件/跑命令）。
pub fn run_autopilot(
    project_path: &Path,
    prompt: &str,
    model: Option<&str>,
) -> Result<RunOutcome, String> {
    run_claude(project_path, prompt, model, "bypassPermissions")
}

/// plan 模式跑 claude：只产出计划、不执行任何写操作或命令（由 claude CLI 强制保证）。
/// 用于手机审批的 dry-run 阶段——把计划推给用户批准后，再 run_autopilot 真正执行。
pub fn run_plan(
    project_path: &Path,
    prompt: &str,
    model: Option<&str>,
) -> Result<RunOutcome, String> {
    run_claude(project_path, prompt, model, "plan")
}

/// headless 运行 claude 的核心实现。工作目录设为项目根，
/// 通过登录 shell 拿到用户 PATH，带硬超时，解析 JSON 结果。
/// permission_mode：plan（只产计划）/ bypassPermissions（无人值守执行）。
fn run_claude(
    project_path: &Path,
    prompt: &str,
    model: Option<&str>,
    permission_mode: &str,
) -> Result<RunOutcome, String> {
    let bin = resolve_claude_bin();
    // 拼 claude 命令：-p 非交互 + json 输出 + 指定权限模式。
    let mut inner = format!(
        "{} -p {} --output-format json --permission-mode {}",
        shell_single_quote(&bin),
        shell_single_quote(prompt),
        permission_mode
    );
    if let Some(m) = model {
        if !m.trim().is_empty() {
            inner.push_str(" --model ");
            inner.push_str(&shell_single_quote(m));
        }
    }

    let mut child = Command::new("zsh")
        .arg("-lc")
        .arg(&inner)
        .current_dir(project_path)
        .stdin(Stdio::null())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        // 让 zsh 成为新进程组组长（pgid == 它的 pid），超时时可整组杀掉，
        // 避免只杀 zsh 而 claude 子进程变孤儿继续在后台改文件。
        .process_group(0)
        .spawn()
        .map_err(|e| format!("启动 claude 失败: {e}"))?;

    // 后台线程持续抽干 stdout/stderr，避免管道写满（>64KB）导致 claude 阻塞、假超时。
    let mut out_pipe = child.stdout.take();
    let mut err_pipe = child.stderr.take();
    let out_reader = std::thread::spawn(move || {
        let mut s = String::new();
        if let Some(h) = out_pipe.as_mut() {
            let _ = h.read_to_string(&mut s);
        }
        s
    });
    let err_reader = std::thread::spawn(move || {
        let mut s = String::new();
        if let Some(h) = err_pipe.as_mut() {
            let _ = h.read_to_string(&mut s);
        }
        s
    });

    // 轮询 try_wait 实现硬超时，保持对 child 的所有权以便超时时 kill。
    // pgid == zsh 的 pid（上面 process_group(0) 设的），用它杀整个进程组。
    let pgid = child.id();
    let start = std::time::Instant::now();
    let timed_out = loop {
        match child.try_wait() {
            Ok(Some(_status)) => break false,
            Ok(None) => {
                if start.elapsed() >= Duration::from_secs(TIMEOUT_SECS) {
                    kill_group(pgid);
                    let _ = child.wait();
                    break true;
                }
                std::thread::sleep(Duration::from_millis(500));
            }
            Err(e) => return Err(format!("等待 claude 进程失败: {e}")),
        }
    };

    if timed_out {
        return Err(format!(
            "claude 执行超时（>{TIMEOUT_SECS}s），已终止本次自动执行"
        ));
    }

    let stdout = out_reader.join().unwrap_or_default();
    let stderr = err_reader.join().unwrap_or_default();

    let mut outcome = parse_outcome(&stdout);
    // stdout 完全没拿到可解析结果时，把 stderr 并进摘要方便排查。
    if outcome.session_id.is_none() && !outcome.ok && !stderr.trim().is_empty() {
        outcome.summary = format!("{}\nstderr: {}", outcome.summary, truncate(&stderr));
    }
    Ok(outcome)
}

/// 把一次自动执行结果追加进项目 .dazi/journal.md。
pub fn append_autopilot_journal(project_path: &Path, outcome: &RunOutcome) -> Result<(), String> {
    let dir = project_path.join(".dazi");
    std::fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    let path = dir.join("journal.md");
    let now = chrono::Local::now().format("%Y-%m-%d %H:%M");
    let status = if outcome.ok { "成功" } else { "失败" };
    let sid = outcome
        .session_id
        .as_deref()
        .map(|s| format!("\n- session: {s}"))
        .unwrap_or_default();
    let block = format!(
        "\n## {now} · 自动执行（{status}）\n- {}{sid}\n",
        outcome.summary.replace('\n', "\n  ")
    );
    let mut existing = std::fs::read_to_string(&path).unwrap_or_default();
    existing.push_str(&block);
    std::fs::write(&path, existing).map_err(|e| e.to_string())?;
    Ok(())
}
