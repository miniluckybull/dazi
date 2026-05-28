mod config;
mod memory;
mod project;
mod schedule;

use std::path::{Path, PathBuf};
use std::process::Command;

use config::AppConfig;
use project::{
    MetaPatch, OnTrigger, ProjectInit, ProjectMeta, ProjectSummary, ReferenceEntry, Schedule,
};
use serde::Deserialize;
use tauri::Emitter;
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
fn unarchive_project(workspace: PathBuf, project_path: PathBuf) -> Result<PathBuf, String> {
    project::unarchive_project(&workspace, &project_path)
}

#[derive(Debug, Deserialize)]
pub struct SchedulePatch {
    pub task_type: String,
    #[serde(default)]
    pub schedule: Option<Schedule>,
    #[serde(default)]
    pub on_trigger: Option<OnTrigger>,
}

#[tauri::command]
fn set_project_schedule(
    project_path: PathBuf,
    patch: SchedulePatch,
) -> Result<ProjectMeta, String> {
    let mut meta = project::read_meta(&project_path)?;
    meta.task_type = patch.task_type;
    meta.schedule = patch.schedule;
    meta.on_trigger = patch.on_trigger;
    meta.updated_at = chrono::Utc::now();
    project::write_meta(&project_path, &meta)?;
    schedule::recompute_and_save(&project_path)
}

#[tauri::command]
fn list_due_projects(workspace: PathBuf) -> Result<Vec<schedule::DueProject>, String> {
    Ok(schedule::scan_due(&workspace, chrono::Utc::now()))
}

#[tauri::command]
fn record_project_run(
    project_path: PathBuf,
    action: String,
    ok: bool,
    message: Option<String>,
) -> Result<ProjectMeta, String> {
    schedule::record_run(&project_path, &action, ok, message)
}

#[tauri::command]
fn read_profile() -> Result<String, String> {
    memory::read_global("profile.md")
}

#[tauri::command]
fn write_profile(content: String) -> Result<(), String> {
    memory::write_global("profile.md", &content)
}

#[tauri::command]
fn read_patterns() -> Result<String, String> {
    memory::read_global("patterns.md")
}

#[tauri::command]
fn write_patterns(content: String) -> Result<(), String> {
    memory::write_global("patterns.md", &content)
}

#[tauri::command]
fn read_project_journal(project_path: PathBuf) -> Result<String, String> {
    memory::read_project(&project_path, "journal.md")
}

#[tauri::command]
fn read_project_context(project_path: PathBuf) -> Result<String, String> {
    memory::read_project(&project_path, "context.md")
}

#[tauri::command]
fn synthesize_patterns(app: tauri::AppHandle) -> Result<(), String> {
    let cfg = config::load(&app)?;
    let workspace = cfg
        .workspace
        .clone()
        .ok_or_else(|| "尚未设置工作区".to_string())?;

    let mut sections: Vec<String> = Vec::new();
    for parent_name in ["projects", "archive"] {
        let parent = workspace.join(parent_name);
        if !parent.exists() {
            continue;
        }
        let read = match std::fs::read_dir(&parent) {
            Ok(r) => r,
            Err(_) => continue,
        };
        for entry in read.flatten() {
            let p = entry.path();
            if !p.is_dir() {
                continue;
            }
            let journal = memory::read_project(&p, "journal.md").unwrap_or_default();
            if journal.trim().is_empty() {
                continue;
            }
            let project_name = entry.file_name().to_string_lossy().to_string();
            sections.push(format!(
                "# {project_name} ({parent_name})\n\n{}",
                journal.trim()
            ));
        }
    }

    if sections.is_empty() {
        return Err("还没有可供归纳的协作日志,先完成几次 dazi 会话再来复盘".into());
    }

    let combined = sections.join("\n\n---\n\n");
    let home = std::env::var("HOME").map_err(|e| format!("无法读取 HOME: {e}"))?;
    let dazi_dir = PathBuf::from(&home).join(".dazi");
    std::fs::create_dir_all(&dazi_dir).map_err(|e| format!("创建 ~/.dazi 失败: {e}"))?;
    let temp_path = dazi_dir.join(".synthesize-input.md");
    std::fs::write(&temp_path, &combined).map_err(|e| format!("写入临时文件失败: {e}"))?;

    let temp_str = temp_path.display().to_string();
    let patterns_str = dazi_dir.join("patterns.md").display().to_string();
    let prompt = format!(
        "这是 dazi 工作搭子的「复盘」流程,请按下列步骤执行:\n\n\
         1. 用 Read 工具读取 {temp_str},里面是用户全部项目的协作日志拼接\n\
         2. 归纳「至少出现两次」的反复模式:用户偏好、纠正点、工作风格\n\
         3. 用 Read 读取 {patterns_str}(可能为空),再用 Edit 或 Write 工具增量更新它,保留仍然有效的旧条目\n\
         4. 一次性决策、单次事件不要写进去\n\
         5. 输出 markdown 列表风格,简短直接\n\
         6. 完成后用 Bash 工具执行 `rm {temp_str}` 删除临时文件"
    );

    let kind = read_terminal_kind(&cfg.workspace);
    let cmd = format!("claude \"{}\"", escape_applescript(&prompt));
    run_in_terminal(&kind, &dazi_dir, Some(&cmd))?;
    Ok(())
}

