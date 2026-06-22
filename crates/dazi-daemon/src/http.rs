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
    pub ptys: Arc<crate::pty::PtyManager>,
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

pub async fn health(State(state): State<AppState>) -> Json<serde_json::Value> {
    let cfg = config::load().ok();
    let workspace = cfg
        .and_then(|c| c.workspace)
        .map(|w| w.display().to_string());
    let claude = match tokio::task::spawn_blocking(dazi_core::autopilot::probe_claude).await {
        Ok(Ok(v)) => serde_json::json!({ "ok": true, "version": v }),
        Ok(Err(e)) => serde_json::json!({ "ok": false, "error": e }),
        Err(e) => serde_json::json!({ "ok": false, "error": format!("探活任务失败: {e}") }),
    };
    Json(serde_json::json!({
        "ok": true,
        "service": "dazi-daemon",
        "version": env!("CARGO_PKG_VERSION"),
        "workspace": workspace,
        "devices": state.auth.device_count(),
        "claude": claude,
    }))
}

/// 跨项目运行历史（活动+归档项目的 meta.runs 汇总，最近 N 条）。
pub async fn get_runs() -> ApiResult<Vec<schedule::RunEntry>> {
    let ws = workspace()?;
    Ok(Json(schedule::list_recent_runs(&ws, 100)))
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

pub async fn manifest() -> impl IntoResponse {
    use axum::http::header;
    (
        [(header::CONTENT_TYPE, "application/json; charset=utf-8")],
        include_str!("../static/manifest.json"),
    )
}

pub async fn service_worker() -> axum::response::Response {
    use axum::http::header;
    (
        [(header::CONTENT_TYPE, "application/javascript; charset=utf-8")],
        include_str!("../static/service-worker.js"),
    )
        .into_response()
}

pub async fn icon(Path(path): Path<String>) -> impl IntoResponse {
    use axum::http::header;
    let bytes: &'static [u8] = match path.as_str() {
        "icon-192x192.png" => include_bytes!("../static/icons/icon-192x192.png"),
        "icon-512x512.png" => include_bytes!("../static/icons/icon-512x512.png"),
        "apple-touch-icon.png" => include_bytes!("../static/icons/apple-touch-icon.png"),
        _ => return StatusCode::NOT_FOUND.into_response(),
    };
    (
        [(header::CONTENT_TYPE, "image/png")],
        bytes,
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

/// 读全局记忆：name 限 profile/facts/patterns，防路径穿越。
pub async fn get_memory(Path(name): Path<String>) -> ApiResult<TextBody> {
    let file = match name.as_str() {
        "profile" => "profile.md",
        "facts" => "facts.md",
        "patterns" => "patterns.md",
        _ => return Err(err(StatusCode::BAD_REQUEST, "记忆名只能是 profile/facts/patterns")),
    };
    let content = memory::read_global(file).unwrap_or_default();
    Ok(Json(TextBody { content }))
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
