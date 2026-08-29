//! 接力棒 HTTP handlers：认领 / 递交 / 放下 / 读链 / 待我处理。
//!
//! 权限口径：认领与递交属于「推进任务」，按 run 把关（viewer 不该持棒）；
//! 读链按 read。强收（force release）需 manage_members——它是管理行为。
use axum::{
    extract::{Path, Query},
    http::StatusCode,
    Json,
};
use serde::{Deserialize, Serialize};

use crate::baton::{self, Baton, BatonError, BatonState, HolderKind, RelayEntry};
use crate::http::{err, find_project_path, workspace, ApiResult, ErrBody};
use crate::http_team::{require, CurrentMember};
use crate::team::Permission;
use dazi_core::project;

/// BatonError → HTTP。Held 回 409（资源状态冲突，不是权限问题），
/// NotHolder 回 403（身份有效但不是持棒人）。
fn map_err(e: BatonError) -> (StatusCode, Json<ErrBody>) {
    match e {
        BatonError::Held { .. } => err(StatusCode::CONFLICT, e.to_string()),
        BatonError::NotHolder { .. } => err(StatusCode::FORBIDDEN, e.to_string()),
        BatonError::Io(_) => err(StatusCode::INTERNAL_SERVER_ERROR, e.to_string()),
    }
}

pub async fn get_baton(
    axum::Extension(cur): axum::Extension<CurrentMember>,
    Path(slug): Path<String>,
) -> ApiResult<BatonState> {
    require(&cur, Permission::Read)?;
    let path = find_project_path(&slug)?;
    Ok(Json(baton::read_baton(&path, chrono::Utc::now())))
}

#[derive(Deserialize)]
pub struct ClaimReq {
    #[serde(default)]
    pub note: Option<String>,
}

/// 认领棒。持棒人恒为调用者本人——不允许代他人认领，否则「谁在推进」不可信。
pub async fn claim_baton(
    axum::Extension(cur): axum::Extension<CurrentMember>,
    Path(slug): Path<String>,
    Json(req): Json<ClaimReq>,
) -> ApiResult<Baton> {
    require(&cur, Permission::Run)?;
    let path = find_project_path(&slug)?;
    baton::claim(
        &path,
        &cur.member.id,
        HolderKind::Human,
        req.note,
        chrono::Utc::now(),
    )
    .map(Json)
    .map_err(map_err)
}

#[derive(Deserialize)]
pub struct HandoffReq {
    /// 接棒人 member_id，或 agent 标识（配合 kind=agent）。
    pub to: String,
    #[serde(default)]
    pub kind: Option<HolderKind>,
    #[serde(default)]
    pub note: Option<String>,
}

/// 递棒。递给人时校验对方存在且在职——递给一个已停用成员等于把任务丢进黑洞。
pub async fn handoff_baton(
    axum::Extension(cur): axum::Extension<CurrentMember>,
    Path(slug): Path<String>,
    Json(req): Json<HandoffReq>,
) -> ApiResult<Baton> {
    require(&cur, Permission::Run)?;
    let kind = req.kind.unwrap_or(HolderKind::Human);
    if kind == HolderKind::Human {
        let ok = crate::team::load()
            .members
            .into_iter()
            .any(|m| m.id == req.to && m.status == crate::team::MemberStatus::Active);
        if !ok {
            return Err(err(StatusCode::BAD_REQUEST, "接棒人不存在或已停用"));
        }
    }
    let path = find_project_path(&slug)?;
    baton::handoff(
        &path,
        &cur.member.id,
        &req.to,
        kind,
        req.note,
        chrono::Utc::now(),
    )
    .map(Json)
    .map_err(map_err)
}

#[derive(Deserialize)]
pub struct ReleaseReq {
    #[serde(default)]
    pub note: Option<String>,
    /// 强收他人的棒。需 manage_members 权限。
    #[serde(default)]
    pub force: bool,
}

#[derive(Serialize)]
pub struct ReleaseResp {
    pub released: bool,
}

pub async fn release_baton(
    axum::Extension(cur): axum::Extension<CurrentMember>,
    Path(slug): Path<String>,
    Json(req): Json<ReleaseReq>,
) -> ApiResult<ReleaseResp> {
    require(&cur, Permission::Run)?;
    if req.force {
        require(&cur, Permission::ManageMembers)?;
    }
    let path = find_project_path(&slug)?;
    baton::release(
        &path,
        &cur.member.id,
        req.force,
        req.note,
        chrono::Utc::now(),
    )
    .map_err(map_err)?;
    Ok(Json(ReleaseResp { released: true }))
}

#[derive(Deserialize)]
pub struct ChainQuery {
    pub limit: Option<usize>,
}

pub async fn get_relay_chain(
    axum::Extension(cur): axum::Extension<CurrentMember>,
    Path(slug): Path<String>,
    Query(q): Query<ChainQuery>,
) -> ApiResult<Vec<RelayEntry>> {
    require(&cur, Permission::Read)?;
    let path = find_project_path(&slug)?;
    Ok(Json(baton::read_chain(&path, q.limit)))
}

#[derive(Serialize)]
pub struct InboxItem {
    pub slug: String,
    pub name: String,
    pub baton: Option<Baton>,
    /// 棒在我手里但已超时——最该先看的一类。
    pub expired: bool,
}

#[derive(Serialize)]
pub struct InboxResp {
    /// 棒在我手里的任务。
    pub mine: Vec<InboxItem>,
    /// 无人持棒（含超时无人接）的任务，可认领。
    pub unclaimed: Vec<InboxItem>,
}

/// 「待我处理」：把跨项目的棒状态汇总成两栏。
/// 归档项目不计入——已归档的任务不需要有人接棒。
pub async fn get_inbox(
    axum::Extension(cur): axum::Extension<CurrentMember>,
) -> ApiResult<InboxResp> {
    require(&cur, Permission::Read)?;
    let ws = workspace()?;
    let projects = project::list_projects(&ws).unwrap_or_default();
    let now = chrono::Utc::now();

    let mut mine = Vec::new();
    let mut unclaimed = Vec::new();
    for p in projects {
        let st = baton::read_baton(&p.path, now);
        let item = InboxItem {
            slug: p.slug,
            name: p.name,
            baton: st.baton.clone(),
            expired: st.expired,
        };
        match &st.baton {
            Some(b) if b.holder == cur.member.id => mine.push(item),
            // 超时的棒对其他人而言等于无人持有，可直接接管。
            Some(_) if st.expired => unclaimed.push(item),
            None => unclaimed.push(item),
            _ => {}
        }
    }
    Ok(Json(InboxResp { mine, unclaimed }))
}
