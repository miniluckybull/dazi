//! 接力棒（Rust 侧镜像）。权威实现在 `ts/packages/relay`，此处在 strangler
//! 过渡期为手机/桌面提供 API，两侧读写**同一份** `.dazi/baton.json` 与
//! `.dazi/relay.jsonl`，故格式必须逐字节对齐（见文末 parses_ts_written_json）。
//!
//! 棒刻意不放进 meta.yml：`ProjectMeta` 不认识 baton 字段，serde 默认忽略未知
//! 字段，于是任何一次 write_meta 都会静默把棒抹掉。独立文件则 meta.yml 对
//! React/Flutter 的契约一字不动。
use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};

use crate::team::write_atomic;

/// 棒的默认存活时长：2 小时。与 TS 侧 BATON_TTL_MS 必须一致。
pub const BATON_TTL_SECS: i64 = 2 * 60 * 60;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum HolderKind {
    Human,
    Agent,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum RelayAction {
    Claim,
    Handoff,
    Release,
    Expire,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Baton {
    /// human 时为 member_id，agent 时为 agent 名。
    pub holder: String,
    pub kind: HolderKind,
    pub since: String,
    pub expires_at: String,
}

/// relay.jsonl 的一行。append-only，绝不改写既有行。
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RelayEntry {
    pub at: String,
    pub action: RelayAction,
    pub from: Option<String>,
    pub to: Option<String>,
    pub kind: Option<HolderKind>,
    pub note: Option<String>,
    /// 实际写入者，可能不是 from/to（例如管理员强收）。
    pub by: String,
}

/// 棒状态。`expired` 让界面能区分「从没人碰过」与「有人拿了但超时」。
#[derive(Debug, Clone, Serialize)]
pub struct BatonState {
    pub baton: Option<Baton>,
    pub expired: bool,
}

pub fn baton_path(project: &Path) -> PathBuf {
    project.join(".dazi").join("baton.json")
}

pub fn relay_path(project: &Path) -> PathBuf {
    project.join(".dazi").join("relay.jsonl")
}

/// 解析失败一律判为已过期——坏数据不该让任务永久锁死。
fn is_expired(b: &Baton, now: chrono::DateTime<chrono::Utc>) -> bool {
    match chrono::DateTime::parse_from_rfc3339(&b.expires_at) {
        Ok(t) => t <= now,
        Err(_) => true,
    }
}

/// 读原始棒。文件缺失或内容非法都回 None。
fn read_raw(project: &Path) -> Option<Baton> {
    let raw = std::fs::read_to_string(baton_path(project)).ok()?;
    let b: Baton = serde_json::from_str(&raw).ok()?;
    if b.holder.is_empty() {
        return None;
    }
    Some(b)
}

pub fn read_baton(project: &Path, now: chrono::DateTime<chrono::Utc>) -> BatonState {
    match read_raw(project) {
        None => BatonState {
            baton: None,
            expired: false,
        },
        Some(b) => {
            let expired = is_expired(&b, now);
            BatonState {
                baton: Some(b),
                expired,
            }
        }
    }
}

fn write_baton(project: &Path, b: Option<&Baton>) -> Result<(), String> {
    let path = baton_path(project);
    match b {
        None => {
            if path.exists() {
                std::fs::remove_file(&path).map_err(|e| format!("删除 baton.json 失败: {e}"))?;
            }
            Ok(())
        }
        Some(b) => {
            if let Some(dir) = path.parent() {
                std::fs::create_dir_all(dir).map_err(|e| format!("创建 .dazi 失败: {e}"))?;
            }
            let mut raw = serde_json::to_string_pretty(b).map_err(|e| e.to_string())?;
            raw.push('\n'); // 与 TS 侧一致
            write_atomic(&path, &raw)
        }
    }
}

/// 追加一条接力记录。单行 JSON + 换行，与 TS 侧 appendLine 一致。
fn append_relay(project: &Path, e: &RelayEntry) -> Result<(), String> {
    use std::io::Write;
    let path = relay_path(project);
    if let Some(dir) = path.parent() {
        std::fs::create_dir_all(dir).map_err(|e| format!("创建 .dazi 失败: {e}"))?;
    }
    let line = serde_json::to_string(e).map_err(|e| e.to_string())?;
    let mut f = std::fs::OpenOptions::new()
        .create(true)
        .append(true)
        .open(&path)
        .map_err(|e| format!("打开 relay.jsonl 失败: {e}"))?;
    writeln!(f, "{line}").map_err(|e| format!("写 relay.jsonl 失败: {e}"))
}

fn make_baton(
    holder: &str,
    kind: HolderKind,
    now: chrono::DateTime<chrono::Utc>,
    ttl_secs: i64,
) -> Baton {
    Baton {
        holder: holder.to_string(),
        kind,
        since: now_iso_at(now),
        expires_at: now_iso_at(now + chrono::Duration::seconds(ttl_secs)),
    }
}

fn now_iso_at(t: chrono::DateTime<chrono::Utc>) -> String {
    t.to_rfc3339_opts(chrono::SecondsFormat::AutoSi, true)
}

/// 认领失败原因。调用方据此映射 HTTP 状态码。
#[derive(Debug)]
pub enum BatonError {
    /// 他人持棒且未过期。附当前持棒人与到期时刻，供界面展示。
    Held { holder: String, expires_at: String },
    /// 非持棒人试图递棒/放棒，或无棒可递。
    NotHolder { actual: Option<String> },
    Io(String),
}

impl std::fmt::Display for BatonError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            BatonError::Held { holder, expires_at } => {
                write!(f, "任务已被 {holder} 持有，到 {expires_at} 前不可抢占")
            }
            BatonError::NotHolder { actual: Some(a) } => write!(f, "当前持棒人是 {a}，无权操作"),
            BatonError::NotHolder { actual: None } => write!(f, "当前无人持棒，无棒可交"),
            BatonError::Io(e) => write!(f, "{e}"),
        }
    }
}

