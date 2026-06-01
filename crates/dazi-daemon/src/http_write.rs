//! 写 HTTP handlers（M2）。所有业务逻辑复用 dazi-core。
use axum::{extract::Path, http::StatusCode, Json};
use dazi_core::{config, memory, project, schedule};
use serde::Deserialize;
use std::path::PathBuf;

use crate::http::{err, ApiResult, ErrBody, TextBody};

fn workspace() -> Result<PathBuf, (StatusCode, Json<ErrBody>)> {
    let cfg = config::load().map_err(|e| err(StatusCode::INTERNAL_SERVER_ERROR, e))?;
    cfg.workspace
        .ok_or_else(|| err(StatusCode::CONFLICT, "尚未设置工作区"))
}

/// 在活动 + 归档项目里按 slug 找项目目录。
fn find_project_path(slug: &str) -> Result<PathBuf, (StatusCode, Json<ErrBody>)> {
    let ws = workspace()?;
    let mut all = project::list_projects(&ws).unwrap_or_default();
    all.extend(project::list_archived(&ws).unwrap_or_default());
    all.into_iter()
        .find(|p| p.slug == slug)
        .map(|p| p.path)
        .ok_or_else(|| err(StatusCode::NOT_FOUND, format!("找不到项目: {slug}")))
}

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
