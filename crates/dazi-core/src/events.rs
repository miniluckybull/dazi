//! events.rs — 宿主无关的事件出口。
//! engine/daemon 产生 DaziEvent，由具体 EventSink 实现投递（桌面 → tauri emit，
//! daemon → WebSocket broadcast）。dazi-core 不关心事件最终发给谁。
use serde::{Deserialize, Serialize};

/// Dazi 运行期事件。序列化后经 WebSocket 下发给手机等客户端。
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", content = "data", rename_all = "kebab-case")]
pub enum DaziEvent {
    /// 调度到点：某任务被触发（autopilot 或 notify）。
    TaskTriggered { slug: String, name: String },
    /// 自动执行完成：带成败与摘要。
    TaskCompleted {
        slug: String,
        name: String,
        ok: bool,
        summary: String,
        /// 本次运行记录 id（与 meta.yml runs / GET /runs 对应，便于客户端关联历史）。
        #[serde(default)]
        run_id: String,
        /// 本次运行在项目目录内新建/修改的文件相对路径清单（上限 50）。
        #[serde(default)]
        artifacts: Vec<String>,
    },
    /// 手机审批请求：autopilot 产出 dry-run 计划，等待用户批准。
    ApprovalRequested {
        slug: String,
        name: String,
        approval_id: String,
        plan: String,
        /// 基于 ~/.dazi/usage 历史的本次执行用量/费用预估；无历史时为 None。
        #[serde(default)]
        estimate: Option<crate::usage::UsageEstimate>,
    },
    /// 审批结果已落定（批准/拒绝），用于多端同步 UI。
    ApprovalResolved {
        slug: String,
        approval_id: String,
        approved: bool,
    },
}

/// 事件投递出口。实现者负责把事件送达各自的客户端。
/// 要求 Send + Sync 以便跨线程持有（tick loop / async handler）。
pub trait EventSink: Send + Sync {
    fn emit(&self, event: DaziEvent);
}

/// 空实现：不投递任何事件（用于不需要事件的场景或测试）。
pub struct NullSink;

impl EventSink for NullSink {
    fn emit(&self, _event: DaziEvent) {}
}
