//! 桌面端配置适配层：真正的读写在 dazi_core::config（~/.dazi/config.json）。
//! 这里只负责一次性把旧版 Tauri app_config_dir 下的 config.json 迁移过去，
//! 保证升级后桌面 app 不丢失已设置的 workspace。
pub use dazi_core::config::{load, save, AppConfig};

use std::path::PathBuf;

fn legacy_config_path(app: &tauri::AppHandle) -> Option<PathBuf> {
    use tauri::Manager;
    let dir = app.path().app_config_dir().ok()?;
    Some(dir.join("config.json"))
}

/// 若新位置（~/.dazi/config.json）尚无配置、而旧 Tauri 配置目录里有，
/// 则迁移过来。在 setup 时调用一次即可。幂等：新位置已存在就跳过。
pub fn migrate_legacy_config(app: &tauri::AppHandle) {
    let Ok(new_path) = dazi_core::config::config_path() else {
        return;
    };
    if new_path.exists() {
        return;
    }
    let Some(old_path) = legacy_config_path(app) else {
        return;
    };
    if !old_path.exists() {
        return;
    }
    if let Ok(raw) = std::fs::read_to_string(&old_path) {
        if let Ok(cfg) = serde_json::from_str::<AppConfig>(&raw) {
            let _ = save(&cfg);
        }
    }
}
