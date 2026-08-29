// autopilot.rs — 无人值守 headless 运行 claude，把到期任务自动推进并回收结果。
use std::io::Read;
#[cfg(unix)]
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
    /// 原始 usage 字段（input_tokens / output_tokens / cache_creation_input_tokens 等），
    /// 供 #16 token 监控落盘与月度统计；解析失败时为 None。
    pub usage: Option<serde_json::Value>,
    /// 本次运行在项目目录内新建/修改的文件（相对路径，已排除内部目录，上限 ARTIFACTS_MAX）。
    /// 仅 run_autopilot 真正执行时填充；plan 模式不 diff，为空。
    pub artifacts: Vec<String>,
}

const TIMEOUT_SECS: u64 = 600; // 10 分钟硬超时
const SUMMARY_MAX: usize = 600; // journal/run.message 截断长度
/// 运行记录 / TaskCompleted 事件携带的结尾摘要长度（取输出末尾，~500 字）。
pub const TAIL_SUMMARY_MAX: usize = 500;
/// artifacts 清单上限，防止误扫大包目录时防爆。
pub const ARTIFACTS_MAX: usize = 50;

/// 取输出末尾最多 max 个字符作为结尾摘要（纯文本截断，按 char 边界切割）。
pub fn tail_summary(s: &str, max: usize) -> String {
    let t = s.trim();
    let n = t.chars().count();
    if n <= max {
        t.to_string()
    } else {
        t.chars().skip(n - max).collect()
    }
}

/// 快照里不参与 diff 的顶层目录：dazi 内部目录、VCS、依赖与构建产物。
const IGNORED_DIRS: [&str; 4] = [".dazi", ".git", "node_modules", "target"];

/// 项目目录文件快照：相对路径 → (mtime 秒, 字节数)。递归遍历，跳过 IGNORED_DIRS
/// 与其余隐藏目录（. 开头）。仅用于执行前后 diff，容忍个别文件读取失败。
pub type FileSnapshot = std::collections::HashMap<String, (i64, u64)>;

pub fn snapshot_files(root: &Path) -> FileSnapshot {
    let mut map = FileSnapshot::new();
    let mut stack = vec![root.to_path_buf()];
    while let Some(dir) = stack.pop() {
        let Ok(read) = std::fs::read_dir(&dir) else { continue };
        for entry in read.flatten() {
            let path = entry.path();
            let name = entry.file_name().to_string_lossy().to_string();
            let Ok(ft) = entry.file_type() else { continue };
            if ft.is_dir() {
                // 隐藏目录与已知内部/依赖目录一律跳过。
                if name.starts_with('.') || IGNORED_DIRS.contains(&name.as_str()) {
                    continue;
                }
                stack.push(path);
            } else if ft.is_file() {
                let Ok(meta) = entry.metadata() else { continue };
                let mtime = meta
                    .modified()
                    .ok()
                    .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
                    .map(|d| d.as_secs() as i64)
                    .unwrap_or(0);
                let rel = path
                    .strip_prefix(root)
                    .map(|p| p.to_string_lossy().to_string())
                    .unwrap_or_else(|_| path.to_string_lossy().to_string());
                map.insert(rel, (mtime, meta.len()));
            }
        }
    }
    map
}

/// 执行前后快照 diff：新建或 mtime/大小变化的文件相对路径，排序后截断到 ARTIFACTS_MAX。
pub fn diff_snapshots(before: &FileSnapshot, after: &FileSnapshot) -> Vec<String> {
    let mut changed: Vec<String> = after
        .iter()
        .filter(|(path, stat)| before.get(*path) != Some(stat))
        .map(|(path, _)| path.clone())
        .collect();
    changed.sort();
    changed.truncate(ARTIFACTS_MAX);
    changed
}

/// 解析 claude 可执行文件路径。GUI app 从 Finder 启动 / systemd 启动时 PATH 精简，
/// 拿不到 homebrew、npm global 等目录，所以显式探测常见位置，最后回退裸 "claude"。
pub fn resolve_claude_bin() -> String {
    let home = std::env::var("HOME")
        .or_else(|_| std::env::var("USERPROFILE"))
        .unwrap_or_default();
    if !home.is_empty() {
        let candidates = [
            format!("{home}/.claude/local/claude"),
            format!("{home}/.local/bin/claude"),
            "/opt/homebrew/bin/claude".to_string(), // macOS Homebrew
            "/usr/local/bin/claude".to_string(),
            "/usr/bin/claude".to_string(), // Linux 包管理常见位置
        ];
        for c in candidates {
            if Path::new(&c).exists() {
                return c;
            }
        }
    }
    "claude".to_string()
}

