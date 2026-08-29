//! 评论与 @提及派活。
//!
//! `.dazi/comments.jsonl` append-only。选 jsonl 而非 markdown 与 relay.jsonl 同因：
//! 追加一行是并发安全的，改写一个 md 段落不是。评论只增不改——编辑历史留言会
//! 让「他当时到底交代了什么」不可考，而这正是接力要保住的东西。
//!
//! **@提及不用分词**。成员名是中文，没有词边界，`@张三` 之后紧跟标点或另一个
//! 名字都很常见。故直接拿 team.yml 的成员名做最长匹配——能被提及的本就只有
//! 在册成员，没有必要先分词再查表。
use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};

/// comments.jsonl 的一行。
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct Comment {
    pub at: String,
    /// 作者 member_id。
    pub by: String,
    pub text: String,
    /// 从 text 解析出的被提及成员 id（去重、按出现顺序）。
    #[serde(default)]
    pub mentions: Vec<String>,
}

pub fn comments_path(project: &Path) -> PathBuf {
    project.join(".dazi").join("comments.jsonl")
}

/// 从文本解析 @提及，返回 member_id 列表（去重、保持出现顺序）。
///
/// `candidates` 为 (member_id, name)。同一位置有多个可匹配名字时取**最长**的：
/// 「张三」与「张三丰」同时在册时，`@张三丰` 必须命中后者。
pub fn parse_mentions(text: &str, candidates: &[(String, String)]) -> Vec<String> {
    let chars: Vec<char> = text.chars().collect();
    let mut out: Vec<String> = Vec::new();
    let mut i = 0;
    while i < chars.len() {
        if chars[i] != '@' {
            i += 1;
            continue;
        }
        let rest: String = chars[i + 1..].iter().collect();
        // 最长匹配：先按名字长度降序找第一个前缀命中的成员。
        let mut best: Option<(&str, usize)> = None;
        for (id, name) in candidates {
            if name.is_empty() || !rest.starts_with(name.as_str()) {
                continue;
            }
            let len = name.chars().count();
            if best.is_none_or(|(_, b)| len > b) {
                best = Some((id.as_str(), len));
            }
        }
        match best {
            Some((id, len)) => {
                if !out.iter().any(|x| x == id) {
                    out.push(id.to_string());
                }
                i += 1 + len; // 跳过 @ 与整个名字
            }
            // 不是有效提及（可能是邮箱、代码里的 @）——照常前进，不吞字符。
            None => i += 1,
        }
    }
    out
}

/// 追加一条评论。`mentions` 由调用方用 parse_mentions 预先解析后传入，
/// 使本函数不依赖 team.yml，便于测试。
pub fn append_comment(
    project: &Path,
    by: &str,
    text: &str,
    mentions: Vec<String>,
    now: chrono::DateTime<chrono::Utc>,
) -> Result<Comment, String> {
    use std::io::Write;
    let text = text.trim();
    if text.is_empty() {
        return Err("评论内容为空".to_string());
    }
    let c = Comment {
        at: now.to_rfc3339_opts(chrono::SecondsFormat::AutoSi, true),
        by: by.to_string(),
        text: text.to_string(),
        mentions,
    };
    let path = comments_path(project);
    if let Some(dir) = path.parent() {
        std::fs::create_dir_all(dir).map_err(|e| format!("创建 .dazi 失败: {e}"))?;
    }
    let line = serde_json::to_string(&c).map_err(|e| e.to_string())?;
    let mut f = std::fs::OpenOptions::new()
        .create(true)
        .append(true)
        .open(&path)
        .map_err(|e| format!("打开 comments.jsonl 失败: {e}"))?;
    writeln!(f, "{line}").map_err(|e| format!("写 comments.jsonl 失败: {e}"))?;
    Ok(c)
}

