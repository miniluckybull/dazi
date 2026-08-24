//! Kimi CLI 后端（占位实现，行为待用户确认实际 CLI 形态后细化）。
//!
//! 假设（待确认）：kimi CLI 类似 claude，入口名 `kimi`，支持 `-p <prompt>` headless
//! 但**不支持** `--permission-mode`（kimi 无 yes 确认流或机制不同），交互模式
//! `kimi "<prompt>"`，继续 `kimi -c`。
//!
//! 实际接入需要用户在本机跑 `kimi --help` 后回填具体参数。

use super::{CliBackend, HeadlessSpec, RunOutcome};
use std::path::Path;

#[derive(Default)]
pub struct KimiBackend;

impl CliBackend for KimiBackend {
    fn name(&self) -> &str {
        "kimi"
    }

    fn resolve_bin(&self) -> String {
        let home = std::env::var("HOME")
            .or_else(|_| std::env::var("USERPROFILE"))
            .unwrap_or_default();
        if !home.is_empty() {
            let candidates = [
                format!("{home}/.local/bin/kimi"),
                format!("{home}/.kimi/bin/kimi"),
                "/opt/homebrew/bin/kimi".to_string(),
                "/usr/local/bin/kimi".to_string(),
                "/usr/bin/kimi".to_string(),
            ];
            for c in candidates {
                if Path::new(&c).exists() {
                    return c;
                }
            }
        }
        "kimi".to_string()
    }

    fn build_headless_cmd(
        &self,
        prompt: &str,
        _permission_mode: &str,
        cwd: &Path,
    ) -> HeadlessSpec {
        // kimi 不支持 --permission-mode：忽略该参数。
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
                "kimi --version 退出码 {:?}",
                out.status.code()
            ))
        }
    }

    fn supports_permission_mode(&self) -> bool {
        false
    }

    fn parse_outcome(&self, stdout: &str, stderr: &str) -> Result<RunOutcome, String> {
        // kimi 输出格式待确认（用户跑 `kimi --help` 后回填），本轮先按 claude JSON 解析。
        // 解析失败时把 stdout 前 200 字塞进 summary，方便用户排错。
        match super::default_parse_claude_json(stdout) {
            Ok(o) => Ok(o),
            Err(_) => Ok(RunOutcome {
                ok: false,
                summary: format!(
                    "kimi 输出无法按 claude JSON 解析（格式待确认）\nstdout: {}\nstderr: {}",
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
