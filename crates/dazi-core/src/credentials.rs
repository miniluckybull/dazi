//! credentials — 简单凭据存储（反馈 #13 MVP）。
//!
//! 存到 ~/.dazi/credentials.json：
//! - 编码：base64（仅防误看，非真加密；keychain 集成留待 v3.1）
//! - 文件权限：0600（Unix 强制，Windows 跳过）
//! - schema 简单：{ "anthropic": { base_url, api_key, provider } }
//!
//! 注意：本模块不提供加密强度保证。生产环境建议替换为 tauri-plugin-keyring / OS keychain。

use base64::Engine;
use serde::{Deserialize, Serialize};
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct Credential {
    pub base_url: String,
    pub api_key: String,
    pub provider: String, // "anthropic" / "openai" / "custom"
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct Credentials {
    #[serde(default)]
    pub anthropic: Option<Credential>,
    #[serde(default)]
    pub openai: Option<Credential>,
    #[serde(default)]
    pub custom: Option<Credential>,
}

fn home_dir() -> Result<PathBuf, String> {
    std::env::var("HOME")
        .or_else(|_| std::env::var("USERPROFILE"))
        .map(PathBuf::from)
        .map_err(|e| format!("无法读取 HOME/USERPROFILE: {e}"))
}

fn cred_path() -> Result<PathBuf, String> {
    let p = home_dir()?.join(".dazi").join("credentials.json");
    if let Some(parent) = p.parent() {
        std::fs::create_dir_all(parent).map_err(|e| format!("创建 ~/.dazi 失败: {e}"))?;
    }
    Ok(p)
}

fn read_cred() -> Result<Credentials, String> {
    let p = cred_path()?;
    if !p.exists() {
        return Ok(Credentials::default());
    }
    let raw = std::fs::read_to_string(&p).map_err(|e| e.to_string())?;
    let bytes = base64::engine::general_purpose::STANDARD
        .decode(raw.trim())
        .map_err(|e| format!("base64 解码失败: {e}"))?;
    serde_json::from_slice(&bytes).map_err(|e| format!("JSON 解析失败: {e}"))
}

fn write_cred(c: &Credentials) -> Result<(), String> {
    let p = cred_path()?;
    let raw = serde_json::to_vec(c).map_err(|e| e.to_string())?;
    let encoded = base64::engine::general_purpose::STANDARD.encode(&raw);
    std::fs::write(&p, encoded).map_err(|e| e.to_string())?;
    // Unix 收紧权限
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        let _ = std::fs::set_permissions(&p, std::fs::Permissions::from_mode(0o600));
    }
    Ok(())
}

pub fn get_credentials() -> Result<Credentials, String> {
    read_cred()
}

pub fn save_credential(slot: &str, cred: Credential) -> Result<(), String> {
    let mut c = read_cred()?;
    match slot {
        "anthropic" => c.anthropic = Some(cred),
        "openai" => c.openai = Some(cred),
        "custom" => c.custom = Some(cred),
        _ => return Err(format!("未知凭据槽: {slot}")),
    }
    write_cred(&c)
}

pub fn clear_credential(slot: &str) -> Result<(), String> {
    let mut c = read_cred()?;
    match slot {
        "anthropic" => c.anthropic = None,
        "openai" => c.openai = None,
        "custom" => c.custom = None,
        _ => return Err(format!("未知凭据槽: {slot}")),
    }
    write_cred(&c)
}

/// 环境检测（反馈 #13）：node / claude / 网络 / 关键目录。
/// 返回 Markdown 友好的多行报告，dazi SettingsPanel 弹窗展示。
pub fn check_environment() -> String {
    let mut out = String::new();
    out.push_str("## dazi 环境检测\n\n");
    // node
    match std::process::Command::new("node")
        .arg("--version")
        .stdin(std::process::Stdio::null())
        .output()
    {
        Ok(o) if o.status.success() => {
            let v = String::from_utf8_lossy(&o.stdout).trim().to_string();
            out.push_str(&format!("- ✓ node: {v}\n"));
        }
        Ok(_) => out.push_str("- ✗ node: 已安装但退出非零\n"),
        Err(_) => out.push_str("- ✗ node: 未找到（需要先安装 Node.js 18+）\n"),
    }
    // claude
    use crate::backend::CliBackend;
    match crate::backend::claude::ClaudeBackend::default().probe() {
        Ok(v) => out.push_str(&format!("- ✓ claude: {v}\n")),
        Err(e) => out.push_str(&format!("- ✗ claude: {e}（请先运行 `claude --login` 或安装 Claude CLI）\n")),
    }
    // ~/.dazi
    let home = home_dir().ok();
    if let Some(h) = home {
        let dazi_dir = h.join(".dazi");
        if dazi_dir.exists() {
            out.push_str("- ✓ ~/.dazi/ 已创建\n");
        } else {
            out.push_str(&format!(
                "- ⚠ ~/.dazi/ 不存在（dazi 会在首次写入时自动创建：{}）\n",
                dazi_dir.display()
            ));
        }
    }
    // 网络（粗略探测）
    out.push_str("- 提示: 启动 dazi 后请在「我的记忆 → CLI 后端」中运行「测试连通性」验证 API key。\n");
    out
}
