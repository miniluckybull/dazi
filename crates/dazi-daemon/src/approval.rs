//! 手机审批（human-in-the-loop，M2-4）。
//! autopilot 先以 plan 模式产出计划 → 存入待批表 → 推 approval-requested 到手机；
//! 用户批准后才以 bypassPermissions 真正执行。
//! 审批记录持久化在 ~/.dazi/approvals.json，daemon 重启不丢。
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::Mutex;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "kebab-case")]
pub enum ApprovalStatus {
    Pending,
    Approved,
    Rejected,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Approval {
    pub id: String,
    pub slug: String,
    pub name: String,
    /// claude plan 模式产出的计划文本。
    pub plan: String,
    pub status: ApprovalStatus,
    pub created_at: chrono::DateTime<chrono::Utc>,
    /// 基于 ~/.dazi/usage 历史的本次执行用量/费用预估；无历史时为 None。
    #[serde(default)]
    pub estimate: Option<dazi_core::usage::UsageEstimate>,
    /// 发起人 member_id。调度器自动发起时为 None。
    /// 旧记录无此字段，故 #[serde(default)]——审批表是持久化的，不能因升级读不回来。
    #[serde(default)]
    pub requested_by: Option<String>,
    /// 审批人 member_id 与决策时刻。Pending 时为 None。
    /// 没有这两个字段，「谁批准了这次执行」永远无法追溯。
    #[serde(default)]
    pub resolved_by: Option<String>,
    #[serde(default)]
    pub resolved_at: Option<chrono::DateTime<chrono::Utc>>,
}

/// 落盘文件格式：seq 一并保存，避免重启后 id 与已留存的记录冲突。
#[derive(Serialize, Deserialize, Default)]
struct ApprovalsFile {
    seq: u64,
    items: Vec<Approval>,
}

fn approvals_path() -> Option<PathBuf> {
    let home = std::env::var("HOME").ok()?;
    let dir = PathBuf::from(home).join(".dazi");
    std::fs::create_dir_all(&dir).ok()?;
    Some(dir.join("approvals.json"))
}

pub struct ApprovalStore {
    items: Mutex<HashMap<String, Approval>>,
    seq: Mutex<u64>,
    /// 落盘路径；None 表示纯内存（测试用）。
    path: Option<PathBuf>,
}

impl ApprovalStore {
    pub fn new() -> Self {
        let path = approvals_path();
        let file = path
            .as_ref()
            .and_then(|p| std::fs::read_to_string(p).ok())
            .and_then(|raw| serde_json::from_str::<ApprovalsFile>(&raw).ok())
            .unwrap_or_default();
        ApprovalStore {
            items: Mutex::new(file.items.into_iter().map(|a| (a.id.clone(), a)).collect()),
            seq: Mutex::new(file.seq),
            path,
        }
    }

    /// 纯内存 store（单元测试用，不触碰磁盘）。
    #[cfg(test)]
    fn ephemeral() -> Self {
        ApprovalStore {
            items: Mutex::new(HashMap::new()),
            seq: Mutex::new(0),
            path: None,
        }
    }

    /// 把当前内存态写盘。调用方需持有 items 锁以保证快照一致。
    /// 写失败仅告警，不影响内存态（重启丢失，与旧行为一致）。
    fn save_locked(&self, items: &HashMap<String, Approval>) {
        let Some(path) = &self.path else {
            return;
        };
        let file = ApprovalsFile {
            seq: *self.seq.lock().unwrap(),
            items: items.values().cloned().collect(),
        };
        match serde_json::to_string_pretty(&file) {
            Ok(raw) => {
                if let Err(e) = std::fs::write(path, raw) {
                    tracing::warn!("写入 {} 失败: {e}", path.display());
                }
            }
            Err(e) => tracing::warn!("序列化 approvals 失败: {e}"),
        }
    }

    fn next_id(&self) -> String {
        let mut seq = self.seq.lock().unwrap();
        *seq += 1;
        format!("ap{}", *seq)
    }

    /// 登记一条待批计划，返回其 id。
    pub fn create(
        &self,
        slug: &str,
        name: &str,
        plan: &str,
        estimate: Option<dazi_core::usage::UsageEstimate>,
        requested_by: Option<String>,
    ) -> Approval {
        let id = self.next_id();
        let approval = Approval {
            id: id.clone(),
            slug: slug.to_string(),
            name: name.to_string(),
            plan: plan.to_string(),
            status: ApprovalStatus::Pending,
            created_at: chrono::Utc::now(),
            estimate,
            requested_by,
            resolved_by: None,
            resolved_at: None,
        };
        let mut items = self.items.lock().unwrap();
        items.insert(id, approval.clone());
        self.save_locked(&items);
        approval
    }

