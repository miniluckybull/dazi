//! Zcode CLI 后端（占位实现，行为待确认）。
//!
//! 与 kimi 同模式：假设 `zcode` 为入口名，headless `zcode -p <prompt>`，
//! 不支持 `--permission-mode`，交互 `zcode "<prompt>"`，继续 `zcode -c`。
//! 实际参数待用户提供 `zcode --help` 后回填。

use super::{CliBackend, HeadlessSpec, RunOutcome};
use std::path::Path;

#[derive(Default)]
pub struct ZcodeBackend;

impl CliBackend for ZcodeBackend {
    fn name(&self) -> &str {
        "zcode"
    }

    fn resolve_bin(&self) -> String {
        let home = std::env::var("HOME")
            .or_else(|_| std::env::var("USERPROFILE"))
            .unwrap_or_default();
        if !home.is_empty() {
            let candidates = [
                format!("{home}/.local/bin/zcode"),
                format!("{home}/.zcode/bin/zcode"),
                "/opt/homebrew/bin/zcode".to_string(),
                "/usr/local/bin/zcode".to_string(),
                "/usr/bin/zcode".to_string(),
            ];
            for c in candidates {
                if Path::new(&c).exists() {
                    return c;
                }
            }
        }
        "zcode".to_string()
    }

    fn build_headless_cmd(
        &self,
        prompt: &str,
        _permission_mode: &str,
        cwd: &Path,
    ) -> HeadlessSpec {
        HeadlessSpec {
            bin: self.resolve_bin(),
            args: vec!["-p".to_string(), prompt.to_string()],
            cwd: cwd.to_path_buf(),
        }
    }

    fn build_interactive_cmd(&self, prompt: &str) -> String {
        format!(
            "{} \"{}\"",
            self.resolve_bin(),
            prompt.replace('\\', "\\\\").replace('"', "\\\"")
        )
    }

    fn build_continue_cmd(&self) -> String {
        format!("{} -c", self.resolve_bin())
    }

    fn probe(&self) -> Result<String, String> {
        let bin = self.resolve_bin();
        let out = std::process::Command::new(&bin)
            .arg("--version")
            .stdin(std::process::Stdio::null())
            .output()
            .map_err(|e| format!("无法启动 {bin}: {e}"))?;
        if out.status.success() {
            Ok(String::from_utf8_lossy(&out.stdout).trim().to_string())
        } else {
            Err(format!(
                "zcode --version 退出码 {:?}",
                out.status.code()
            ))
        }
    }

    fn supports_permission_mode(&self) -> bool {
        false
    }

    fn parse_outcome(&self, stdout: &str, stderr: &str) -> Result<RunOutcome, String> {
        // zcode 输出格式待确认（用户跑 `zcode --help` 后回填），本轮先按 claude JSON 解析。
        match super::default_parse_claude_json(stdout) {
            Ok(o) => Ok(o),
            Err(_) => Ok(RunOutcome {
                ok: false,
                summary: format!(
                    "zcode 输出无法按 claude JSON 解析（格式待确认）\nstdout: {}\nstderr: {}",
                    &stdout[..stdout.len().min(200)],
                    stderr
                ),
                session_id: None,
                usage: None,
                artifacts: Vec::new(),
            }),
        }
    }
}
