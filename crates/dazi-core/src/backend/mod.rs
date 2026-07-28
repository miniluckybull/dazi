//! CLI 后端抽象（反馈 #14）。
//!
//! dazi 原本所有调用点都硬编码 "claude"。本模块提供 CliBackend trait + 注册表，
//! 允许在不同 CLI 工具（claude / kimi / zcode 等）之间切换而不动调用点。
//!
//! 设计要点：
//! - `resolve_bin` 探测可执行路径，复用 autopilot::resolve_claude_bin 的探测策略，
//!   各后端实现各自的路径列表。
//! - `build_headless_cmd` 产出 `(args, env, cwd)` 三元组，让调用方决定走 pty 还是 Command。
//! - `parse_outcome` 把后端特定的 stdout 解析为统一 `BackendRunOutcome`，
//!   autopilot::run_autopilot 走这个统一结果。

use std::collections::HashMap;
use std::path::Path;
use std::sync::{Arc, RwLock};

/// 后端名（用于持久化偏好 + UI 显示）。
#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub struct BackendName(pub String);

impl BackendName {
    pub const CLAUDE: &'static str = "claude";
    pub const KIMI: &'static str = "kimi";
    pub const ZCODE: &'static str = "zcode";

    pub fn as_str(&self) -> &str {
        &self.0
    }
}

/// headless 命令规格：调用方用 `Command::new(spec.bin).args(spec.args)` 即可。
#[derive(Debug, Clone)]
pub struct HeadlessSpec {
    pub bin: String,
    pub args: Vec<String>,
    /// 工作目录（run_claude 设为项目根）
    pub cwd: std::path::PathBuf,
}

/// CLI 后端能力抽象。实现须是 Send + Sync 以便放入全局注册表。
pub trait CliBackend: Send + Sync {
    /// 后端名（如 "claude"）。
    fn name(&self) -> &str;
    /// 解析可执行文件绝对路径，回退裸名（依赖 PATH）。
    fn resolve_bin(&self) -> String;
    /// 构建 headless 命令（autopilot/plan 用）。permission_mode:
    ///   "bypassPermissions" / "plan" / "default" / "acceptEdits" 等，
    ///   实现可选择是否透传——kimi/zcode 不支持时静默忽略。
    fn build_headless_cmd(
        &self,
        prompt: &str,
        permission_mode: &str,
        cwd: &Path,
    ) -> HeadlessSpec;
    /// 构建交互式启动命令（pty handoff 用，整行 shell 命令）。
    fn build_interactive_cmd(&self, prompt: &str) -> String;
    /// 构建继续上次会话命令（pty continue 用，整行 shell 命令）。
    fn build_continue_cmd(&self) -> String;
    /// 探活：<bin> --version，返回版本串或错误。
    fn probe(&self) -> Result<String, String>;
    /// 是否支持 --permission-mode（kimi/zcode 不支持则 false）。
    fn supports_permission_mode(&self) -> bool;
    /// 解析 headless 命令的 stdout 为统一 RunOutcome。
    /// stderr 用于无 stdout 可解析时附在 summary 后面。
    fn parse_outcome(&self, stdout: &str, stderr: &str) -> Result<RunOutcome, String>;
}

/// 全局后端注册表：进程内单例，按名字查 backend。
/// daemon 和桌面 app 都各持一份（不跨进程同步，靠 config 持久化）。
#[derive(Default)]
pub struct BackendRegistry {
    inner: RwLock<HashMap<String, Arc<dyn CliBackend>>>,
}

impl BackendRegistry {
    pub fn new() -> Self {
        Self::default()
    }

    /// 注册一个后端（同名校验：后注册覆盖前者）。
    pub fn register(&self, backend: Arc<dyn CliBackend>) {
        let mut g = self.inner.write().expect("backend registry poisoned");
        g.insert(backend.name().to_string(), backend);
    }

    /// 按名取后端引用。未注册返 None。
    pub fn get(&self, name: &str) -> Option<Arc<dyn CliBackend>> {
        let g = self.inner.read().expect("backend registry poisoned");
        g.get(name).cloned()
    }

    /// 当前选中的后端（持久化的偏好），回退到 "claude"。
    pub fn current(&self, preferred: Option<&str>) -> Arc<dyn CliBackend> {
        let name = preferred.unwrap_or(BackendName::CLAUDE);
        self.get(name)
            .or_else(|| self.get(BackendName::CLAUDE))
            .expect("ClaudeBackend must be registered before current()")
    }

    /// 列出所有已注册后端名（用于 UI 下拉）。
    pub fn list(&self) -> Vec<String> {
        let g = self.inner.read().expect("backend registry poisoned");
        let mut names: Vec<String> = g.keys().cloned().collect();
        names.sort();
        names
    }
}

// 各后端实现见子模块。
pub mod claude;
pub mod kimi;
pub mod zcode;

/// 内置注册：进程启动时调用一次，把三个后端全注册上。
pub fn build_default_registry() -> BackendRegistry {
    let r = BackendRegistry::new();
    r.register(Arc::new(claude::ClaudeBackend::default()));
    r.register(Arc::new(kimi::KimiBackend::default()));
    r.register(Arc::new(zcode::ZcodeBackend::default()));
    r
}

use std::sync::OnceLock;
static GLOBAL: OnceLock<BackendRegistry> = OnceLock::new();

/// 进程内全局注册表（首次访问时初始化为默认三后端）。
pub fn global() -> &'static BackendRegistry {
    GLOBAL.get_or_init(build_default_registry)
}

// 把 RunOutcome re-export 到 backend 命名空间，方便各 backend 实现引用。
pub use crate::autopilot::RunOutcome;

/// 解析 outcome 的便捷 trait 扩展：让 backend 自选实现，默认 claude 风格 JSON。
/// 多数后端要 override parse_outcome；kimi/zcode 在实现内做对应解析。
pub fn default_parse_claude_json(stdout: &str) -> Result<RunOutcome, String> {
    // 复用 autopilot::parse_outcome 的同款逻辑（迁移成本：让 autopilot 反向依赖本模块，
    // 避免循环依赖——这里直接复制关键解析；后续 autopilot 重构为调用 backend.parse_outcome）。
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
    if found.is_none() {
        if let Ok(v) = serde_json::from_str::<serde_json::Value>(stdout.trim()) {
            found = Some(v);
        }
    }
    let v = found.ok_or_else(|| format!("无法解析 CLI 输出: {}", &stdout[..stdout.len().min(200)]))?;
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
    let usage = v.get("usage").cloned();
    let ok = !is_error && subtype != "error_max_turns" && subtype != "error_during_execution";
    let summary = if result.trim().is_empty() {
        format!("CLI 返回(subtype={subtype}) 无 result 文本")
    } else {
        result
    };
    Ok(RunOutcome {
        ok,
        summary,
        session_id,
        usage,
    })
}
