//! skills — 个人 skill 库（~/.claude/skills/{slug}/SKILL.md）。
//!
//! skill 由归档任务「提炼为 skill」流程写入，Claude Code 自动发现；
//! dazi 负责列表展示、预览、删除与任务级手动注入（见 prompt.rs）。

use serde::{Deserialize, Serialize};
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Skill {
    pub slug: String,
    pub path: PathBuf,
    pub description: Option<String>,
    /// SKILL.md 修改时间（RFC3339），界面用作"提炼时间"
    pub updated_at: Option<String>,
}

fn home_dir() -> Result<PathBuf, String> {
    std::env::var("HOME")
        .or_else(|_| std::env::var("USERPROFILE"))
        .map(PathBuf::from)
        .map_err(|e| format!("无法读取 HOME/USERPROFILE: {e}"))
}

/// ~/.claude/skills 目录。注意：只读探测，不主动创建（目录归 Claude Code 管）。
pub fn skills_dir() -> Result<PathBuf, String> {
    Ok(home_dir()?.join(".claude").join("skills"))
}

/// slug 仅允许小写字母/数字/中划线，杜绝路径穿越与 shell 注入。
pub fn validate_slug(slug: &str) -> Result<(), String> {
    if slug.is_empty()
        || !slug
            .chars()
            .all(|c| c.is_ascii_lowercase() || c.is_ascii_digit() || c == '-')
    {
        return Err(format!("非法 skill slug: {slug}"));
    }
    Ok(())
}

/// 列出所有个人 skill（每个子目录下必须有 SKILL.md 才算）。
pub fn list_skills() -> Result<Vec<Skill>, String> {
    let dir = skills_dir()?;
    let mut out: Vec<Skill> = Vec::new();
    let Ok(rd) = std::fs::read_dir(&dir) else {
        return Ok(out);
    };
    for entry in rd.flatten() {
        let p = entry.path();
        if !p.is_dir() {
            continue;
        }
        let skill_md = p.join("SKILL.md");
        if !skill_md.exists() {
            continue;
        }
        let slug = p
            .file_name()
            .map(|s| s.to_string_lossy().to_string())
            .unwrap_or_default();
        let description = extract_description(&skill_md);
        let updated_at = std::fs::metadata(&skill_md)
            .and_then(|m| m.modified())
            .ok()
            .map(|t| chrono::DateTime::<chrono::Utc>::from(t).to_rfc3339());
        out.push(Skill {
            slug,
            path: skill_md,
            description,
            updated_at,
        });
    }
    out.sort_by(|a, b| a.slug.cmp(&b.slug));
    Ok(out)
}

fn extract_description(skill_md: &PathBuf) -> Option<String> {
    let raw = std::fs::read_to_string(skill_md).ok()?;
    // frontmatter 第一行 description: "..." 或 description: ...
    let mut in_fm = false;
    for line in raw.lines() {
        if line.trim() == "---" {
            if in_fm {
                break;
            }
            in_fm = true;
            continue;
        }
        if in_fm {
            if let Some(rest) = line.strip_prefix("description:") {
                return Some(rest.trim().trim_matches('"').to_string());
            }
        }
    }
    None
}

pub fn skill_exists(slug: &str) -> bool {
    let Ok(dir) = skills_dir() else {
        return false;
    };
    dir.join(slug).join("SKILL.md").exists()
}

/// 读取 SKILL.md 全文（预览用）。
pub fn read_skill(slug: &str) -> Result<String, String> {
    validate_slug(slug)?;
    let path = skills_dir()?.join(slug).join("SKILL.md");
    std::fs::read_to_string(&path).map_err(|e| format!("读取 {} 失败: {e}", path.display()))
}

/// 删除整个 skill 目录（{slug}/ 下可能还有引用文件）。
pub fn delete_skill(slug: &str) -> Result<(), String> {
    validate_slug(slug)?;
    let dir = skills_dir()?.join(slug);
    if !dir.exists() {
        return Err(format!("skill {slug} 不存在"));
    }
    std::fs::remove_dir_all(&dir).map_err(|e| format!("删除 {} 失败: {e}", dir.display()))
}