#[tauri::command]
fn extract_skill(app: tauri::AppHandle, project_path: PathBuf) -> Result<(), String> {
    if !project_path.exists() {
        return Err(format!("项目不存在: {}", project_path.display()));
    }
    let cfg = config::load(&app)?;
    let meta = project::read_meta(&project_path)?;
    let readme = project::read_readme(&project_path).unwrap_or_default();
    let context = memory::read_project(&project_path, "context.md").unwrap_or_default();
    let journal = memory::read_project(&project_path, "journal.md").unwrap_or_default();

    let home = std::env::var("HOME").map_err(|e| format!("无法读取 HOME: {e}"))?;
    let dazi_dir = PathBuf::from(&home).join(".dazi");
    std::fs::create_dir_all(&dazi_dir).map_err(|e| format!("创建 ~/.dazi 失败: {e}"))?;
    let temp_path = dazi_dir.join(".extract-skill-input.md");
    let combined = format!(
        "# 任务名称\n{}\n\n# slug\n{}\n\n# README.md\n{}\n\n# context.md\n{}\n\n# journal.md\n{}\n",
        meta.name,
        meta.slug,
        readme.trim(),
        context.trim(),
        journal.trim()
    );
    std::fs::write(&temp_path, &combined).map_err(|e| format!("写入临时文件失败: {e}"))?;

    let temp_str = temp_path.display().to_string();
    let skill_dir = format!("~/.claude/skills/{}", meta.slug);
    let skill_path = format!("{skill_dir}/SKILL.md");
    let prompt = format!(
        "这是 dazi 工作搭子的「提炼为 skill」流程,请按下列步骤执行:\n\n\
         1. 用 Read 工具读取 {temp_str},里面是这次任务的 README、context、journal\n\
         2. 把这次任务沉淀的可复用经验提炼成一个 Claude Code skill,目标路径 {skill_path}\n\
         3. 用 Bash 执行 `mkdir -p {skill_dir}` 确保目录存在\n\
         4. 用 Write 工具写入 {skill_path},内容必须是合法的 Claude Code skill 格式:\n   \
            开头是 frontmatter,包含 name(用 slug)和 description(一句话说明何时启用该 skill);\n   \
            正文用 markdown 描述触发场景、关键步骤、易踩的坑、可复用的命令或片段\n\
         5. 只总结真正可复用的经验,一次性的细节不要写进去\n\
         6. 完成后用 Bash 执行 `rm {temp_str}` 删除临时文件"
    );

    let kind = read_terminal_kind(&cfg.workspace);
    let cmd = format!("claude \"{}\"", escape_applescript(&prompt));
    run_in_terminal(&kind, &dazi_dir, Some(&cmd))?;
    Ok(())
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
    // 反斜杠和双引号要转义；反引号和 $ 在 shell 双引号里会触发命令替换/变量展开,
    // 而我们最终把整段拼进 `claude "..."` 用 osascript do script 执行,所以一并转义掉。
    s.replace('\\', "\\\\")
        .replace('"', "\\\"")
        .replace('`', "\\`")
        .replace('$', "\\$")
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
    let prompt = build_handoff_prompt(&project_path);
    let cmd = format!("claude \"{}\"", escape_applescript(&prompt));
    run_in_terminal(&kind, &project_path, Some(&cmd))?;
    project::mark_handed_off(&project_path)
}

#[tauri::command]
fn continue_with_claude(app: tauri::AppHandle, project_path: PathBuf) -> Result<(), String> {
    if !project_path.exists() {
        return Err(format!("项目不存在: {}", project_path.display()));
    }
    let cfg = config::load(&app)?;
    let kind = read_terminal_kind(&cfg.workspace);
    run_in_terminal(&kind, &project_path, Some("claude -c"))
}