    /// 列出全部待批（Pending）审批，按创建时间升序。
    pub fn list_pending(&self) -> Vec<Approval> {
        let mut v: Vec<Approval> = self
            .items
            .lock()
            .unwrap()
            .values()
            .filter(|a| a.status == ApprovalStatus::Pending)
            .cloned()
            .collect();
        v.sort_by_key(|a| a.created_at);
        v
    }

    /// 决策一条审批。仅当当前为 Pending 且 slug 与登记时一致才允许，返回更新后的审批。
    /// 返回 None 表示 id 不存在、不属于该项目，或已决策过（防重复执行与跨项目越权）。
    /// slug 校验与审批人落盘都在锁内完成，避免调用方先查后改的竞态。
    pub fn resolve(
        &self,
        id: &str,
        slug: &str,
        approved: bool,
        resolved_by: &str,
    ) -> Option<Approval> {
        let mut items = self.items.lock().unwrap();
        let a = items.get_mut(id)?;
        if a.slug != slug || a.status != ApprovalStatus::Pending {
            return None;
        }
        a.status = if approved {
            ApprovalStatus::Approved
        } else {
            ApprovalStatus::Rejected
        };
        a.resolved_by = Some(resolved_by.to_string());
        a.resolved_at = Some(chrono::Utc::now());
        let updated = a.clone();
        self.save_locked(&items);
        Some(updated)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn create_then_list_and_resolve() {
        let store = ApprovalStore::ephemeral();
        let a = store.create("proj-x", "项目X", "计划：写文件 a.txt", None, None);
        assert_eq!(a.status, ApprovalStatus::Pending);
        assert_eq!(store.list_pending().len(), 1);

        // 批准后从待批列表消失
        let resolved = store
            .resolve(&a.id, "proj-x", true, "m-1")
            .expect("应能决策");
        assert_eq!(resolved.status, ApprovalStatus::Approved);
        assert_eq!(store.list_pending().len(), 0);

        // 重复决策被拒（防重复执行）
        assert!(store.resolve(&a.id, "proj-x", true, "m-1").is_none());
        // 不存在的 id
        assert!(store.resolve("nope", "proj-x", false, "m-1").is_none());
    }

    #[test]
    fn reject_keeps_record_but_not_pending() {
        let store = ApprovalStore::ephemeral();
        let a = store.create("p", "P", "plan", None, None);
        let r = store.resolve(&a.id, "p", false, "m-1").unwrap();
        assert_eq!(r.status, ApprovalStatus::Rejected);
        assert_eq!(store.list_pending().len(), 0);
    }

    /// 跨项目越权：拿 A 项目的审批 id 去 B 项目的路径上决策必须失败，
    /// 且该审批要保持 Pending（不能被顺带改坏）。
    #[test]
    fn resolve_rejects_slug_mismatch() {
        let store = ApprovalStore::ephemeral();
        let a = store.create("proj-a", "A", "plan", None, None);

        assert!(store.resolve(&a.id, "proj-b", true, "m-1").is_none());
        assert_eq!(store.list_pending().len(), 1);
        // 仍可由正确的项目决策
        assert!(store.resolve(&a.id, "proj-a", true, "m-1").is_some());
    }

    /// 「谁发起、谁批准、何时批准」必须落到记录上——这是团队版能追溯的前提。
    #[test]
    fn records_requester_and_approver() {
        let store = ApprovalStore::ephemeral();
        let a = store.create("p", "P", "plan", None, Some("m-alice".into()));
        assert_eq!(a.requested_by.as_deref(), Some("m-alice"));
        assert!(a.resolved_by.is_none(), "待批时不该有审批人");
        assert!(a.resolved_at.is_none());

        let r = store.resolve(&a.id, "p", true, "m-bob").unwrap();
        assert_eq!(r.resolved_by.as_deref(), Some("m-bob"));
        assert!(r.resolved_at.is_some());
        assert_eq!(r.requested_by.as_deref(), Some("m-alice"), "发起人不能被覆盖");
    }

    /// 调度器自动发起的审批没有发起人，这是合法状态，不是缺失。
    #[test]
    fn scheduler_originated_has_no_requester() {
        let store = ApprovalStore::ephemeral();
        let a = store.create("p", "P", "plan", None, None);
        assert!(a.requested_by.is_none());
    }

    /// 升级兼容：旧 approvals.json 没有三个新字段，必须仍能读回，
    /// 否则一次升级就让待批表整体失效。
    #[test]
    fn deserializes_pre_upgrade_record() {
        let raw = r#"{"id":"ap1","slug":"p","name":"P","plan":"x",
            "status":"pending","created_at":"2026-01-01T00:00:00Z"}"#;
        let a: Approval = serde_json::from_str(raw).unwrap();
        assert_eq!(a.id, "ap1");
        assert_eq!(a.status, ApprovalStatus::Pending);
        assert!(a.requested_by.is_none());
        assert!(a.resolved_by.is_none());
        assert!(a.resolved_at.is_none());
    }
}

