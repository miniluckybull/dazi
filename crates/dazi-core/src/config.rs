use serde::{Deserialize, Serialize};
use std::path::PathBuf;

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
pub struct AppConfig {
    pub workspace: Option<PathBuf>,
}

fn home_dir() -> Result<PathBuf, String> {
    std::env::var("HOME")
        .or_else(|_| std::env::var("USERPROFILE"))
        .map(PathBuf::from)
        .map_err(|e| format!("无法读取 HOME/USERPROFILE 环境变量: {e}"))
}

/// 配置文件固定在 ~/.dazi/config.json，与全局记忆同处一个目录，
/// 这样桌面 app 与 daemon 都能在无 AppHandle 的情况下定位到同一份配置。
pub fn config_path() -> Result<PathBuf, String> {
    let dir = home_dir()?.join(".dazi");
    std::fs::create_dir_all(&dir).map_err(|e| format!("创建 ~/.dazi 失败: {e}"))?;
    Ok(dir.join("config.json"))
}

pub fn load() -> Result<AppConfig, String> {
    let path = config_path()?;
    if !path.exists() {
        return Ok(AppConfig::default());
    }
    let raw = std::fs::read_to_string(&path).map_err(|e| e.to_string())?;
    serde_json::from_str(&raw).map_err(|e| e.to_string())
}

pub fn save(cfg: &AppConfig) -> Result<(), String> {
    let path = config_path()?;
    let raw = serde_json::to_string_pretty(cfg).map_err(|e| e.to_string())?;
    std::fs::write(&path, raw).map_err(|e| e.to_string())
}