/// 认领棒。允许：无人持棒、已过期、或本人续期（幂等）。
/// 超时接管时补记一条 expire，否则链上看不出中间发生过超时。
pub fn claim(
    project: &Path,
    holder: &str,
    kind: HolderKind,
    note: Option<String>,
    now: chrono::DateTime<chrono::Utc>,
) -> Result<Baton, BatonError> {
    let cur = read_raw(project);
    let held = cur.as_ref().is_some_and(|c| !is_expired(c, now));

    if let Some(c) = &cur {
        if held && c.holder != holder {
            return Err(BatonError::Held {
                holder: c.holder.clone(),
                expires_at: c.expires_at.clone(),
            });
        }
        if !held && c.holder != holder {
            append_relay(
                project,
                &RelayEntry {
                    at: now_iso_at(now),
                    action: RelayAction::Expire,
                    from: Some(c.holder.clone()),
                    to: None,
                    kind: Some(c.kind),
                    note: Some(format!("持棒超时（应于 {} 前交接）", c.expires_at)),
                    by: holder.to_string(),
                },
            )
            .map_err(BatonError::Io)?;
        }
    }

    let next = make_baton(holder, kind, now, BATON_TTL_SECS);
    write_baton(project, Some(&next)).map_err(BatonError::Io)?;
    append_relay(
        project,
        &RelayEntry {
            at: next.since.clone(),
            action: RelayAction::Claim,
            from: cur.map(|c| c.holder),
            to: Some(holder.to_string()),
            kind: Some(kind),
            note,
            by: holder.to_string(),
        },
    )
    .map_err(BatonError::Io)?;
    Ok(next)
}

