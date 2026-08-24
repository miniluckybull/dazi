//! Claude CLI 后端实现（默认后端，行为与 M2 前一致）。

use super::{CliBackend, HeadlessSpec, RunOutcome};
use std::path::Path;

#[derive(Default)]
pub struct ClaudeBackend;

impl CliBackend for ClaudeBackend {
    fn name(&self) -> &str {
        "claude"
    }

    fn resolve_bin(&self) -> String {
        // 复用 autopilot 模块的 PATH 探测逻辑（探测 ~/.claude/local、~/.local/bin、
        // /opt/homebrew/bin、/usr/local/bin、/usr/bin，回退裸 "claude"）。
        crate::autopilot::resolve_claude_bin()
    }

    fn build_headless_cmd(
        &self,
        prompt: &str,
        permission_mode: &str,
        cwd: &Path,
    ) -> HeadlessSpec {
        // 与 autopilot::run_claude 保持一致：-p <prompt> --output-format json --permission-mode <mode>
        HeadlessSpec {
            bin: self.resolve_bin(),
            args: vec![
                "-p".to_string(),
                prompt.to_string(),
                "--output-format".to_string(),
                "json".to_string(),
                "--permission-mode".to_string(),
                permission_mode.to_string(),
            ],
            cwd: cwd.to_path_buf(),
        }
    }

    fn build_interactive_cmd(&self, prompt: &str) -> String {
        // 整行 shell 命令：claude "<prompt>"（unix 单引号包裹，windows 双引号 + 转义）。
        let bin = self.resolve_bin();
        format!("{bin} \"{}\"", prompt.replace('\\', "\\\\").replace('"', "\\\""))
    }

    fn build_interactive_plan_cmd(&self, prompt: &str) -> String {
        // plan 模式：claude 只读探索产计划，由 CLI 强制不执行写操作，用户确认后放行。
        format!("{} --permission-mode plan", self.build_interactive_cmd(prompt))
    }

    fn build_continue_cmd(&self) -> String {
        format!("{} -c", self.resolve_bin())
    }

    fn probe(&self) -> Result<String, String> {
        crate::autopilot::probe_claude()
    }

    fn supports_permission_mode(&self) -> bool {
        true
    }

    fn parse_outcome(&self, stdout: &str, stderr: &str) -> Result<RunOutcome, String> {
        // 解析 claude --output-format json 的标准结构
        // （含 result / session_id / usage / is_error / subtype）。
        match super::default_parse_claude_json(stdout) {
            Ok(mut o) => {
                if o.session_id.is_none() && !o.ok && !stderr.trim().is_empty() {
                    o.summary = format!("{}\nstderr: {}", o.summary, stderr);
                }
                Ok(o)
            }
            Err(e) => Ok(RunOutcome {
                ok: false,
                summary: format!("{e}\nstderr: {stderr}"),
                session_id: None,
                usage: None,
                artifacts: Vec::new(),
            }),
        }
    }
}