/// 解析登录 shell：用 `<shell> -lc` 走登录态拿回 PATH 与 ~/.claude 凭证。
/// macOS 默认 zsh、Linux 默认 bash，运行时探测以同一份代码两端可用。
/// `-lc` 语法 zsh 与 bash 通用。
/// Windows 上没有 Unix shell，回退到 PowerShell。
pub fn login_shell() -> String {
    #[cfg(windows)]
    {
        return "powershell.exe".to_string();
    }
    #[cfg(unix)]
    {
        for c in ["/bin/zsh", "/usr/bin/zsh", "/bin/bash", "/usr/bin/bash"] {
            if Path::new(c).exists() {
                return c.to_string();
            }
        }
        "bash".to_string()
    }
}

/// claude 探活：跑 `claude --version`（快、不耗 token、不需登录态），
/// 用于 daemon 启动自检。Ok(版本串) / Err(原因)。
pub fn probe_claude() -> Result<String, String> {
    let bin = resolve_claude_bin();
    let inner = format!("{} --version", shell_single_quote(&bin));
    let out = Command::new(login_shell())
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
/// 备注：M3 重构后 parse_outcome 已迁移到 backend::default_parse_claude_json，
/// 本函数保留为 lib 私有工具（未来若 journal 落盘前需要截断仍可能复用）。
#[allow(dead_code)]
fn truncate(s: &str) -> String {
    let t = s.trim();
    if t.chars().count() <= SUMMARY_MAX {
        t.to_string()
    } else {
        let cut: String = t.chars().take(SUMMARY_MAX).collect();
        format!("{cut}…（已截断）")
    }
}

// parse_outcome 已迁移到 backend::default_parse_claude_json（M3 #14 重构），
// 这里不再保留私有解析函数，避免两处实现漂移。

/// 单引号包裹用于 POSIX shell（zsh/bash 通用）：把 ' 替换成 '\'' 。
pub fn shell_single_quote(s: &str) -> String {
    format!("'{}'", s.replace('\'', "'\\''"))
}

/// 杀掉整个进程组（pgid 为 shell 组长的 pid）：先 TERM 给清理机会，再 KILL 兜底。
/// `kill -<n> -<pgid>` 的负号表示把信号发给整个进程组。
#[cfg(unix)]
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

/// Windows 没有进程组概念，超时时直接杀掉子进程。
#[cfg(windows)]
fn kill_child(child: &mut std::process::Child) {
    let _ = child.kill();
}

/// headless 运行 claude 执行 autopilot prompt（bypassPermissions，真正改文件/跑命令）。
/// 执行前后做文件快照 diff，把新建/修改的文件清单挂到 outcome.artifacts。
pub fn run_autopilot(
    project_path: &Path,
    prompt: &str,
    model: Option<&str>,
) -> Result<RunOutcome, String> {
    let before = snapshot_files(project_path);
    let mut outcome = run_claude(project_path, prompt, model, "bypassPermissions")?;
    let after = snapshot_files(project_path);
    outcome.artifacts = diff_snapshots(&before, &after);
    Ok(outcome)
}

/// plan 模式跑 claude：只产出计划、不执行任何写操作或命令（由后端 CLI 强制保证）。
/// 用于手机审批的 dry-run 阶段——把计划推给用户批准后，再 run_autopilot 真正执行。
///
/// 后端不支持 `--permission-mode` 时**拒绝执行**，而不是降级。
/// 降级的后果不是「少一层保护」而是反的：调用方与用户都以为这是只读预演，
/// 实际却是一次带写权限的真实运行——人批准的是一件已经做完的事。
/// `supports_permission_mode` 此前声明了却从未被查询，正是这个漏洞。
pub fn run_plan(
    project_path: &Path,
    prompt: &str,
    model: Option<&str>,
) -> Result<RunOutcome, String> {
    let cfg = crate::config::load().unwrap_or_default();
    let backend = crate::backend::global().current(cfg.backend.as_deref());
    check_plan_mode_supported(backend.name(), backend.supports_permission_mode())?;
    run_claude(project_path, prompt, model, "plan")
}

/// plan 模式的前置校验，单独拆出以便测试（不依赖全局配置与真实后端）。
fn check_plan_mode_supported(name: &str, supported: bool) -> Result<(), String> {
    if supported {
        return Ok(());
    }
    Err(format!(
        "后端 {name} 不支持 --permission-mode，无法保证「只出计划不动手」。\
         请切换到支持该参数的后端（如 claude）再用「先出计划」。"
    ))
}

/// headless 运行后端 CLI 的核心实现。工作目录设为项目根，bin 由 backend trait 解析，
/// 通过后端 trait 构造 headless 命令（默认 claude：-p <prompt> --output-format json
/// --permission-mode <mode>），带硬超时，由后端 trait 解析结果。
/// permission_mode：plan（只产计划）/ bypassPermissions（无人值守执行）/
/// acceptEdits 等。后端若不支持该参数会自动忽略。
fn run_claude(
    project_path: &Path,
    prompt: &str,
    model: Option<&str>,
    permission_mode: &str,
) -> Result<RunOutcome, String> {
    use crate::backend;
    let cfg = crate::config::load().unwrap_or_default();
    let backend = backend::global().current(cfg.backend.as_deref());
    let spec = backend.build_headless_cmd(prompt, permission_mode, project_path);
    let bin = spec.bin.clone();
    let mut cmd = Command::new(&spec.bin);
    cmd.args(&spec.args)
        .current_dir(&spec.cwd)
        .stdin(Stdio::null())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());
    // claude 风格 headless 支持 --model name；其他后端若不支持可忽略。
    if let Some(m) = model {
        if !m.trim().is_empty() {
            cmd.arg("--model").arg(m);
        }
    }
    // Unix：让 CLI 成为新进程组组长，超时可整组杀掉，避免子进程变孤儿。
    #[cfg(unix)]
    {
        cmd.process_group(0);
    }
    let mut child = cmd
        .spawn()
        .map_err(|e| format!("启动 {bin} 失败: {e}"))?;

    // 后台线程持续抽干 stdout/stderr，避免管道写满（>64KB）导致 CLI 阻塞、假超时。
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
    // Unix：pgid == CLI 的 pid（上面 process_group(0) 设的），用它杀整个进程组。
    #[cfg(unix)]
    let pgid = child.id();
    let start = std::time::Instant::now();
    let timed_out = loop {
        match child.try_wait() {
            Ok(Some(_status)) => break false,
            Ok(None) => {
                if start.elapsed() >= Duration::from_secs(TIMEOUT_SECS) {
                    #[cfg(unix)]
                    kill_group(pgid);
                    #[cfg(windows)]
                    kill_child(&mut child);
                    let _ = child.wait();
                    break true;
                }
                std::thread::sleep(Duration::from_millis(500));
            }
            Err(e) => return Err(format!("等待 {bin} 进程失败: {e}")),
        }
    };

    if timed_out {
        return Err(format!(
            "{bin} 执行超时（>{TIMEOUT_SECS}s），已终止本次自动执行"
        ));
    }

    let stdout = out_reader.join().unwrap_or_default();
    let stderr = err_reader.join().unwrap_or_default();

    backend.parse_outcome(&stdout, &stderr)
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

#[cfg(test)]
mod tests {
    use super::*;

    /// plan 模式必须是「不支持就拒绝」而非「不支持就照跑」。
    /// 后者会让一次带写权限的真实运行被当成只读预演推给用户审批。
    #[test]
    fn plan_mode_refuses_unsupported_backend() {
        assert!(check_plan_mode_supported("claude", true).is_ok());
        let err = check_plan_mode_supported("kimi", false).unwrap_err();
        assert!(err.contains("kimi"), "错误信息要指名后端，否则用户不知道换什么");
        assert!(err.contains("--permission-mode"));
    }

    #[test]
    fn tail_summary_keeps_short_and_tails_long() {
        assert_eq!(tail_summary("  短文本  ", 500), "短文本");
        let long: String = (0..600).map(|i| char::from_digit(i % 10, 10).unwrap()).collect();
        let t = tail_summary(&long, 500);
        assert_eq!(t.chars().count(), 500);
        assert!(t.ends_with('9')); // 取的是末尾
    }

    #[test]
    fn snapshot_diff_finds_new_and_modified_skips_internal() {
        let root = std::env::temp_dir().join(format!("dazi-snap-{}", std::process::id()));
        let _ = std::fs::remove_dir_all(&root);
        std::fs::create_dir_all(root.join(".dazi")).unwrap();
        std::fs::create_dir_all(root.join("src")).unwrap();
        std::fs::write(root.join("old.txt"), "v1").unwrap();
        std::fs::write(root.join(".dazi/journal.md"), "j").unwrap();
        let before = snapshot_files(&root);
        // 新建 + 修改 + 内部目录变更（应被忽略）
        std::fs::write(root.join("src/new.rs"), "fn main(){}").unwrap();
        std::fs::write(root.join("old.txt"), "v2-longer").unwrap();
        std::fs::write(root.join(".dazi/journal.md"), "j2").unwrap();
        let after = snapshot_files(&root);
        let artifacts = diff_snapshots(&before, &after);
        assert!(artifacts.iter().any(|p| p.ends_with("src/new.rs")));
        assert!(artifacts.iter().any(|p| p.ends_with("old.txt")));
        assert!(!artifacts.iter().any(|p| p.contains(".dazi")));
        let _ = std::fs::remove_dir_all(&root);
    }
}