/// 递棒。只有当前持棒人能递；过期后原持棒人仍可递（若尚未被抢走）。
pub fn handoff(
    project: &Path,
    from: &str,
    to: &str,
    kind: HolderKind,
    note: Option<String>,
    now: chrono::DateTime<chrono::Utc>,
) -> Result<Baton, BatonError> {
    let cur = read_raw(project);
    match &cur {
        Some(c) if c.holder == from => {}
        other => {
            return Err(BatonError::NotHolder {
                actual: other.as_ref().map(|c| c.holder.clone()),
            })
        }
    }
    let next = make_baton(to, kind, now, BATON_TTL_SECS);
    write_baton(project, Some(&next)).map_err(BatonError::Io)?;
    append_relay(
        project,
        &RelayEntry {
            at: next.since.clone(),
            action: RelayAction::Handoff,
            from: Some(from.to_string()),
            to: Some(to.to_string()),
            kind: Some(kind),
            note,
            by: from.to_string(),
        },
    )
    .map_err(BatonError::Io)?;
    Ok(next)
}

/// 放棒。force 供管理员强收失联成员的棒——by 与 from 不同即可追溯。
pub fn release(
    project: &Path,
    actor: &str,
    force: bool,
    note: Option<String>,
    now: chrono::DateTime<chrono::Utc>,
) -> Result<(), BatonError> {
    let cur = read_raw(project).ok_or(BatonError::NotHolder { actual: None })?;
    if !force && cur.holder != actor {
        return Err(BatonError::NotHolder {
            actual: Some(cur.holder),
        });
    }
    write_baton(project, None).map_err(BatonError::Io)?;
    append_relay(
        project,
        &RelayEntry {
            at: now_iso_at(now),
            action: RelayAction::Release,
            from: Some(cur.holder),
            to: None,
            kind: Some(cur.kind),
            note,
            by: actor.to_string(),
        },
    )
    .map_err(BatonError::Io)
}

/// 注入 prompt 的接力链最大条数。链会一直增长，prompt 不能无限长。
pub const RELAY_TAIL_ENTRIES: usize = 20;

fn action_label(a: RelayAction) -> &'static str {
    match a {
        RelayAction::Claim => "接手",
        RelayAction::Handoff => "递交",
        RelayAction::Release => "放下",
        RelayAction::Expire => "超时释放",
    }
}

/// 构造接力链 section；链为空回 None（单人任务不该在 prompt 里多一段废话）。
///
/// 刻意不改 `dazi_core::prompt::build_*`：那些函数的输出有与 TS 逐字节比对的
/// golden，是 S2 的验收闸门，往里塞 section 等于把回退保障拆了。
///
/// `name_of` 把 member_id 映射为人名，查不到则退回 id——宁可难看也不能丢信息。
pub fn build_relay_section(
    project: &Path,
    name_of: &dyn Fn(&str) -> Option<String>,
    limit: usize,
) -> Option<String> {
    let chain = read_chain(project, Some(limit));
    if chain.is_empty() {
        return None;
    }
    let who = |id: &Option<String>| match id {
        None => "无人".to_string(),
        Some(i) => name_of(i).unwrap_or_else(|| i.clone()),
    };
    let mut lines = String::new();
    for e in &chain {
        let body = match e.action {
            RelayAction::Handoff => format!("：{} → {}", who(&e.from), who(&e.to)),
            RelayAction::Claim => format!("：{}", who(&e.to)),
            _ => format!("：{}", who(&e.from)),
        };
        lines.push_str(&format!("- {} {}{}\n", e.at, action_label(e.action), body));
        if let Some(n) = &e.note {
            lines.push_str(&format!("  说明：{n}\n"));
        }
    }
    Some(format!(
        "## 本任务接力历史（来自 .dazi/relay.jsonl，最近 {} 条）\n\
         这根棒之前经过下列人手。交接说明里可能有上一位留下的关键判断，不要重复他们已经做过的工作：\n{}",
        chain.len(),
        lines.trim_end()
    ))
}

