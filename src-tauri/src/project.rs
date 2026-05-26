use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ProjectMeta {
    pub slug: String,
    pub name: String,
    #[serde(default = "default_status")]
    pub status: String,
    #[serde(default = "default_priority")]
    pub priority: String,
    #[serde(default)]
    pub tags: Vec<String>,
    #[serde(default)]
    pub start_date: Option<String>,
    #[serde(default)]
    pub due_date: Option<String>,
    #[serde(default)]
    pub requires_references: bool,
    #[serde(default)]
    pub handed_off_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    #[serde(default = "default_task_type")]
    pub task_type: String,
    #[serde(default)]
    pub schedule: Option<Schedule>,
    #[serde(default)]
    pub on_trigger: Option<OnTrigger>,
    #[serde(default)]
    pub runs: Vec<RunRecord>,
    #[serde(default)]
    pub next_run_at: Option<DateTime<Utc>>,
}

fn default_task_type() -> String {
    "oneoff".to_string()
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Schedule {
    #[serde(default)]
    pub run_at: Option<DateTime<Utc>>,
    #[serde(default)]
    pub interval: Option<Interval>,
    #[serde(default)]
    pub ends_at: Option<DateTime<Utc>>,
    #[serde(default)]
    pub max_runs: Option<u32>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Interval {
    pub every: u32,
    pub unit: String,
}

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
pub struct OnTrigger {
    #[serde(default = "default_action")]
    pub action: String,
}

fn default_action() -> String {
    "notify".to_string()
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct RunRecord {
    pub at: DateTime<Utc>,
    pub action: String,
    pub ok: bool,
    #[serde(default)]
    pub message: Option<String>,
}

fn default_status() -> String {
    "todo".to_string()
}

fn default_priority() -> String {
    "normal".to_string()
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ProjectSummary {
    pub slug: String,
    pub name: String,
    pub status: String,
    pub priority: String,
    pub path: PathBuf,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub requires_references: bool,
    pub has_references: bool,
    pub handed_off_at: Option<DateTime<Utc>>,
    pub archived: bool,
    pub task_type: String,
    pub next_run_at: Option<DateTime<Utc>>,
}

const README_TEMPLATE: &str = "# {{name}}\n\n\
## 背景\n\n\
（描述项目的来龙去脉、为什么要做）\n\n\
## 目标\n\n\
（这个项目要达成什么具体结果）\n\n\
## 验收标准\n\n\
- [ ] \n- [ ] \n\n\
## 备注\n\n";

pub fn projects_dir(workspace: &Path) -> PathBuf {
    workspace.join("projects")
}

pub fn ensure_workspace_layout(workspace: &Path) -> Result<(), String> {
    for sub in [".dazi", "projects", "archive"] {
        std::fs::create_dir_all(workspace.join(sub)).map_err(|e| e.to_string())?;
    }
    Ok(())
}

fn make_unique_slug(parent: &Path, base: &str) -> String {
    let base = if base.is_empty() {
        "project".to_string()
    } else {
        base.to_string()
    };
    if !parent.join(&base).exists() {
        return base;
    }
    for n in 2..1000 {
        let candidate = format!("{base}-{n}");
        if !parent.join(&candidate).exists() {
            return candidate;
        }
    }
    format!("{base}-{}", Utc::now().timestamp())
}

/// 清理文件名：去除文件系统不允许的字符，但保留中文等 Unicode 字符。
/// 规则：替换 / \ : * ? " < > | 与控制字符为空，去首尾空格和点，避免 macOS/Win 的特殊路径问题。
fn sanitize_dir_name(input: &str) -> String {
    let cleaned: String = input
        .chars()
        .map(|c| match c {
            '/' | '\\' | ':' | '*' | '?' | '"' | '<' | '>' | '|' => ' ',
            c if c.is_control() => ' ',
            c => c,
        })
        .collect();
    cleaned.trim().trim_matches('.').to_string()
}

pub fn create_project(workspace: &Path, name: &str) -> Result<ProjectSummary, String> {
    create_project_with(workspace, name, ProjectInit::default())
}

#[derive(Debug, Default, Deserialize)]
pub struct ProjectInit {
    #[serde(default)]
    pub status: Option<String>,
    #[serde(default)]
    pub priority: Option<String>,
    #[serde(default)]
    pub tags: Option<Vec<String>>,
    #[serde(default)]
    pub start_date: Option<String>,
    #[serde(default)]
    pub due_date: Option<String>,
    #[serde(default)]
    pub requires_references: Option<bool>,
}

pub fn create_project_with(
    workspace: &Path,
    name: &str,
    init: ProjectInit,
) -> Result<ProjectSummary, String> {
    let trimmed = name.trim();
    if trimmed.is_empty() {
        return Err("名称不能为空".into());
    }
    ensure_workspace_layout(workspace)?;
    let parent = projects_dir(workspace);
    let base_slug = sanitize_dir_name(trimmed);
    let slug = make_unique_slug(&parent, &base_slug);
    let project_path = parent.join(&slug);

    for sub in ["references", "notes", "output"] {
        std::fs::create_dir_all(project_path.join(sub)).map_err(|e| e.to_string())?;
    }

    let now = Utc::now();
    let meta = ProjectMeta {
        slug: slug.clone(),
        name: trimmed.to_string(),
        status: init.status.unwrap_or_else(default_status),
        priority: init.priority.unwrap_or_else(default_priority),
        tags: init.tags.unwrap_or_default(),
        start_date: init.start_date,
        due_date: init.due_date,
        requires_references: init.requires_references.unwrap_or(false),
        handed_off_at: None,
        created_at: now,
        updated_at: now,
        task_type: default_task_type(),
        schedule: None,
        on_trigger: None,
        runs: vec![],
        next_run_at: None,
    };
    write_meta(&project_path, &meta)?;

    let readme = README_TEMPLATE.replace("{{name}}", trimmed);
    std::fs::write(project_path.join("README.md"), readme).map_err(|e| e.to_string())?;

    Ok(ProjectSummary {
        slug: meta.slug,
        name: meta.name,
        status: meta.status,
        priority: meta.priority,
        path: project_path,
        created_at: meta.created_at,
        updated_at: meta.updated_at,
        requires_references: meta.requires_references,
        has_references: false,
        handed_off_at: meta.handed_off_at,
        archived: false,
        task_type: meta.task_type,
        next_run_at: meta.next_run_at,
    })
}

pub fn write_meta(project_path: &Path, meta: &ProjectMeta) -> Result<(), String> {
    let raw = serde_yaml::to_string(meta).map_err(|e| e.to_string())?;
    std::fs::write(project_path.join("meta.yml"), raw).map_err(|e| e.to_string())?;
    Ok(())
}

pub fn read_meta(project_path: &Path) -> Result<ProjectMeta, String> {
    let raw = std::fs::read_to_string(project_path.join("meta.yml")).map_err(|e| e.to_string())?;
    serde_yaml::from_str(&raw).map_err(|e| e.to_string())
}

pub fn list_projects(workspace: &Path) -> Result<Vec<ProjectSummary>, String> {
    list_in_dir(&projects_dir(workspace), false)
}

pub fn list_archived(workspace: &Path) -> Result<Vec<ProjectSummary>, String> {
    list_in_dir(&archive_dir(workspace), true)
}

fn list_in_dir(parent: &Path, archived: bool) -> Result<Vec<ProjectSummary>, String> {
    if !parent.exists() {
        return Ok(vec![]);
    }
    let mut out = vec![];
    for entry in std::fs::read_dir(parent).map_err(|e| e.to_string())? {
        let entry = entry.map_err(|e| e.to_string())?;
        let path = entry.path();
        if !path.is_dir() {
            continue;
        }
        match read_meta(&path) {
            Ok(meta) => {
                let has_references = references_non_empty(&path);
                out.push(ProjectSummary {
                    slug: meta.slug,
                    name: meta.name,
                    status: meta.status,
                    priority: meta.priority,
                    path: path.clone(),
                    created_at: meta.created_at,
                    updated_at: meta.updated_at,
                    requires_references: meta.requires_references,
                    has_references,
                    handed_off_at: meta.handed_off_at,
                    archived,
                    task_type: meta.task_type,
                    next_run_at: meta.next_run_at,
                });
            }
            Err(_) => continue,
        }
    }
    out.sort_by(|a, b| b.updated_at.cmp(&a.updated_at));
    Ok(out)
}

fn references_non_empty(project_path: &Path) -> bool {
    let dir = project_path.join("references");
    let Ok(read) = std::fs::read_dir(&dir) else {
        return false;
    };
    for entry in read.flatten() {
        let name = entry.file_name();
        let name = name.to_string_lossy();
        if !name.starts_with('.') {
            return true;
        }
    }
    false
}

pub fn read_readme(project_path: &Path) -> Result<String, String> {
    let p = project_path.join("README.md");
    if !p.exists() {
        return Ok(String::new());
    }
    std::fs::read_to_string(&p).map_err(|e| e.to_string())
}

pub fn write_readme(project_path: &Path, content: &str) -> Result<(), String> {
    std::fs::write(project_path.join("README.md"), content).map_err(|e| e.to_string())?;
    bump_updated_at(project_path)?;
    Ok(())
}

#[derive(Debug, Deserialize)]
pub struct MetaPatch {
    pub status: Option<String>,
    pub priority: Option<String>,
    pub tags: Option<Vec<String>>,
    pub start_date: Option<Option<String>>,
    pub due_date: Option<Option<String>>,
    pub requires_references: Option<bool>,
    pub name: Option<String>,
}

pub fn update_meta(project_path: &Path, patch: MetaPatch) -> Result<ProjectMeta, String> {
    let mut meta = read_meta(project_path)?;
    if let Some(v) = patch.status {
        meta.status = v;
    }
    if let Some(v) = patch.priority {
        meta.priority = v;
    }
    if let Some(v) = patch.tags {
        meta.tags = v;
    }
    if let Some(v) = patch.start_date {
        meta.start_date = v;
    }
    if let Some(v) = patch.due_date {
        meta.due_date = v;
    }
    if let Some(v) = patch.requires_references {
        meta.requires_references = v;
    }
    if let Some(v) = patch.name {
        let trimmed = v.trim();
        if trimmed.is_empty() {
            return Err("名称不能为空".into());
        }
        meta.name = trimmed.to_string();
    }
    meta.updated_at = Utc::now();
    write_meta(project_path, &meta)?;
    Ok(meta)
}

pub fn delete_project_to_trash(project_path: &Path) -> Result<(), String> {
    if !project_path.exists() {
        return Err(format!("路径不存在: {}", project_path.display()));
    }
    trash::delete(project_path).map_err(|e| format!("移入回收站失败: {e}"))
}

pub fn mark_handed_off(project_path: &Path) -> Result<ProjectMeta, String> {
    let mut meta = read_meta(project_path)?;
    let now = Utc::now();
    meta.handed_off_at = Some(now);
    meta.updated_at = now;
    write_meta(project_path, &meta)?;
    Ok(meta)
}

pub fn ensure_references_dir(project_path: &Path) -> Result<PathBuf, String> {
    let dir = project_path.join("references");
    std::fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    Ok(dir)
}

fn bump_updated_at(project_path: &Path) -> Result<(), String> {
    if let Ok(mut meta) = read_meta(project_path) {
        meta.updated_at = Utc::now();
        write_meta(project_path, &meta)?;
    }
    Ok(())
}

#[derive(Debug, Serialize, Clone)]
pub struct ReferenceEntry {
    pub name: String,
    pub path: PathBuf,
    pub size: u64,
    pub modified_at: DateTime<Utc>,
    pub is_dir: bool,
}

pub fn list_references(project_path: &Path) -> Result<Vec<ReferenceEntry>, String> {
    let dir = project_path.join("references");
    if !dir.exists() {
        return Ok(vec![]);
    }
    let mut out = vec![];
    for entry in std::fs::read_dir(&dir).map_err(|e| e.to_string())? {
        let entry = entry.map_err(|e| e.to_string())?;
        let path = entry.path();
        let meta = entry.metadata().map_err(|e| e.to_string())?;
        let name = entry.file_name().to_string_lossy().to_string();
        if name.starts_with('.') {
            continue;
        }
        let modified_at = meta
            .modified()
            .ok()
            .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
            .map(|d| {
                DateTime::<Utc>::from_timestamp(d.as_secs() as i64, d.subsec_nanos())
                    .unwrap_or_else(Utc::now)
            })
            .unwrap_or_else(Utc::now);
        out.push(ReferenceEntry {
            name,
            path: path.clone(),
            size: if meta.is_file() { meta.len() } else { 0 },
            modified_at,
            is_dir: meta.is_dir(),
        });
    }
    out.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));
    Ok(out)
}

fn unique_dest(dir: &Path, file_name: &str) -> PathBuf {
    let candidate = dir.join(file_name);
    if !candidate.exists() {
        return candidate;
    }
    let (stem, ext) = match file_name.rsplit_once('.') {
        Some((s, e)) if !s.is_empty() => (s.to_string(), format!(".{e}")),
        _ => (file_name.to_string(), String::new()),
    };
    for n in 2..1000 {
        let cand = dir.join(format!("{stem}-{n}{ext}"));
        if !cand.exists() {
            return cand;
        }
    }
    dir.join(format!("{stem}-{}{ext}", Utc::now().timestamp()))
}

pub fn import_references(
    project_path: &Path,
    sources: &[PathBuf],
) -> Result<Vec<ReferenceEntry>, String> {
    let dir = project_path.join("references");
    std::fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    for src in sources {
        if !src.exists() {
            continue;
        }
        let file_name = src
            .file_name()
            .map(|s| s.to_string_lossy().to_string())
            .unwrap_or_else(|| format!("file-{}", Utc::now().timestamp()));
        let dest = unique_dest(&dir, &file_name);
        if src.is_dir() {
            copy_dir_all(src, &dest)?;
        } else {
            std::fs::copy(src, &dest).map_err(|e| e.to_string())?;
        }
    }
    bump_updated_at(project_path)?;
    list_references(project_path)
}

fn copy_dir_all(src: &Path, dst: &Path) -> Result<(), String> {
    std::fs::create_dir_all(dst).map_err(|e| e.to_string())?;
    for entry in std::fs::read_dir(src).map_err(|e| e.to_string())? {
        let entry = entry.map_err(|e| e.to_string())?;
        let ty = entry.file_type().map_err(|e| e.to_string())?;
        let from = entry.path();
        let to = dst.join(entry.file_name());
        if ty.is_dir() {
            copy_dir_all(&from, &to)?;
        } else {
            std::fs::copy(&from, &to).map_err(|e| e.to_string())?;
        }
    }
    Ok(())
}

pub fn archive_dir(workspace: &Path) -> PathBuf {
    workspace.join("archive")
}

fn build_summary(meta: &ProjectMeta, readme: &str) -> String {
    let tags = if meta.tags.is_empty() {
        "—".to_string()
    } else {
        meta.tags.join(", ")
    };
    let start = meta.start_date.clone().unwrap_or_else(|| "—".into());
    let due = meta.due_date.clone().unwrap_or_else(|| "—".into());
    let archived_at = Utc::now().to_rfc3339();
    let readme_excerpt = readme.trim();
    format!(
        "# {name} · 归档摘要\n\n\
         - slug: {slug}\n\
         - 状态: {status}\n\
         - 优先级: {priority}\n\
         - 标签: {tags}\n\
         - 开始日期: {start}\n\
         - 截止日期: {due}\n\
         - 创建于: {created}\n\
         - 最后更新: {updated}\n\
         - 归档于: {archived_at}\n\n\
         ## README 快照\n\n{readme_excerpt}\n",
        name = meta.name,
        slug = meta.slug,
        status = meta.status,
        priority = meta.priority,
        created = meta.created_at.to_rfc3339(),
        updated = meta.updated_at.to_rfc3339(),
    )
}

pub fn archive_project(workspace: &Path, project_path: &Path) -> Result<PathBuf, String> {
    if !project_path.exists() {
        return Err(format!("项目不存在: {}", project_path.display()));
    }
    let meta = read_meta(project_path)?;
    let readme = read_readme(project_path).unwrap_or_default();
    let summary = build_summary(&meta, &readme);
    std::fs::write(project_path.join("summary.md"), summary).map_err(|e| e.to_string())?;

    let archive = archive_dir(workspace);
    std::fs::create_dir_all(&archive).map_err(|e| e.to_string())?;
    let dir_name = project_path
        .file_name()
        .map(|s| s.to_string_lossy().to_string())
        .unwrap_or_else(|| meta.slug.clone());
    let dest = unique_archive_dest(&archive, &dir_name);

    match std::fs::rename(project_path, &dest) {
        Ok(_) => Ok(dest),
        Err(_) => {
            // 跨卷或其他原因 rename 失败时回退到拷贝+删除
            copy_dir_all(project_path, &dest)?;
            std::fs::remove_dir_all(project_path).map_err(|e| e.to_string())?;
            Ok(dest)
        }
    }
}

fn unique_archive_dest(dir: &Path, name: &str) -> PathBuf {
    let candidate = dir.join(name);
    if !candidate.exists() {
        return candidate;
    }
    for n in 2..1000 {
        let cand = dir.join(format!("{name}-{n}"));
        if !cand.exists() {
            return cand;
        }
    }
    dir.join(format!("{name}-{}", Utc::now().timestamp()))
}
