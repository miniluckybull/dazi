mod config;
mod pty;

use dazi_core::{autopilot, memory, project, prompt, schedule};

use std::collections::HashSet;
use std::path::{Path, PathBuf};
use std::process::Command;
use std::sync::{Arc, Mutex};

use config::AppConfig;
use project::{
    MetaPatch, ProjectInit, ProjectMeta, ProjectSummary, ReferenceEntry,
};
use tauri::Emitter;
use tauri_plugin_notification::NotificationExt;
use tauri_plugin_opener::OpenerExt;

#[tauri::command]
fn get_config() -> Result<AppConfig, String> {
    config::load()
}

#[tauri::command]
fn set_workspace(path: PathBuf) -> Result<AppConfig, String> {
    if !path.exists() {
        return Err(format!("路径不存在: {}", path.display()));
    }
    if !path.is_dir() {
        return Err(format!("路径不是目录: {}", path.display()));
    }
    project::ensure_workspace_layout(&path)?;
    let cfg = AppConfig {
        workspace: Some(path),
        backend: None,
    };
    config::save(&cfg)?;
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
fn create_project_from_path(
    workspace: PathBuf,
    source: PathBuf,
) -> Result<ProjectSummary, String> {
    project::create_project_from_path(&workspace, &source)
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

#[tauri::command]
fn set_project_schedule(
    project_path: PathBuf,
    patch: schedule::SchedulePatch,
) -> Result<ProjectMeta, String> {
    schedule::apply_schedule_patch(&project_path, patch)
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
fn read_facts() -> Result<String, String> {
    memory::read_global("facts.md")
}

#[tauri::command]
fn write_facts(content: String) -> Result<(), String> {
    memory::write_global("facts.md", &content)
}

#[derive(serde::Serialize)]
struct BackendInfo {
    name: String,
    bin: String,
    version: Option<String>,
    supports_permission_mode: bool,
}

/// 列出已注册后端 + 探活结果（反馈 #14 UI）。
#[tauri::command]
fn list_backends() -> Vec<BackendInfo> {
    use dazi_core::backend;
    backend::global()
        .list()
        .into_iter()
        .map(|name| {
            let b = backend::global().get(&name).unwrap();
            let version = b.probe().ok();
            BackendInfo {
                name: b.name().to_string(),
                bin: b.resolve_bin(),
                version,
                supports_permission_mode: b.supports_permission_mode(),
            }
        })
        .collect()
}

/// 读取当前选中的后端名（未设置回退 "claude"）。
#[tauri::command]
fn get_backend() -> String {
    let cfg = config::load().unwrap_or_default();
    cfg.backend.unwrap_or_else(|| dazi_core::backend::BackendName::CLAUDE.to_string())
}

/// 切换后端，校验名必须在已注册列表中。
#[tauri::command]
fn set_backend(name: String) -> Result<String, String> {
    use dazi_core::backend;
    if backend::global().get(&name).is_none() {
        return Err(format!("未知后端: {name}"));
    }
    let mut cfg = config::load().unwrap_or_default();
    cfg.backend = Some(name.clone());
    config::save(&cfg)?;
    Ok(name)
}

/// 测试单个 API 配置的连通性（反馈 #15：整合 model-test 的检测能力）。
/// dazi tauri 异步命令包装层，调用 dazi_core::model_test::test_config。
#[tauri::command]
async fn test_model_config(
    config: dazi_core::model_test::ApiConfig,
) -> dazi_core::model_test::ModelTestResult {
    dazi_core::model_test::test_config(&config).await
}

/// 读取指定月份（YYYY-MM）的 usage 记录（反馈 #16）。
#[tauri::command]
fn get_usage(month: String) -> dazi_core::usage::UsageMonth {
    dazi_core::usage::read_month(&month).unwrap_or_default()
}

/// 列出已有 usage 记录的月份（倒序，YYYY-MM）。
#[tauri::command]
fn list_usage_months() -> Vec<String> {
    dazi_core::usage::list_months().unwrap_or_default()
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
fn synthesize_patterns(_app: tauri::AppHandle) -> Result<(), String> {
    let cfg = config::load()?;
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
         6. 完成后用 Bash 工具删除临时文件 {temp_str}"
    );

    let kind = read_terminal_kind(&cfg.workspace);
    let backend = dazi_core::backend::global().current(cfg.backend.as_deref());
    let cmd = escape_applescript(&backend.build_interactive_cmd(&prompt));
    run_in_terminal(&kind, &dazi_dir, Some(&cmd))?;
    Ok(())
}

#[tauri::command]
fn extract_skill(_app: tauri::AppHandle, project_path: PathBuf) -> Result<(), String> {
    if !project_path.exists() {
        return Err(format!("项目不存在: {}", project_path.display()));
    }
    let cfg = config::load()?;
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
    let backend = dazi_core::backend::global().current(cfg.backend.as_deref());
    let cmd = escape_applescript(&backend.build_interactive_cmd(&prompt));
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

/// 终端模式：默认内嵌（embedded）；.dazi/config.yml 写 `terminal: external`
/// 则交接/继续走旧的外部 Terminal.app/iTerm 路径（一键回退）。
#[tauri::command]
fn get_terminal_mode() -> Result<String, String> {
    let cfg = config::load()?;
    let Some(ws) = cfg.workspace else {
        return Ok("embedded".into());
    };
    let cfg_path = ws.join(".dazi").join("config.yml");
    let Ok(raw) = std::fs::read_to_string(&cfg_path) else {
        return Ok("embedded".into());
    };
    let Ok(value) = serde_yaml::from_str::<serde_yaml::Value>(&raw) else {
        return Ok("embedded".into());
    };
    match value.get("terminal").and_then(|v| v.as_str()) {
        Some(s) if s.eq_ignore_ascii_case("external") => Ok("external".into()),
        _ => Ok("embedded".into()),
    }
}

fn escape_applescript(s: &str) -> String {
    // 反斜杠和双引号要转义；反引号和 $ 在 shell 双引号里会触发命令替换/变量展开,
    // 而我们最终把整段拼进 `claude "..."` 用 osascript do script 执行,所以一并转义掉。
    // 换行必须转成空格：osascript 的双引号字符串不接受跨行字面换行，
    // 否则 handoff prompt（含大量换行）会让 do script 命令断裂、claude 空启动等输入（反馈 #9）。
    s.replace('\\', "\\\\")
        .replace('"', "\\\"")
        .replace('`', "\\`")
        .replace('$', "\\$")
        .replace('\n', " ")
        .replace('\r', " ")
}

#[tauri::command]
fn open_terminal(_app: tauri::AppHandle, path: PathBuf) -> Result<(), String> {
    if !path.exists() {
        return Err(format!("路径不存在: {}", path.display()));
    }
    let cfg = config::load()?;
    let kind = read_terminal_kind(&cfg.workspace);
    run_in_terminal(&kind, &path, None)
}

#[tauri::command]
fn hand_off_to_claude(_app: tauri::AppHandle, project_path: PathBuf) -> Result<ProjectMeta, String> {
    if !project_path.exists() {
        return Err(format!("项目不存在: {}", project_path.display()));
    }
    let cfg = config::load()?;
    let kind = read_terminal_kind(&cfg.workspace);
    let prompt = prompt::build_handoff_prompt(&project_path);
    let backend = dazi_core::backend::global().current(cfg.backend.as_deref());
    let cmd = escape_applescript(&backend.build_interactive_cmd(&prompt));
    run_in_terminal(&kind, &project_path, Some(&cmd))?;
    project::mark_handed_off(&project_path)
}

#[tauri::command]
fn continue_with_claude(_app: tauri::AppHandle, project_path: PathBuf) -> Result<(), String> {
    if !project_path.exists() {
        return Err(format!("项目不存在: {}", project_path.display()));
    }
    let cfg = config::load()?;
    let kind = read_terminal_kind(&cfg.workspace);
    let backend = dazi_core::backend::global().current(cfg.backend.as_deref());
    run_in_terminal(&kind, &project_path, Some(&backend.build_continue_cmd()))
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
    let output = Command::new("osascript")
        .arg("-e")
        .arg(&script)
        .output()
        .map_err(|e| format!("osascript 启动失败: {e}\n--- script ---\n{script}"))?;
    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!(
            "osascript 执行失败 (exit {:?}): {}\n--- script ---\n{script}",
            output.status.code(),
            stderr.trim()
        ));
    }
    Ok(())
}

/// 执行一次 autopilot：跑 headless claude → 写 journal → 记录 run → 通知 → 发事件。
/// 在独立线程中调用，不阻塞 tick loop。`name` 用于通知标题。
fn execute_autopilot(
    app: &tauri::AppHandle,
    project_path: &Path,
    name: &str,
    model: Option<String>,
) {
    let prompt = prompt::build_autopilot_prompt(project_path);
    let (ok, message, usage_opt) = match autopilot::run_autopilot(project_path, &prompt, model.as_deref()) {
        Ok(outcome) => {
            let _ = autopilot::append_autopilot_journal(project_path, &outcome);
            let msg = match &outcome.session_id {
                Some(sid) => format!("{}\n[session: {sid}]", outcome.summary),
                None => outcome.summary.clone(),
            };
            (outcome.ok, msg, outcome.usage)
        }
        Err(e) => {
            // 运行框架本身失败（启动/超时）也落一条 journal，方便排查。
            let outcome = autopilot::RunOutcome {
                ok: false,
                summary: e.clone(),
                session_id: None,
                usage: None,
            };
            let _ = autopilot::append_autopilot_journal(project_path, &outcome);
            (false, e, None)
        }
    };

    let _ = schedule::record_run(project_path, "autopilot", ok, Some(message.clone()));
    // 落 usage（反馈 #16：token 消耗和费用监控）
    let _ = dazi_core::usage::append_usage(project_path, model.as_deref(), usage_opt.as_ref());

    let title = if ok {
        format!("Dazi · {name} 自动执行完成")
    } else {
        format!("Dazi · {name} 自动执行失败")
    };
    let body: String = message.chars().take(180).collect();
    let _ = app.notification().builder().title(&title).body(&body).show();
    let _ = app.emit("task-completed", serde_json::json!({
        "path": project_path.to_string_lossy(),
        "name": name,
        "ok": ok,
    }));
}

/// 手动立即触发一次 autopilot（UI「立即执行一次」按钮 / 验证用）。同步执行后返回成败。
#[tauri::command]
fn run_autopilot_now(app: tauri::AppHandle, project_path: PathBuf) -> Result<bool, String> {
    let name = project_path
        .file_name()
        .map(|s| s.to_string_lossy().to_string())
        .unwrap_or_else(|| "project".to_string());
    let model = project::read_meta(&project_path)
        .ok()
        .and_then(|m| m.on_trigger)
        .and_then(|t| t.model);
    let prompt = prompt::build_autopilot_prompt(&project_path);
    let outcome = autopilot::run_autopilot(&project_path, &prompt, model.as_deref())?;
    let _ = autopilot::append_autopilot_journal(&project_path, &outcome);
    let msg = match &outcome.session_id {
        Some(sid) => format!("{}\n[session: {sid}]", outcome.summary),
        None => outcome.summary.clone(),
    };
    let _ = schedule::record_run(&project_path, "autopilot", outcome.ok, Some(msg));
    // 落 usage（反馈 #16：token 消耗和费用监控）
    let _ = dazi_core::usage::append_usage(
        &project_path,
        model.as_deref(),
        outcome.usage.as_ref(),
    );
    let _ = app.emit("task-completed", serde_json::json!({
        "path": project_path.to_string_lossy(),
        "name": name,
        "ok": outcome.ok,
    }));
    Ok(outcome.ok)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_sql::Builder::default().build())
        .manage(pty::PtyManager::default())
        .setup(|app| {
            // 升级迁移：把旧版 Tauri 配置目录下的 config.json 迁到 ~/.dazi/config.json，
            // 保证已设置 workspace 的老用户升级后不丢失配置。
            config::migrate_legacy_config(app.handle());
            let handle = app.handle().clone();
            // 正在运行中的 autopilot 任务路径，防止 60s tick 在上一次还没跑完时重复触发。
            let in_flight: Arc<Mutex<HashSet<PathBuf>>> = Arc::new(Mutex::new(HashSet::new()));
            // 启动时补算 next_run_at + 周期 tick（独立线程，每 60s 扫描一次）
            std::thread::spawn(move || {
                if let Ok(cfg) = config::load() {
                    if let Some(ws) = cfg.workspace.clone() {
                        schedule::refresh_all(&ws);
                    }
                }
                loop {
                    std::thread::sleep(std::time::Duration::from_secs(60));
                    let Ok(cfg) = config::load() else {
                        continue;
                    };
                    let Some(ws) = cfg.workspace.clone() else {
                        continue;
                    };
                    let due = schedule::scan_due(&ws, chrono::Utc::now());
                    for d in due {
                        if d.action == "autopilot" {
                            // 已在运行的跳过；否则标记 in-flight 并起线程执行。
                            {
                                let mut set = in_flight.lock().unwrap();
                                if set.contains(&d.path) {
                                    continue;
                                }
                                set.insert(d.path.clone());
                            }
                            let h = handle.clone();
                            let flight = in_flight.clone();
                            let path = d.path.clone();
                            let name = d.name.clone();
                            let model = d.model.clone();
                            std::thread::spawn(move || {
                                execute_autopilot(&h, &path, &name, model);
                                flight.lock().unwrap().remove(&path);
                            });
                        } else {
                            // notify（及其它）：保持原行为，仅记录触发 + 发事件。
                            let _ = schedule::record_run(&d.path, &d.action, true, None);
                            let _ = handle.emit("task-triggered", &d);
                        }
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
            create_project_from_path,
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
            read_facts,
            list_backends,
            get_backend,
            set_backend,
            test_model_config,
            get_usage,
            list_usage_months,
            write_facts,
            read_project_journal,
            read_project_context,
            synthesize_patterns,
            unarchive_project,
            extract_skill,
            run_autopilot_now,
            get_terminal_mode,
            pty::pty_open,
            pty::pty_launch,
            pty::pty_write,
            pty::pty_resize,
            pty::pty_kill,
        ])
        .build(tauri::generate_context!())
        .expect("error while running tauri application")
        .run(|app, event| {
            // App 退出时杀掉全部 pty 子进程，避免孤儿
            if let tauri::RunEvent::Exit = event {
                use tauri::Manager;
                let mgr = app.state::<pty::PtyManager>();
                mgr.kill_all();
            }
        });
}
