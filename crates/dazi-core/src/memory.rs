use std::path::{Path, PathBuf};

const GLOBAL_FILES: &[&str] = &["profile.md", "patterns.md", "facts.md", "changelog.md"];
const PROJECT_FILES: &[&str] = &["journal.md", "context.md"];

fn home_dir() -> Result<PathBuf, String> {
    std::env::var("HOME")
        .map(PathBuf::from)
        .map_err(|e| format!("无法读取 HOME 环境变量: {e}"))
}

fn global_dir() -> Result<PathBuf, String> {
    Ok(home_dir()?.join(".dazi"))
}

fn ensure_global_dir() -> Result<PathBuf, String> {
    let dir = global_dir()?;
    std::fs::create_dir_all(&dir).map_err(|e| format!("创建 ~/.dazi 失败: {e}"))?;
    Ok(dir)
}

fn ensure_project_memory_dir(project_path: &Path) -> Result<PathBuf, String> {
    let dir = project_path.join(".dazi");
    std::fs::create_dir_all(&dir).map_err(|e| format!("创建 .dazi 失败: {e}"))?;
    Ok(dir)
}

fn validate_global_file(name: &str) -> Result<(), String> {
    if GLOBAL_FILES.contains(&name) {
        Ok(())
    } else {
        Err(format!("非法的全局记忆文件名: {name}"))
    }
}

fn validate_project_file(name: &str) -> Result<(), String> {
    if PROJECT_FILES.contains(&name) {
        Ok(())
    } else {
        Err(format!("非法的项目记忆文件名: {name}"))
    }
}

fn read_or_empty(path: &Path) -> Result<String, String> {
    if !path.exists() {
        return Ok(String::new());
    }
    std::fs::read_to_string(path).map_err(|e| format!("读取 {} 失败: {e}", path.display()))
}

pub fn read_global(name: &str) -> Result<String, String> {
    validate_global_file(name)?;
    let path = global_dir()?.join(name);
    read_or_empty(&path)
}

pub fn write_global(name: &str, content: &str) -> Result<(), String> {
    validate_global_file(name)?;
    let dir = ensure_global_dir()?;
    std::fs::write(dir.join(name), content)
        .map_err(|e| format!("写入 ~/.dazi/{name} 失败: {e}"))
}

pub fn read_project(project_path: &Path, name: &str) -> Result<String, String> {
    validate_project_file(name)?;
    let path = project_path.join(".dazi").join(name);
    read_or_empty(&path)
}

/// 初始化项目级记忆目录与占位文件,在创建项目时调用。
pub fn init_project_memory(project_path: &Path) -> Result<(), String> {
    let dir = ensure_project_memory_dir(project_path)?;
    for name in PROJECT_FILES {
        let path = dir.join(name);
        if !path.exists() {
            std::fs::write(&path, "").map_err(|e| format!("初始化 {} 失败: {e}", path.display()))?;
        }
    }
    Ok(())
}

/// 取 journal.md 末尾 N 个 `## ` 段落,供 handoff 注入(避免 prompt 过长)。
pub fn tail_journal(project_path: &Path, n: usize) -> Result<String, String> {
    let raw = read_project(project_path, "journal.md")?;
    if raw.trim().is_empty() {
        return Ok(String::new());
    }
    // 以行首 "## " 切分
    let mut sections: Vec<String> = Vec::new();
    let mut current = String::new();
    for line in raw.lines() {
        if line.starts_with("## ") && !current.is_empty() {
            sections.push(std::mem::take(&mut current));
        }
        current.push_str(line);
        current.push('\n');
    }
    if !current.is_empty() {
        sections.push(current);
    }
    let take_from = sections.len().saturating_sub(n);
    Ok(sections[take_from..].join("").trim_end().to_string())
}
