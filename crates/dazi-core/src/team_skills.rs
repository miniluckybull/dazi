//! team_skills — 团队技能共享目录（反馈 #11 MVP）。
//!
//! 共享目录：~/.dazi/team-skills/{slug}/SKILL.md。
//! 挂载到项目：复制 SKILL.md 到 {project_path}/.claude/skills/{slug}/SKILL.md。
//! MVP 范围：仅 list + mount（不引入 skill 冲突解决、版本管理，后续迭代再加）。

use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TeamSkill {
    pub slug: String,
    pub path: PathBuf,
    pub description: Option<String>,
}

fn home_dir() -> Result<PathBuf, String> {
    std::env::var("HOME")
        .or_else(|_| std::env::var("USERPROFILE"))
        .map(PathBuf::from)
        .map_err(|e| format!("无法读取 HOME/USERPROFILE: {e}"))
}

pub fn team_dir() -> Result<PathBuf, String> {
    let dir = home_dir()?.join(".dazi").join("team-skills");
    std::fs::create_dir_all(&dir).map_err(|e| format!("创建 ~/.dazi/team-skills 失败: {e}"))?;
    Ok(dir)
}

/// 列出所有团队技能（每个子目录下必须有 SKILL.md 才算）。
pub fn list_team_skills() -> Result<Vec<TeamSkill>, String> {
    let dir = team_dir()?;
    let mut out: Vec<TeamSkill> = Vec::new();
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
        out.push(TeamSkill {
            slug,
            path: skill_md,
            description,
        });
    }
    out.sort_by(|a, b| a.slug.cmp(&b.slug));
    Ok(out)
}

fn extract_description(skill_md: &Path) -> Option<String> {
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

/// 把团队技能挂载到指定项目（复制 SKILL.md）。
/// 目标路径：{project}/.claude/skills/{slug}/SKILL.md
/// 已存在则跳过并返回 false（避免覆盖用户本地修改）。
pub fn mount_team_skill(slug: &str, project_path: &Path) -> Result<bool, String> {
    let src = team_dir()?.join(slug).join("SKILL.md");
    if !src.exists() {
        return Err(format!("团队技能 {slug} 不存在"));
    }
    let dest = project_path
        .join(".claude")
        .join("skills")
        .join(slug)
        .join("SKILL.md");
    if dest.exists() {
        return Ok(false);
    }
    std::fs::create_dir_all(dest.parent().unwrap())
        .map_err(|e| format!("创建 {} 失败: {e}", dest.parent().unwrap().display()))?;
    std::fs::copy(&src, &dest).map_err(|e| format!("复制失败: {e}"))?;
    Ok(true)
}
