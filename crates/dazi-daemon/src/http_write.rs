//! 写 HTTP handlers（M2）。所有业务逻辑复用 dazi-core。
use axum::{extract::Path, http::StatusCode, Json};
use dazi_core::{memory, project, schedule};
use serde::Deserialize;

use crate::http::{err, find_project_path, workspace, ApiResult, TextBody};
use crate::http_team::{require, CurrentMember};
use crate::team::Permission;

#[derive(Deserialize)]
pub struct CreateReq {
    pub name: String,
    #[serde(default)]
    pub init: Option<project::ProjectInit>,
}

pub async fn create_project(
    axum::Extension(cur): axum::Extension<CurrentMember>,
    Json(req): Json<CreateReq>,
) -> ApiResult<project::ProjectSummary> {
    require(&cur, Permission::Write)?;
    let ws = workspace()?;
    project::create_project_with(&ws, &req.name, req.init.unwrap_or_default())
        .map(Json)
        .map_err(|e| err(StatusCode::INTERNAL_SERVER_ERROR, e))
}

pub async fn put_readme(
    axum::Extension(cur): axum::Extension<CurrentMember>,
    Path(slug): Path<String>,
    Json(body): Json<TextBody>,
) -> ApiResult<TextBody> {
    require(&cur, Permission::Write)?;
    let path = find_project_path(&slug)?;
    project::write_readme(&path, &body.content)
        .map_err(|e| err(StatusCode::INTERNAL_SERVER_ERROR, e))?;
    Ok(Json(TextBody { content: body.content }))
}

pub async fn patch_meta(
    axum::Extension(cur): axum::Extension<CurrentMember>,
    Path(slug): Path<String>,
    Json(patch): Json<project::MetaPatch>,
) -> ApiResult<project::ProjectMeta> {
    require(&cur, Permission::Write)?;
    let path = find_project_path(&slug)?;
    project::update_meta(&path, patch)
        .map(Json)
        .map_err(|e| err(StatusCode::INTERNAL_SERVER_ERROR, e))
}

/// 排期落盘即等于「到点自动起 claude 进程」，是执行而非普通写入，故要 run 权限。
pub async fn put_schedule(
    axum::Extension(cur): axum::Extension<CurrentMember>,
    Path(slug): Path<String>,
    Json(patch): Json<schedule::SchedulePatch>,
) -> ApiResult<project::ProjectMeta> {
    require(&cur, Permission::Run)?;
    let path = find_project_path(&slug)?;
    schedule::apply_schedule_patch(&path, patch)
        .map(Json)
        .map_err(|e| err(StatusCode::INTERNAL_SERVER_ERROR, e))
}

/// 写全局记忆：name 限定 profile / facts / patterns，防路径穿越。
pub async fn put_memory(
    axum::Extension(cur): axum::Extension<CurrentMember>,
    Path(name): Path<String>,
    Json(body): Json<TextBody>,
) -> ApiResult<TextBody> {
    require(&cur, Permission::Write)?;
    let file = match name.as_str() {
        "profile" => "profile.md",
        "facts" => "facts.md",
        "patterns" => "patterns.md",
        _ => return Err(err(StatusCode::BAD_REQUEST, "记忆名只能是 profile/facts/patterns")),
    };
    memory::write_global(file, &body.content)
        .map_err(|e| err(StatusCode::INTERNAL_SERVER_ERROR, e))?;
    Ok(Json(TextBody { content: body.content }))
}