/// 读评论。坏行跳过——一行写坏不该让整段讨论读不出来（同 read_chain）。
pub fn read_comments(project: &Path, limit: Option<usize>) -> Vec<Comment> {
    let Ok(raw) = std::fs::read_to_string(comments_path(project)) else {
        return Vec::new();
    };
    let all: Vec<Comment> = raw
        .lines()
        .filter(|l| !l.trim().is_empty())
        .filter_map(|l| serde_json::from_str(l).ok())
        .collect();
    match limit {
        Some(n) if all.len() > n => all[all.len() - n..].to_vec(),
        _ => all,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn tmp() -> PathBuf {
        use std::sync::atomic::{AtomicU64, Ordering};
        static SEQ: AtomicU64 = AtomicU64::new(0);
        let p = std::env::temp_dir().join(format!(
            "dazi-comment-{}-{}",
            std::process::id(),
            SEQ.fetch_add(1, Ordering::Relaxed)
        ));
        std::fs::create_dir_all(&p).unwrap();
        p
    }

    fn members() -> Vec<(String, String)> {
        vec![
            ("m-1".into(), "张三".into()),
            ("m-2".into(), "张三丰".into()),
            ("m-3".into(), "李四".into()),
        ]
    }

    /// 中文名没有词边界，故这几种写法都必须命中，且不能命中错的那个。
    #[test]
    fn mentions_match_longest_name_and_dedupe() {
        let m = members();
        assert_eq!(parse_mentions("@张三 看一下", &m), vec!["m-1"]);
        // 最长匹配：张三丰不能被切成张三。
        assert_eq!(parse_mentions("@张三丰 看一下", &m), vec!["m-2"]);
        // 紧跟标点、无空格分隔。
        assert_eq!(parse_mentions("@李四，这个归你", &m), vec!["m-3"]);
        // 一条里多个，按出现顺序；重复只留一次。
        assert_eq!(
            parse_mentions("@张三 和 @李四 对一下，@张三 你先", &m),
            vec!["m-1", "m-3"]
        );
    }

    /// 邮箱与代码里的 @ 不该被当成提及，也不该吞掉后面的真提及。
    #[test]
    fn non_mentions_are_ignored_without_swallowing() {
        let m = members();
        assert_eq!(parse_mentions("a@b.com 无提及", &m), Vec::<String>::new());
        assert_eq!(parse_mentions("发到 a@b.com 并 @李四", &m), vec!["m-3"]);
        assert_eq!(parse_mentions("@不在册的人", &m), Vec::<String>::new());
        assert_eq!(parse_mentions("@", &m), Vec::<String>::new());
    }

    #[test]
    fn append_and_read_preserves_order_and_skips_bad_lines() {
        let p = tmp();
        let now = chrono::Utc::now();
        append_comment(&p, "m-1", "第一条", vec![], now).unwrap();
        append_comment(&p, "m-2", "第二条 @李四", vec!["m-3".into()], now).unwrap();
        // 手工插入坏行，模拟半截写入。
        {
            use std::io::Write;
            let mut f = std::fs::OpenOptions::new()
                .append(true)
                .open(comments_path(&p))
                .unwrap();
            writeln!(f, "{{坏行").unwrap();
        }
        append_comment(&p, "m-3", "第三条", vec![], now).unwrap();

        let all = read_comments(&p, None);
        assert_eq!(all.len(), 3, "坏行跳过，其余三条都要在");
        assert_eq!(all[0].text, "第一条");
        assert_eq!(all[1].mentions, vec!["m-3"]);
        assert_eq!(all[2].text, "第三条");
        // limit 取末尾 N 条（最近的）。
        let tail = read_comments(&p, Some(2));
        assert_eq!(tail.len(), 2);
        assert_eq!(tail[0].text, "第二条 @李四");
        let _ = std::fs::remove_dir_all(&p);
    }

    #[test]
    fn empty_comment_rejected() {
        let p = tmp();
        assert!(append_comment(&p, "m-1", "   ", vec![], chrono::Utc::now()).is_err());
        let _ = std::fs::remove_dir_all(&p);
    }
}