fn build_handoff_prompt(project_path: &Path) -> String {
    let abs = project_path.display().to_string();
    let refs = project::list_references(project_path).unwrap_or_default();
    let refs_section = if refs.is_empty() {
        format!(
            "## 项目\n根目录：{abs}\n请阅读 README.md 了解项目背景与目标；当前 references/ 目录为空，如果信息不足请直接说明。"
        )
    } else {
        let list = refs
            .iter()
            .map(|r| if r.is_dir { format!("{}/", r.name) } else { r.name.clone() })
            .collect::<Vec<_>>()
            .join("、");
        format!(
            "## 项目\n根目录：{abs}\n请阅读 README.md 与 references/ 下的资料（{list}），理解项目背景与目标。"
        )
    };

    let profile = memory::read_global("profile.md").unwrap_or_default();
    let patterns = memory::read_global("patterns.md").unwrap_or_default();
    let context = memory::read_project(project_path, "context.md").unwrap_or_default();
    let journal_tail = memory::tail_journal(project_path, 5).unwrap_or_default();

    let mut sections: Vec<String> = vec![refs_section];

    if !profile.trim().is_empty() {
        sections.push(format!(
            "## 用户画像（来自 ~/.dazi/profile.md）\n{}",
            profile.trim()
        ));
    }
    if !patterns.trim().is_empty() {
        sections.push(format!(
            "## 跨项目模式（来自 ~/.dazi/patterns.md）\n{}",
            patterns.trim()
        ));
    }
    if !context.trim().is_empty() {
        sections.push(format!(
            "## 本项目当前进展（来自 .dazi/context.md）\n{}",
            context.trim()
        ));
    }
    if !journal_tail.trim().is_empty() {
        sections.push(format!(
            "## 本项目最近协作日志（来自 .dazi/journal.md，最近 5 段）\n{}",
            journal_tail.trim()
        ));
    }

    sections.push(format!(
        "## 任务\n先用一段话总结你对本项目的理解，再提出 3 个最有价值的下一步。\n\n\
         ## 记忆回写约定（重要）\n会话结束前请按以下规则维护记忆，仅写下列文件，不要改动 meta.yml/README.md/references：\n\
         1. 若本次出现新的、关于「用户偏好/工作风格」的稳定观察，使用 Edit 工具增量更新 「~/.dazi/profile.md」（不要全量重写；没有新观察就不动）。\n\
         2. 使用 Write 工具覆写 「{abs}/.dazi/context.md」，反映本项目当前最新进展（一句话目标 + 进行中 + 下一步 + 已完成要点）。\n\
         3. 使用 Edit 工具在 「{abs}/.dazi/journal.md」 末尾追加一段，格式：\n\
         ## YYYY-MM-DD HH:MM\n\
         - 讨论了 …\n\
         - 决定 …\n\
         - 待办 …"
    ));

    sections.join("\n\n")
}

#[tauri::command]
fn reveal_references(app: tauri::AppHandle, project_path: PathBuf) -> Result<(), String> {
    let dir = project::ensure_references_dir(&project_path)?;
    app.opener()
        .open_path(dir.to_string_lossy(), None::<&str>)
        .map_err(|e| e.to_string())
}

fn derive_terminal_title(path: &Path) -> String {
    let name = path
        .file_name()
        .map(|s| s.to_string_lossy().to_string())
        .unwrap_or_else(|| "session".to_string());
    format!("Dazi · {name}")
}

fn run_in_terminal(kind: &str, path: &Path, extra_cmd: Option<&str>) -> Result<(), String> {
    let path_str = path.to_string_lossy().to_string();
    let escaped_path = escape_applescript(&path_str);
    let title = derive_terminal_title(path);
    let escaped_title = escape_applescript(&title);
    let inner = match extra_cmd {
        Some(c) => {
            let escaped_cmd = escape_applescript(c);
            format!("cd \\\"{escaped_path}\\\" && {escaped_cmd}")
        }
        None => format!("cd \\\"{escaped_path}\\\""),
    };
    let script = if kind == "iTerm" {
        format!(
            "tell application \"iTerm\"\n  activate\n  create window with default profile\n  tell current session of current window\n    set name to \"{escaped_title}\"\n    write text \"{inner}\"\n  end tell\nend tell"
        )
    } else {
        format!(
            "tell application \"Terminal\"\n  activate\n  do script \"{inner}\"\n  delay 0.1\n  set custom title of front window to \"{escaped_title}\"\nend tell"
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
        .setup(|app| {
            let handle = app.handle().clone();
            // 启动时补算 next_run_at + 周期 tick（独立线程，每 60s 扫描一次）
            std::thread::spawn(move || {
                if let Ok(cfg) = config::load(&handle) {
                    if let Some(ws) = cfg.workspace.clone() {
                        schedule::refresh_all(&ws);
                    }
                }
                loop {
                    std::thread::sleep(std::time::Duration::from_secs(60));
                    let Ok(cfg) = config::load(&handle) else {
                        continue;
                    };
                    let Some(ws) = cfg.workspace.clone() else {
                        continue;
                    };
                    let due = schedule::scan_due(&ws, chrono::Utc::now());
                    for d in due {
                        let _ = schedule::record_run(&d.path, &d.action, true, None);
                        let _ = handle.emit("task-triggered", &d);
                    }
                }
            });
            Ok(())
        })
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
            continue_with_claude,
            reveal_references,
            archive_project,
            set_project_schedule,
            list_due_projects,
            record_project_run,
            read_profile,
            write_profile,
            read_patterns,
            write_patterns,
            read_project_journal,
            read_project_context,
            synthesize_patterns,
            unarchive_project,
            extract_skill,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
