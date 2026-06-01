//! 写 HTTP handlers（M2）。所有业务逻辑复用 dazi-core。
use axum::{extract::Path, http::StatusCode, Json};
use dazi_core::{memory, project, schedule};
use serde::Deserialize;

use crate::http::{err, find_project_path, workspace, ApiResult, TextBody};

#[derive(Deserialize)]
pub struct CreateReq {
    pub name: String,
    #[serde(default)]
    pub init: Option<project::ProjectInit>,
}

pub async fn create_project(Json(req): Json<CreateReq>) -> ApiResult<project::ProjectSummary> {
    let ws = workspace()?;
    project::create_project_with(&ws, &req.name, req.init.unwrap_or_default())
        .map(Json)
        .map_err(|e| err(StatusCode::INTERNAL_SERVER_ERROR, e))
}

pub async fn put_readme(
    Path(slug): Path<String>,
    Json(body): Json<TextBody>,
) -> ApiResult<TextBody> {
    let path = find_project_path(&slug)?;
    project::write_readme(&path, &body.content)
        .map_err(|e| err(StatusCode::INTERNAL_SERVER_ERROR, e))?;
    Ok(Json(TextBody { content: body.content }))
}

pub async fn patch_meta(
    Path(slug): Path<String>,
    Json(patch): Json<project::MetaPatch>,
) -> ApiResult<project::ProjectMeta> {
    let path = find_project_path(&slug)?;
    project::update_meta(&path, patch)
        .map(Json)
        .map_err(|e| err(StatusCode::INTERNAL_SERVER_ERROR, e))
}

pub async fn put_schedule(
    Path(slug): Path<String>,
    Json(patch): Json<schedule::SchedulePatch>,
) -> ApiResult<project::ProjectMeta> {
    let path = find_project_path(&slug)?;
    schedule::apply_schedule_patch(&path, patch)
        .map(Json)
        .map_err(|e| err(StatusCode::INTERNAL_SERVER_ERROR, e))
}

/// 写全局记忆：name 限定 profile / facts / patterns，防路径穿越。
pub async fn put_memory(
    Path(name): Path<String>,
    Json(body): Json<TextBody>,
) -> ApiResult<TextBody> {
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
