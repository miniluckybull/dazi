//! daemon_client — 桌面 app ↔ 远程 daemon 连接的 MVP（反馈 #12）。
//!
//! 范围限定：仅实现"ping 健康检查"（GET /health），让用户能验证网络可达性。
//! 完整功能（pair / auth / 业务转发）留 v3.1。
//!
//! 配置存到 ~/.dazi/daemon.json（base64 编码 + 0600），同 credentials 模式。

use base64::Engine;
use serde::{Deserialize, Serialize};
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct DaemonConfig {
    pub host: String, // "192.168.0.191" 或 "gpu4090.local"
    pub port: u16,    // 7878
    #[serde(default)]
    pub pin: String, // 预留：本轮不用于认证
}

fn home_dir() -> Result<PathBuf, String> {
    std::env::var("HOME")
        .or_else(|_| std::env::var("USERPROFILE"))
        .map(PathBuf::from)
        .map_err(|e| format!("无法读取 HOME/USERPROFILE: {e}"))
}

fn config_path() -> Result<PathBuf, String> {
    let p = home_dir()?.join(".dazi").join("daemon.json");
    if let Some(parent) = p.parent() {
        std::fs::create_dir_all(parent).map_err(|e| format!("创建 ~/.dazi 失败: {e}"))?;
    }
    Ok(p)
}

pub fn get_daemon_config() -> Result<DaemonConfig, String> {
    let p = config_path()?;
    if !p.exists() {
        return Ok(DaemonConfig::default());
    }
    let raw = std::fs::read_to_string(&p).map_err(|e| e.to_string())?;
    let bytes = base64::engine::general_purpose::STANDARD
        .decode(raw.trim())
        .map_err(|e| format!("base64 解码失败: {e}"))?;
    serde_json::from_slice(&bytes).map_err(|e| format!("JSON 解析失败: {e}"))
}

pub fn save_daemon_config(c: &DaemonConfig) -> Result<(), String> {
    let p = config_path()?;
    let raw = serde_json::to_vec(c).map_err(|e| e.to_string())?;
    let encoded = base64::engine::general_purpose::STANDARD.encode(&raw);
    std::fs::write(&p, encoded).map_err(|e| e.to_string())?;
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        let _ = std::fs::set_permissions(&p, std::fs::Permissions::from_mode(0o600));
    }
    Ok(())
}

/// ping 远程 daemon：GET {host}:{port}/health，5s 超时。
pub async fn ping(host: &str, port: u16) -> Result<serde_json::Value, String> {
    let url = format!("http://{host}:{port}/health");
    let resp = reqwest::Client::builder()
        .connect_timeout(std::time::Duration::from_secs(5))
        .timeout(std::time::Duration::from_secs(5))
        .build()
        .map_err(|e| format!("创建客户端失败: {e}"))?
        .get(&url)
        .send()
        .await
        .map_err(|e| format!("连接 {url} 失败: {e}"))?;
    if !resp.status().is_success() {
        return Err(format!("HTTP {}", resp.status().as_u16()));
    }
    resp.json::<serde_json::Value>()
        .await
        .map_err(|e| format!("解析响应失败: {e}"))
}
