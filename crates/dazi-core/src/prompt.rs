//! prompt.rs — 拼装注入给 Claude 的上下文与任务 prompt。
//! 交接（handoff）与无人值守（autopilot）两种 prompt 共用上下文拼装，
//! 区别只在尾部任务指令。从 src-tauri 下沉至此，供桌面 app 与 daemon 共用。
use crate::{memory, project};
use std::path::Path;

fn first_non_empty_line(text: &str) -> Option<String> {
    for line in text.lines() {
        let t = line.trim();
        if !t.is_empty() && !t.starts_with('#') {
            return Some(t.to_string());
        }
    }
    None
}

fn first_paragraph(text: &str) -> Option<String> {
    let mut buf = String::new();
    for line in text.lines() {
        let t = line.trim();
        if t.is_empty() {
            if !buf.is_empty() {
                break;
            }
            continue;
        }
        if t.starts_with('#') {
            continue;
        }
        if !buf.is_empty() {
            buf.push(' ');
        }
        buf.push_str(t);
    }
    if buf.is_empty() {
        None
    } else {
        Some(buf)
    }
}

fn summarize_sibling(project_path: &Path) -> Option<(String, String)> {
    let meta = project::read_meta(project_path).ok()?;
    let context = memory::read_project(project_path, "context.md").unwrap_or_default();
    if let Some(s) = first_paragraph(&context) {
        return Some((meta.name, s));
    }
    let readme = project::read_readme(project_path).unwrap_or_default();
    if let Some(s) = first_non_empty_line(&readme) {
        return Some((meta.name, s));
    }
    Some((meta.name.clone(), meta.name))
}

fn build_sibling_index(project_path: &Path) -> String {
    let Some(parent) = project_path.parent() else {
        return String::new();
    };
    let Some(workspace) = parent.parent() else {
        return String::new();
    };
    let mut entries: Vec<(String, String, std::path::PathBuf)> = Vec::new();
    for sub in ["projects", "archive"] {
        let dir = workspace.join(sub);
        let Ok(read) = std::fs::read_dir(&dir) else {
            continue;
        };
        for entry in read.flatten() {
            let p = entry.path();
            if !p.is_dir() || p == project_path {
                continue;
            }
            if let Some((name, summary)) = summarize_sibling(&p) {
                entries.push((name, summary, p));
            }
        }
    }
    if entries.is_empty() {
        return String::new();
    }
    entries.sort_by(|a, b| a.0.to_lowercase().cmp(&b.0.to_lowercase()));
    let mut lines = vec!["## 兄弟项目索引".to_string()];
    lines.push("当用户提到\"另一个任务里说过的事\"或暗示跨项目知识时,先在以下索引中扫一眼,必要时用 Read 工具读取对应项目的 context.md / README.md 获取细节:".to_string());
    for (name, summary, path) in entries.iter().take(40) {
        let trimmed: String = summary.chars().take(80).collect();
        lines.push(format!("- {} ({}): {}", name, path.display(), trimmed));
    }
    lines.join("\n")
}

