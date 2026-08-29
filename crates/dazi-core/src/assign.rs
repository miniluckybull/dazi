//! 指派（assignee）：这个任务归谁负责。
//!
//! 与接力棒是两件事，刻意分开存：
//! - **棒**是「现在谁在动手」，抢占性、有 TTL、频繁易手，空着是常态。
//! - **指派**是「这活归谁」，是责任归属，不过期，通常几天不变。
//!
//! 把两者合并会立刻出问题：放下棒不该等于卸下责任，而超时释放更不该
//! 悄悄把责任也一起清掉。
//!
//! 同 baton 一样存独立文件而非 meta.yml：`ProjectMeta` 不认识 assignee，
//! serde 默认忽略未知字段，任何一次 write_meta 都会静默抹掉它；而给 meta.yml
//! 加字段会让 S2 冻结的字节 golden 失效，等于拆掉迁移的回退保障。
//!
//! 刻意**不**实现计划里提到的 watchers：目前没有任何消费方。评论 @提及
//! 已经提供了通知路径，watchers 现在加进来只是一个没人读的字段。
use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};

use crate::team::write_atomic;

/// `.dazi/assign.json` 的内容。
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct Assignment {
    /// 负责人 member_id。
    pub assignee: String,
    /// 指派时刻（RFC3339）。
    pub at: String,
    /// 指派者 member_id。自我认领时与 assignee 相同。
    pub by: String,
}

pub fn assign_path(project: &Path) -> PathBuf {
    project.join(".dazi").join("assign.json")
}

/// 读指派。文件缺失、内容非法、assignee 为空都回 None——
/// 坏数据按「未指派」处理，不让任务因一个读不出的字段变得不可操作。
pub fn read_assignment(project: &Path) -> Option<Assignment> {
    let raw = std::fs::read_to_string(assign_path(project)).ok()?;
    let a: Assignment = serde_json::from_str(&raw).ok()?;
    if a.assignee.is_empty() {
        return None;
    }
    Some(a)
}

/// 设指派。`assignee` 为 None 表示取消指派（删文件）。
pub fn set_assignment(
    project: &Path,
    assignee: Option<&str>,
    by: &str,
    now: chrono::DateTime<chrono::Utc>,
) -> Result<Option<Assignment>, String> {
    let path = assign_path(project);
    match assignee {
        None => {
            if path.exists() {
                std::fs::remove_file(&path).map_err(|e| format!("删除 assign.json 失败: {e}"))?;
            }
            Ok(None)
        }
        Some(who) => {
            if let Some(dir) = path.parent() {
                std::fs::create_dir_all(dir).map_err(|e| format!("创建 .dazi 失败: {e}"))?;
            }
            let a = Assignment {
                assignee: who.to_string(),
                at: now.to_rfc3339_opts(chrono::SecondsFormat::AutoSi, true),
                by: by.to_string(),
            };
            let mut raw = serde_json::to_string_pretty(&a).map_err(|e| e.to_string())?;
            raw.push('\n'); // 与 baton.json / TS 侧一致
            write_atomic(&path, &raw)?;
            Ok(Some(a))
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    /// 每个用例独立目录。计数器不可省：macOS 时钟精度粗于纳秒，
    /// 仅靠 pid+时间戳在并行测试下会撞名，撞上的两个用例会互删对方的目录。
    fn tmp() -> PathBuf {
        use std::sync::atomic::{AtomicU64, Ordering};
        static SEQ: AtomicU64 = AtomicU64::new(0);
        let p = std::env::temp_dir().join(format!(
            "dazi-assign-{}-{}",
            std::process::id(),
            SEQ.fetch_add(1, Ordering::Relaxed)
        ));
        std::fs::create_dir_all(&p).unwrap();
        p
    }

    fn now() -> chrono::DateTime<chrono::Utc> {
        chrono::Utc::now()
    }

    #[test]
    fn set_read_and_clear_roundtrip() {
        let p = tmp();
        assert!(read_assignment(&p).is_none(), "初始应未指派");

        let a = set_assignment(&p, Some("m-alice"), "m-boss", now())
            .unwrap()
            .unwrap();
        assert_eq!(a.assignee, "m-alice");
        assert_eq!(a.by, "m-boss");
        assert_eq!(read_assignment(&p).as_ref(), Some(&a));

        // 改派：覆盖而非追加。
        set_assignment(&p, Some("m-bob"), "m-boss", now()).unwrap();
        assert_eq!(read_assignment(&p).unwrap().assignee, "m-bob");

        assert!(set_assignment(&p, None, "m-boss", now()).unwrap().is_none());
        assert!(read_assignment(&p).is_none());
        // 取消已取消的不该报错（幂等）。
        assert!(set_assignment(&p, None, "m-boss", now()).is_ok());
        let _ = std::fs::remove_dir_all(&p);
    }

    /// 坏数据按未指派处理。这里同时覆盖了空 assignee——
    /// 若按「已指派给空字符串」处理，界面会显示一个匿名负责人。
    #[test]
    fn corrupt_or_empty_reads_as_unassigned() {
        let p = tmp();
        std::fs::create_dir_all(p.join(".dazi")).unwrap();
        std::fs::write(assign_path(&p), "{ 这不是 json").unwrap();
        assert!(read_assignment(&p).is_none());
        std::fs::write(
            assign_path(&p),
            r#"{"assignee":"","at":"2026-01-01T00:00:00Z","by":"m-x"}"#,
        )
        .unwrap();
        assert!(read_assignment(&p).is_none());
        let _ = std::fs::remove_dir_all(&p);
    }
}