/// 把接力段并入既有 prompt，插在最后一个 `## 任务` 之前。
///
/// 模型对结尾指令最敏感，故任务指令必须保持在末尾，接力历史放它前面。
pub fn with_relay_section(prompt: &str, section: Option<String>) -> String {
    let Some(sec) = section else {
        return prompt.to_string();
    };
    const MARKER: &str = "\n\n## 任务";
    match prompt.rfind(MARKER) {
        None => format!("{prompt}\n\n{sec}"),
        Some(at) => format!("{}\n\n{}{}", &prompt[..at], sec, &prompt[at..]),
    }
}

/// 读接力链。坏行跳过——一行写坏不该让整段历史读不出来。
pub fn read_chain(project: &Path, limit: Option<usize>) -> Vec<RelayEntry> {
    let Ok(raw) = std::fs::read_to_string(relay_path(project)) else {
        return Vec::new();
    };
    let all: Vec<RelayEntry> = raw
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

    /// 每个用例独立目录。计数器不可省：macOS 的时钟精度粗于纳秒，
    /// 仅靠 pid+时间戳在并行测试下会撞名，撞上的两个用例会互删对方的目录。
    fn tmp() -> PathBuf {
        use std::sync::atomic::{AtomicU64, Ordering};
        static SEQ: AtomicU64 = AtomicU64::new(0);
        let p = std::env::temp_dir().join(format!(
            "dazi-baton-{}-{}",
            std::process::id(),
            SEQ.fetch_add(1, Ordering::Relaxed)
        ));
        std::fs::create_dir_all(&p).unwrap();
        p
    }

    fn t0() -> chrono::DateTime<chrono::Utc> {
        chrono::DateTime::parse_from_rfc3339("2026-08-29T10:00:00Z")
            .unwrap()
            .with_timezone(&chrono::Utc)
    }

    #[test]
    fn claim_then_handoff_then_release() {
        let d = tmp();
        let b = claim(&d, "m-alice", HolderKind::Human, None, t0()).unwrap();
        assert_eq!(b.holder, "m-alice");
        assert_eq!(b.since, "2026-08-29T10:00:00Z");
        assert_eq!(b.expires_at, "2026-08-29T12:00:00Z", "TTL 必须 2 小时");

        handoff(&d, "m-alice", "m-bob", HolderKind::Human, None, t0()).unwrap();
        assert_eq!(read_baton(&d, t0()).baton.unwrap().holder, "m-bob");

        release(&d, "m-bob", false, None, t0()).unwrap();
        assert!(read_baton(&d, t0()).baton.is_none());
        assert_eq!(read_chain(&d, None).len(), 3, "三步都要留痕");
        std::fs::remove_dir_all(&d).ok();
    }

    #[test]
    fn other_holder_cannot_claim_or_handoff() {
        let d = tmp();
        claim(&d, "m-alice", HolderKind::Human, None, t0()).unwrap();
        assert!(matches!(
            claim(&d, "m-bob", HolderKind::Human, None, t0()),
            Err(BatonError::Held { .. })
        ));
        assert!(matches!(
            handoff(&d, "m-bob", "m-carol", HolderKind::Human, None, t0()),
            Err(BatonError::NotHolder { .. })
        ));
        assert_eq!(
            read_baton(&d, t0()).baton.unwrap().holder,
            "m-alice",
            "失败的操作不能改动持棒人"
        );
        assert_eq!(read_chain(&d, None).len(), 1, "失败的操作不该留记录");
        std::fs::remove_dir_all(&d).ok();
    }

    #[test]
    fn expired_baton_can_be_taken_over_and_logs_expire() {
        let d = tmp();
        claim(&d, "m-alice", HolderKind::Human, None, t0()).unwrap();
        let later = t0() + chrono::Duration::seconds(BATON_TTL_SECS + 1);
        assert!(read_baton(&d, later).expired);

        claim(&d, "m-bob", HolderKind::Human, None, later).unwrap();
        let actions: Vec<_> = read_chain(&d, None).into_iter().map(|e| e.action).collect();
        assert_eq!(
            actions,
            vec![RelayAction::Claim, RelayAction::Expire, RelayAction::Claim],
            "缺 expire 就看不出发生过超时"
        );
        std::fs::remove_dir_all(&d).ok();
    }

    #[test]
    fn force_release_records_the_forcer() {
        let d = tmp();
        claim(&d, "m-alice", HolderKind::Human, None, t0()).unwrap();
        assert!(release(&d, "m-bob", false, None, t0()).is_err());
        release(&d, "m-admin", true, Some("成员失联".into()), t0()).unwrap();

        let last = read_chain(&d, None).pop().unwrap();
        assert_eq!(last.from.as_deref(), Some("m-alice"));
        assert_eq!(last.by, "m-admin", "强收者必须留名，否则无法追责");
        std::fs::remove_dir_all(&d).ok();
    }

    /// 坏 expires_at 一律判过期，否则坏数据让任务永久锁死。
    #[test]
    fn corrupt_expiry_is_treated_as_expired() {
        let d = tmp();
        claim(&d, "m-alice", HolderKind::Human, None, t0()).unwrap();
        let p = baton_path(&d);
        let raw = std::fs::read_to_string(&p).unwrap().replace(
            "2026-08-29T12:00:00Z",
            "不是时间",
        );
        std::fs::write(&p, raw).unwrap();
        assert!(read_baton(&d, t0()).expired);
        assert!(claim(&d, "m-bob", HolderKind::Human, None, t0()).is_ok());
        std::fs::remove_dir_all(&d).ok();
    }

    #[test]
    fn bad_relay_lines_are_skipped() {
        let d = tmp();
        claim(&d, "m-alice", HolderKind::Human, None, t0()).unwrap();
        std::fs::OpenOptions::new()
            .append(true)
            .open(relay_path(&d))
            .map(|mut f| {
                use std::io::Write;
                writeln!(f, "{{半个 json").unwrap();
                writeln!(f).unwrap();
            })
            .unwrap();
        handoff(&d, "m-alice", "m-bob", HolderKind::Human, None, t0()).unwrap();
        assert_eq!(read_chain(&d, None).len(), 2, "两条合法记录都要读出来");
        std::fs::remove_dir_all(&d).ok();
    }

    /// 跨语言契约：能读 TS 侧写出的 baton.json 与 relay.jsonl。
    /// 两侧读写同一份文件，格式一错就是线上数据错乱。
    #[test]
    fn parses_ts_written_json() {
        let d = tmp();
        std::fs::create_dir_all(d.join(".dazi")).unwrap();
        std::fs::write(
            baton_path(&d),
            "{\n  \"holder\": \"m-alice\",\n  \"kind\": \"human\",\n  \"since\": \"2026-08-29T10:00:00Z\",\n  \"expires_at\": \"2026-08-29T12:00:00Z\"\n}\n",
        )
        .unwrap();
        let st = read_baton(&d, t0());
        assert_eq!(st.baton.as_ref().unwrap().holder, "m-alice");
        assert_eq!(st.baton.unwrap().kind, HolderKind::Human);
        assert!(!st.expired);

        std::fs::write(
            relay_path(&d),
            "{\"at\":\"2026-08-29T10:00:00Z\",\"action\":\"claim\",\"from\":null,\"to\":\"m-alice\",\"kind\":\"human\",\"note\":null,\"by\":\"m-alice\"}\n",
        )
        .unwrap();
        let chain = read_chain(&d, None);
        assert_eq!(chain.len(), 1);
        assert_eq!(chain[0].action, RelayAction::Claim);
        assert_eq!(chain[0].to.as_deref(), Some("m-alice"));
        std::fs::remove_dir_all(&d).ok();
    }

    /// Rust 写出的格式 TS 也必须能读：键名 snake_case、kind 小写、末尾换行。
    #[test]
    fn writes_ts_compatible_json() {
        let d = tmp();
        claim(&d, "agent-claude", HolderKind::Agent, None, t0()).unwrap();
        let raw = std::fs::read_to_string(baton_path(&d)).unwrap();
        assert!(raw.contains("\"expires_at\""), "必须是 snake_case");
        assert!(raw.contains("\"kind\": \"agent\""), "kind 必须小写");
        assert!(raw.ends_with("}\n"), "必须以换行结尾");

        let line = std::fs::read_to_string(relay_path(&d)).unwrap();
        assert!(line.ends_with('\n'));
        assert!(!line.trim_end().contains('\n'), "一条记录必须是单行");
        std::fs::remove_dir_all(&d).ok();
    }

    /// 无接力历史时 prompt 必须一字不改——否则单人任务的 prompt 被无谓污染，
    /// 且与 dazi-core 的冻结 golden 对不上。
    #[test]
    fn no_chain_leaves_prompt_untouched() {
        let d = tmp();
        let original = "## 项目\n根目录：/x\n\n## 任务\n请总结";
        let sec = build_relay_section(&d, &|_| None, 20);
        assert!(sec.is_none());
        assert_eq!(with_relay_section(original, sec), original);
        std::fs::remove_dir_all(&d).ok();
    }

    /// 接力段插在「## 任务」之前，任务指令仍须在末尾（模型对结尾指令最敏感）。
    #[test]
    fn relay_section_goes_before_task() {
        let d = tmp();
        claim(&d, "m-alice", HolderKind::Human, None, t0()).unwrap();
        handoff(
            &d,
            "m-alice",
            "m-bob",
            HolderKind::Human,
            Some("资料已收齐".into()),
            t0(),
        )
        .unwrap();

        let names = |id: &str| match id {
            "m-alice" => Some("爱丽丝".to_string()),
            _ => None,
        };
        let sec = build_relay_section(&d, &names, 20).expect("应有接力段");
        assert!(sec.contains("爱丽丝"));
        assert!(sec.contains("m-bob"), "查不到人名要退回 id，不能丢信息");
        assert!(sec.contains("资料已收齐"));

        let merged = with_relay_section("## 项目\n根目录：/x\n\n## 任务\n请总结", Some(sec));
        let relay_at = merged.find("## 本任务接力历史").unwrap();
        let task_at = merged.find("## 任务").unwrap();
        assert!(task_at > relay_at, "接力段必须在任务指令之前");
        assert!(merged.trim_end().ends_with("请总结"), "任务指令仍须结尾");
        std::fs::remove_dir_all(&d).ok();
    }

    /// 没有「## 任务」标记时追加到末尾，不能丢内容。
    #[test]
    fn appends_when_no_task_marker() {
        let d = tmp();
        claim(&d, "m-alice", HolderKind::Human, None, t0()).unwrap();
        let sec = build_relay_section(&d, &|_| None, 20);
        let merged = with_relay_section("## 项目\n根目录：/x", sec);
        assert!(merged.starts_with("## 项目"));
        assert!(merged.contains("## 本任务接力历史"));
        std::fs::remove_dir_all(&d).ok();
    }

    #[test]
    fn limit_takes_most_recent() {
        let d = tmp();
        claim(&d, "m-a", HolderKind::Human, None, t0()).unwrap();
        handoff(&d, "m-a", "m-b", HolderKind::Human, None, t0()).unwrap();
        handoff(&d, "m-b", "m-c", HolderKind::Human, None, t0()).unwrap();
        let tail = read_chain(&d, Some(2));
        assert_eq!(tail.len(), 2);
        assert_eq!(tail[0].to.as_deref(), Some("m-b"), "取最近两条而非最早两条");
        std::fs::remove_dir_all(&d).ok();
    }
}