/// 拼装注入给 Claude 的上下文段落（项目资料 + 全局记忆 + 兄弟索引 + 本项目进展/日志）。
/// 交接与 autopilot 两种 prompt 共用这部分，区别只在尾部任务指令。
pub fn build_context_sections(project_path: &Path) -> Vec<String> {
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
    let facts = memory::read_global("facts.md").unwrap_or_default();
    let context = memory::read_project(project_path, "context.md").unwrap_or_default();
    let journal_tail = memory::tail_journal(project_path, 5).unwrap_or_default();
    let sibling_index = build_sibling_index(project_path);

    let mut sections: Vec<String> = vec![refs_section];

    if !profile.trim().is_empty() {
        sections.push(format!(
            "## 用户画像（来自 ~/.dazi/profile.md）\n{}",
            profile.trim()
        ));
    }
    if !facts.trim().is_empty() {
        sections.push(format!(
            "## 用户世界事实（来自 ~/.dazi/facts.md）\n这里记录用户长期持有的实体与基础设施（服务器、设备、协作者、账号、关键链接等）。被问到\"我那台服务器/那个设备/那个人是谁\"时,先查这里:\n{}",
            facts.trim()
        ));
    }
    if !patterns.trim().is_empty() {
        sections.push(format!(
            "## 跨项目模式（来自 ~/.dazi/patterns.md）\n{}",
            patterns.trim()
        ));
    }
    if !sibling_index.trim().is_empty() {
        sections.push(sibling_index);
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

    sections
}

/// 记忆回写约定（交接与 autopilot 共用，{abs} 为项目根目录）。
fn writeback_convention(abs: &str) -> String {
    format!(
        "## 记忆回写约定（重要）\n会话结束前按以下「分诊器」决定每条新信息写到哪个文件，仅写下列文件，不要改动 meta.yml/README.md/references：\n\
         - 用户长期持有的「实体」(服务器、设备、SSH/账号、协作者、关键链接、硬件) → Edit 「~/.dazi/facts.md」 增量补充；用户说「记住」「以后这台机器叫…」时一律写这里。\n\
         - 用户的「偏好/工作风格」稳定观察(沟通方式、技术口味、不喜欢什么) → Edit 「~/.dazi/profile.md」 增量补充。\n\
         - 跨项目反复出现的「做事模式」(至少出现 2 次的协作纠正/打法) → 由复盘流程统一归纳到 「~/.dazi/patterns.md」，**单次会话不要主动改它**。\n\
         - 本项目「当前进展快照」 → Write 覆写 「{abs}/.dazi/context.md」(一句话目标 + 进行中 + 下一步 + 已完成要点)。\n\
         - 本项目「这次会话讨论/决定/待办」流水 → Edit 在 「{abs}/.dazi/journal.md」 末尾追加：\n\
         ## YYYY-MM-DD HH:MM\n\
         - 讨论了 …\n\
         - 决定 …\n\
         - 待办 …\n\n\
         判断要点：信息「跟着用户走」(下个项目还要用) 写 facts/profile；信息「跟着这个项目走」写 context/journal。拿不准时优先写 facts，宁可全局也别困在某个项目里。"
    )
}

/// 交接给用户实时协作用的 prompt：先总结理解，再提下一步。
pub fn build_handoff_prompt(project_path: &Path) -> String {
    let abs = project_path.display().to_string();
    let mut sections = build_context_sections(project_path);
    sections.push(
        "## 任务\n先用一段话总结你对本项目的理解，再提出 3 个最有价值的下一步。".to_string(),
    );
    sections.push(writeback_convention(&abs));
    sections.join("\n\n")
}

/// 无人值守自动执行用的 prompt：自主把任务推进到可交付状态，破坏性/不确定操作只记录待确认。
pub fn build_autopilot_prompt(project_path: &Path) -> String {
    let abs = project_path.display().to_string();
    let mut sections = build_context_sections(project_path);
    sections.push(
        "## 任务（自动执行模式）\n你正在**无人值守**地自动执行本项目的既定任务，没有用户实时盯着，运行结束后用户才会看到结果。请：\n\
         1. 依据 README.md 与上面的上下文，判断本项目此刻最该推进的既定任务，并把它**实际推进到一个可交付/可检查的状态**（该写文件就写、该跑命令就跑）。\n\
         2. **破坏性或不可逆操作**（删除、覆盖重要文件、对外发送、安装/卸载、动 git 历史、改系统配置）以及**你拿不准是否符合用户意图**的决策：不要擅自执行，改为在 journal 里记下「待用户确认」并说明原因。\n\
         3. 只在本项目目录范围内操作，不要去动其它项目。\n\
         4. 最后用 2-4 句话总结：这次做了什么、产出在哪、有没有需要用户确认或接手的事项。这段总结就是你这次运行的结果。"
            .to_string(),
    );
    sections.push(writeback_convention(&abs));
    sections.join("\n\n")
}

