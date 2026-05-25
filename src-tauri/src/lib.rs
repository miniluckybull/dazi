mod config;
mod project;

use std::path::{Path, PathBuf};
use std::process::Command;

use config::AppConfig;
use project::{MetaPatch, ProjectInit, ProjectMeta, ProjectSummary, ReferenceEntry};
use tauri_plugin_opener::OpenerExt;

#[tauri::command]
fn get_config(app: tauri::AppHandle) -> Result<AppConfig, String> {
    config::load(&app)
}

#[tauri::command]
fn set_workspace(app: tauri::AppHandle, path: PathBuf) -> Result<AppConfig, String> {
    if !path.exists() {
        return Err(format!("路径不存在: {}", path.display()));
    }
    if !path.is_dir() {
        return Err(format!("路径不是目录: {}", path.display()));
    }
    project::ensure_workspace_layout(&path)?;
    let cfg = AppConfig {
        workspace: Some(path),
    };
    config::save(&app, &cfg)?;
    Ok(cfg)
}

#[tauri::command]
fn list_projects(workspace: PathBuf) -> Result<Vec<ProjectSummary>, String> {
    project::list_projects(&workspace)
}

#[tauri::command]
fn list_archived_projects(workspace: PathBuf) -> Result<Vec<ProjectSummary>, String> {
    project::list_archived(&workspace)
}

#[tauri::command]
fn create_project(
    workspace: PathBuf,
    name: String,
    init: Option<ProjectInit>,
) -> Result<ProjectSummary, String> {
    project::create_project_with(&workspace, &name, init.unwrap_or_default())
}

#[tauri::command]
fn delete_project(project_path: PathBuf) -> Result<(), String> {
    project::delete_project_to_trash(&project_path)
}

#[tauri::command]
fn read_project_meta(project_path: PathBuf) -> Result<ProjectMeta, String> {
    project::read_meta(&project_path)
}

#[tauri::command]
fn read_project_readme(project_path: PathBuf) -> Result<String, String> {
    project::read_readme(&project_path)
}

#[tauri::command]
fn write_project_readme(project_path: PathBuf, content: String) -> Result<(), String> {
    project::write_readme(&project_path, &content)
}

#[tauri::command]
fn update_project_meta(project_path: PathBuf, patch: MetaPatch) -> Result<ProjectMeta, String> {
    project::update_meta(&project_path, patch)
}

#[tauri::command]
fn list_project_references(project_path: PathBuf) -> Result<Vec<ReferenceEntry>, String> {
    project::list_references(&project_path)
}

#[tauri::command]
fn import_project_references(
    project_path: PathBuf,
    sources: Vec<PathBuf>,
) -> Result<Vec<ReferenceEntry>, String> {
    project::import_references(&project_path, &sources)
}

#[tauri::command]
fn archive_project(workspace: PathBuf, project_path: PathBuf) -> Result<PathBuf, String> {
    project::archive_project(&workspace, &project_path)
}

#[tauri::command]
fn reveal_in_finder(app: tauri::AppHandle, path: PathBuf) -> Result<(), String> {
    if !path.exists() {
        return Err(format!("路径不存在: {}", path.display()));
    }
    app.opener()
        .reveal_item_in_dir(&path)
        .map_err(|e| e.to_string())
}

fn read_terminal_kind(workspace: &Option<PathBuf>) -> String {
    let default = "Terminal".to_string();
    let Some(ws) = workspace else {
        return default;
    };
    let cfg_path = ws.join(".dazi").join("config.yml");
    let Ok(raw) = std::fs::read_to_string(&cfg_path) else {
        return default;
    };
    let Ok(value) = serde_yaml::from_str::<serde_yaml::Value>(&raw) else {
        return default;
    };
    match value.get("terminal").and_then(|v| v.as_str()) {
        Some(s) if s.eq_ignore_ascii_case("iterm") || s.eq_ignore_ascii_case("iTerm") => {
            "iTerm".to_string()
        }
        _ => default,
    }
}

fn escape_applescript(s: &str) -> String {
    s.replace('\\', "\\\\").replace('"', "\\\"")
}

#[tauri::command]
fn open_terminal(app: tauri::AppHandle, path: PathBuf) -> Result<(), String> {
    if !path.exists() {
        return Err(format!("路径不存在: {}", path.display()));
    }
    let cfg = config::load(&app)?;
    let kind = read_terminal_kind(&cfg.workspace);
    run_in_terminal(&kind, &path, None)
}

#[tauri::command]
fn hand_off_to_claude(app: tauri::AppHandle, project_path: PathBuf) -> Result<ProjectMeta, String> {
    if !project_path.exists() {
        return Err(format!("项目不存在: {}", project_path.display()));
    }
    let cfg = config::load(&app)?;
    let kind = read_terminal_kind(&cfg.workspace);
    let prompt = "请阅读当前目录下的 README.md 与 references/ 目录中的资料，理解项目背景与目标，然后协助我推进。先用一段话总结你的理解，再提出 3 个最有价值的下一步。";
    let cmd = format!("claude \"{}\"", escape_applescript(prompt));
    run_in_terminal(&kind, &project_path, Some(&cmd))?;
    project::mark_handed_off(&project_path)
}

#[tauri::command]
fn reveal_references(app: tauri::AppHandle, project_path: PathBuf) -> Result<(), String> {
    let dir = project::ensure_references_dir(&project_path)?;
    app.opener()
        .open_path(dir.to_string_lossy(), None::<&str>)
        .map_err(|e| e.to_string())
}

fn run_in_terminal(kind: &str, path: &Path, extra_cmd: Option<&str>) -> Result<(), String> {
    let path_str = path.to_string_lossy().to_string();
    let escaped_path = escape_applescript(&path_str);
    let inner = match extra_cmd {
        Some(c) => {
            let escaped_cmd = escape_applescript(c);
            format!("cd \\\"{escaped_path}\\\" && {escaped_cmd}")
        }
        None => format!("cd \\\"{escaped_path}\\\""),
    };
    let script = if kind == "iTerm" {
        format!(
            "tell application \"iTerm\"\n  activate\n  create window with default profile\n  tell current session of current window to write text \"{inner}\"\nend tell"
        )
    } else {
        format!(
            "tell application \"Terminal\"\n  activate\n  do script \"{inner}\"\nend tell"
        )
    };
    Command::new("osascript")
        .arg("-e")
        .arg(&script)
        .status()
        .map_err(|e| format!("osascript 启动失败: {e}\n--- script ---\n{script}"))?;
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_sql::Builder::default().build())
        .invoke_handler(tauri::generate_handler![
            get_config,
            set_workspace,
            list_projects,
            list_archived_projects,
            create_project,
            delete_project,
            read_project_meta,
            read_project_readme,
            write_project_readme,
            update_project_meta,
            list_project_references,
            import_project_references,
            reveal_in_finder,
            open_terminal,
            hand_off_to_claude,
            reveal_references,
            archive_project,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
