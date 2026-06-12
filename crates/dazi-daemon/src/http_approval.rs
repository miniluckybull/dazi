//! 手机审批 HTTP handlers（M2-4）。
//! plan：以 plan 模式产出计划并登记待批 + 推 approval-requested。
//! resolve：批准则真正执行（bypassPermissions）并推 task-completed；拒绝则推 approval-resolved。
use axum::{
    extract::{Path, State},
    http::StatusCode,
    Json,
};
use dazi_core::events::DaziEvent;
use dazi_core::events::EventSink;
use dazi_core::{autopilot, project, prompt, schedule};
use serde::Deserialize;

use crate::approval::Approval;
use crate::http::{err, find_project_path, AppState, ApiResult};

fn model_of(path: &std::path::Path) -> Option<String> {
    project::read_meta(path)
        .ok()
        .and_then(|m| m.on_trigger)
        .and_then(|t| t.model)
}

/// 为某项目以 plan 模式产出执行计划，登记为待批并推 approval-requested。
/// claude plan 模式只读、不执行，安全。供 HTTP handler 与 scheduler tick 复用。
/// scheduler 在 blocking 上下文调用，故拆成同步函数（内部不 await）。
pub fn request_plan(state: &AppState, slug: &str) -> Result<Approval, String> {
    let path = find_project_path(slug).map_err(|(_, j)| j.0.error)?;
    let name = project::read_meta(&path)
        .map(|m| m.name)
        .unwrap_or_else(|_| slug.to_string());
    let model = model_of(&path);
    let plan_prompt = prompt::build_plan_prompt(&path);

    let outcome = autopilot::run_plan(&path, &plan_prompt, model.as_deref())?;

    let approval = state.approvals.create(slug, &name, &outcome.summary);
    state.events.emit(DaziEvent::ApprovalRequested {
        slug: slug.to_string(),
        name,
        approval_id: approval.id.clone(),
        plan: outcome.summary,
    });
    Ok(approval)
}

/// 以 plan 模式为某项目产出执行计划，登记为待批并推 approval-requested。
/// claude plan 模式只读、不执行，安全。
pub async fn create_plan(
    State(state): State<AppState>,
    Path(slug): Path<String>,
) -> ApiResult<Approval> {
    // claude 调用是阻塞且耗时的，放到 blocking 线程池。
    let approval = tokio::task::spawn_blocking(move || request_plan(&state, &slug))
        .await
        .map_err(|e| err(StatusCode::INTERNAL_SERVER_ERROR, format!("计划任务失败: {e}")))?
        .map_err(|e| err(StatusCode::INTERNAL_SERVER_ERROR, e))?;
    Ok(Json(approval))
}

/// 列出全部待批审批。
pub async fn list_approvals(State(state): State<AppState>) -> ApiResult<Vec<Approval>> {
    Ok(Json(state.approvals.list_pending()))
}

#[derive(Deserialize)]
pub struct ResolveReq {
    pub approved: bool,
}

/// 决策一条审批。批准则真正执行（bypassPermissions），拒绝则仅记录。
pub async fn resolve_approval(
    State(state): State<AppState>,
    Path((slug, id)): Path<(String, String)>,
    Json(req): Json<ResolveReq>,
) -> ApiResult<Approval> {
    let approval = state
        .approvals
        .resolve(&id, req.approved)
        .ok_or_else(|| err(StatusCode::CONFLICT, "审批不存在或已处理"))?;

    if !req.approved {
        // 拒绝：推事件、记一条 journal，结束。
        state.events.emit(DaziEvent::ApprovalResolved {
            slug: slug.clone(),
            approval_id: id.clone(),
            approved: false,
        });
        return Ok(Json(approval));
    }

    // 批准：真正执行 autopilot（bypassPermissions）。
    let path = find_project_path(&slug)?;
    let name = approval.name.clone();
    let model = model_of(&path);
    let exec_prompt = prompt::build_autopilot_prompt(&path);
    let exec_path = path.clone();

    let outcome = tokio::task::spawn_blocking(move || {
        autopilot::run_autopilot(&exec_path, &exec_prompt, model.as_deref())
    })
    .await
    .map_err(|e| err(StatusCode::INTERNAL_SERVER_ERROR, format!("执行任务失败: {e}")))?
    .map_err(|e| err(StatusCode::INTERNAL_SERVER_ERROR, e))?;

    let _ = autopilot::append_autopilot_journal(&path, &outcome);
    let msg = match &outcome.session_id {
        Some(sid) => format!("{}\n[session: {sid}]", outcome.summary),
        None => outcome.summary.clone(),
    };
    let _ = schedule::record_run(&path, "autopilot", outcome.ok, Some(msg));

    state.events.emit(DaziEvent::ApprovalResolved {
        slug: slug.clone(),
        approval_id: id,
        approved: true,
    });
    state.events.emit(DaziEvent::TaskCompleted {
        slug,
        name,
        ok: outcome.ok,
        summary: outcome.summary,
    });
    Ok(Json(approval))
}
