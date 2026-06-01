//! 手机审批（human-in-the-loop，M2-4）。
//! autopilot 先以 plan 模式产出计划 → 存入待批表 → 推 approval-requested 到手机；
//! 用户批准后才以 bypassPermissions 真正执行。内存态，daemon 重启丢失（可接受）。
use serde::Serialize;
use std::collections::HashMap;
use std::sync::Mutex;

#[derive(Debug, Clone, Serialize, PartialEq)]
#[serde(rename_all = "kebab-case")]
pub enum ApprovalStatus {
    Pending,
    Approved,
    Rejected,
}

#[derive(Debug, Clone, Serialize)]
pub struct Approval {
    pub id: String,
    pub slug: String,
    pub name: String,
    /// claude plan 模式产出的计划文本。
    pub plan: String,
    pub status: ApprovalStatus,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Default)]
pub struct ApprovalStore {
    items: Mutex<HashMap<String, Approval>>,
    seq: Mutex<u64>,
}

impl ApprovalStore {
    pub fn new() -> Self {
        Self::default()
    }

    fn next_id(&self) -> String {
        let mut seq = self.seq.lock().unwrap();
        *seq += 1;
        format!("ap{}", *seq)
    }

    /// 登记一条待批计划，返回其 id。
    pub fn create(&self, slug: &str, name: &str, plan: &str) -> Approval {
        let id = self.next_id();
        let approval = Approval {
            id: id.clone(),
            slug: slug.to_string(),
            name: name.to_string(),
            plan: plan.to_string(),
            status: ApprovalStatus::Pending,
            created_at: chrono::Utc::now(),
        };
        self.items
            .lock()
            .unwrap()
            .insert(id, approval.clone());
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

    /// 决策一条审批。仅当当前为 Pending 才允许，返回更新后的审批。
    /// 返回 None 表示 id 不存在或已决策过（防重复执行）。
    pub fn resolve(&self, id: &str, approved: bool) -> Option<Approval> {
        let mut items = self.items.lock().unwrap();
        let a = items.get_mut(id)?;
        if a.status != ApprovalStatus::Pending {
            return None;
        }
        a.status = if approved {
            ApprovalStatus::Approved
        } else {
            ApprovalStatus::Rejected
        };
        Some(a.clone())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn create_then_list_and_resolve() {
        let store = ApprovalStore::new();
        let a = store.create("proj-x", "项目X", "计划：写文件 a.txt");
        assert_eq!(a.status, ApprovalStatus::Pending);
        assert_eq!(store.list_pending().len(), 1);

        // 批准后从待批列表消失
        let resolved = store.resolve(&a.id, true).expect("应能决策");
        assert_eq!(resolved.status, ApprovalStatus::Approved);
        assert_eq!(store.list_pending().len(), 0);

        // 重复决策被拒（防重复执行）
        assert!(store.resolve(&a.id, true).is_none());
        // 不存在的 id
        assert!(store.resolve("nope", false).is_none());
    }

    #[test]
    fn reject_keeps_record_but_not_pending() {
        let store = ApprovalStore::new();
        let a = store.create("p", "P", "plan");
        let r = store.resolve(&a.id, false).unwrap();
        assert_eq!(r.status, ApprovalStatus::Rejected);
        assert_eq!(store.list_pending().len(), 0);
    }
}
