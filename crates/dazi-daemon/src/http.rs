//! 只读 HTTP handlers（M1）。所有业务逻辑复用 dazi-core。
use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use dazi_core::{config, memory, project, schedule};
use serde::Serialize;
use std::path::PathBuf;
use std::sync::Arc;

use crate::auth::Auth;

#[derive(Clone)]
pub struct AppState {
    pub auth: Arc<Auth>,
    pub events: crate::ws::WsSink,
    pub approvals: Arc<crate::approval::ApprovalStore>,
}

/// 统一错误：把 dazi-core 的 String 错误映射为 500 + JSON。
pub type ApiResult<T> = Result<Json<T>, (StatusCode, Json<ErrBody>)>;

#[derive(Serialize)]
pub struct ErrBody {
    pub error: String,
}

pub(crate) fn err(code: StatusCode, msg: impl Into<String>) -> (StatusCode, Json<ErrBody>) {
    (code, Json(ErrBody { error: msg.into() }))
}

pub(crate) fn workspace() -> Result<PathBuf, (StatusCode, Json<ErrBody>)> {
    let cfg = config::load().map_err(|e| err(StatusCode::INTERNAL_SERVER_ERROR, e))?;
    cfg.workspace
        .ok_or_else(|| err(StatusCode::CONFLICT, "尚未设置工作区"))
}

/// 在活动 + 归档项目里按 slug 找项目目录。
pub(crate) fn find_project_path(slug: &str) -> Result<PathBuf, (StatusCode, Json<ErrBody>)> {
    let ws = workspace()?;
    let mut all = project::list_projects(&ws).unwrap_or_default();
    all.extend(project::list_archived(&ws).unwrap_or_default());
    all.into_iter()
        .find(|p| p.slug == slug)
        .map(|p| p.path)
        .ok_or_else(|| err(StatusCode::NOT_FOUND, format!("找不到项目: {slug}")))
}

pub async fn health() -> Json<serde_json::Value> {
    Json(serde_json::json!({ "ok": true, "service": "dazi-daemon" }))
}

/// 手机只读 Web 页：编译进二进制，无需额外部署静态目录。
pub async fn index() -> axum::response::Html<&'static str> {
    axum::response::Html(include_str!("../static/index.html"))
}

pub async fn app_js() -> axum::response::Response {
    use axum::http::header;
    (
        [(header::CONTENT_TYPE, "application/javascript; charset=utf-8")],
        include_str!("../static/app.js"),
    )
        .into_response()
}

pub async fn get_config() -> ApiResult<config::AppConfig> {
    config::load()
        .map(Json)
        .map_err(|e| err(StatusCode::INTERNAL_SERVER_ERROR, e))
}

pub async fn list_projects() -> ApiResult<Vec<project::ProjectSummary>> {
    let ws = workspace()?;
    let mut all = project::list_projects(&ws).map_err(|e| err(StatusCode::INTERNAL_SERVER_ERROR, e))?;
    all.extend(project::list_archived(&ws).unwrap_or_default());
    Ok(Json(all))
}

pub async fn get_meta(Path(slug): Path<String>) -> ApiResult<project::ProjectMeta> {
    let path = find_project_path(&slug)?;
    project::read_meta(&path)
        .map(Json)
        .map_err(|e| err(StatusCode::INTERNAL_SERVER_ERROR, e))
}

#[derive(Serialize, serde::Deserialize)]
pub struct TextBody {
    pub content: String,
}

pub async fn get_readme(Path(slug): Path<String>) -> ApiResult<TextBody> {
    let path = find_project_path(&slug)?;
    project::read_readme(&path)
        .map(|content| Json(TextBody { content }))
        .map_err(|e| err(StatusCode::INTERNAL_SERVER_ERROR, e))
}

pub async fn get_journal(Path(slug): Path<String>) -> ApiResult<TextBody> {
    let path = find_project_path(&slug)?;
    let content = memory::read_project(&path, "journal.md").unwrap_or_default();
    Ok(Json(TextBody { content }))
}

pub async fn get_context(Path(slug): Path<String>) -> ApiResult<TextBody> {
    let path = find_project_path(&slug)?;
    let content = memory::read_project(&path, "context.md").unwrap_or_default();
    Ok(Json(TextBody { content }))
}

pub async fn get_due() -> ApiResult<Vec<schedule::DueProject>> {
    let ws = workspace()?;
    Ok(Json(schedule::scan_due(&ws, chrono::Utc::now())))
}

#[derive(serde::Deserialize)]
pub struct PairReq {
    pub pin: String,
    pub device_name: String,
}

#[derive(Serialize)]
pub struct PairResp {
    pub device_token: String,
}

pub async fn pair(
    State(state): State<AppState>,
    Json(req): Json<PairReq>,
) -> ApiResult<PairResp> {
    let token = state
        .auth
        .pair(&req.pin, &req.device_name)
        .map_err(|e| err(StatusCode::UNAUTHORIZED, e))?;
    Ok(Json(PairResp {
        device_token: token,
    }))
}
