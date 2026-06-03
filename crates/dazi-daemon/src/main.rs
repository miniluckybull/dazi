//! dazi-daemon — Dazi 的常驻大脑（M1：只读 API + 配对鉴权）。
//! 复用 dazi-core 的全部业务逻辑，监听局域网，供手机等瘦客户端访问。
mod approval;
mod auth;
mod http;
mod http_approval;
mod http_write;
mod ws;

use axum::{
    extract::State,
    http::{header, Request, StatusCode},
    middleware::{self, Next},
    response::Response,
    routing::{get, post, put},
    Router,
};
use std::sync::Arc;
use tower_http::cors::CorsLayer;

use auth::Auth;
use http::AppState;

const DEFAULT_PORT: u16 = 7878;

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt()
        .with_max_level(tracing::Level::INFO)
        .init();

    let auth = Arc::new(Auth::new());
    let state = AppState {
        auth: auth.clone(),
        events: ws::WsSink::new(),
        approvals: Arc::new(approval::ApprovalStore::new()),
    };

    // 公开端点：Web 页静态资源、健康检查与配对（配对靠 PIN，不需要 token）。
    // WebSocket 事件流也在此：浏览器无法设 header，token 走查询参数，在 handler 内校验。
    let public = Router::new()
        .route("/", get(http::index))
        .route("/app.js", get(http::app_js))
        .route("/health", get(http::health))
        .route("/api/v1/pair", post(http::pair))
        .route("/api/v1/events", get(ws::ws_handler));

    // 受保护端点：需 Bearer device_token。
    let protected = Router::new()
        .route("/api/v1/config", get(http::get_config))
        .route(
            "/api/v1/projects",
            get(http::list_projects).post(http_write::create_project),
        )
        .route(
            "/api/v1/projects/:slug",
            get(http::get_meta).patch(http_write::patch_meta),
        )
        .route(
            "/api/v1/projects/:slug/readme",
            get(http::get_readme).put(http_write::put_readme),
        )
        .route("/api/v1/projects/:slug/journal", get(http::get_journal))
        .route("/api/v1/projects/:slug/context", get(http::get_context))
        .route("/api/v1/projects/:slug/schedule", put(http_write::put_schedule))
        .route(
            "/api/v1/memory/:name",
            get(http::get_memory).put(http_write::put_memory),
        )
        .route("/api/v1/due", get(http::get_due))
        .route("/api/v1/runs", get(http::get_runs))
        .route(
            "/api/v1/projects/:slug/plan",
            post(http_approval::create_plan),
        )
        .route("/api/v1/approvals", get(http_approval::list_approvals))
        .route(
            "/api/v1/projects/:slug/approvals/:id",
            post(http_approval::resolve_approval),
        )
        .layer(middleware::from_fn_with_state(state.clone(), require_auth));

    let app = Router::new()
        .merge(public)
        .merge(protected)
        .layer(CorsLayer::permissive())
        .with_state(state);

    let port = std::env::var("DAZI_DAEMON_PORT")
        .ok()
        .and_then(|s| s.parse().ok())
        .unwrap_or(DEFAULT_PORT);
    // 监听 0.0.0.0 让局域网内手机可达；鉴权由配对 token 把关。
    let addr = format!("0.0.0.0:{port}");
    let listener = tokio::net::TcpListener::bind(&addr)
        .await
        .expect("绑定端口失败");

    tracing::info!("dazi-daemon 监听 http://{addr}");
    // 启动自检：claude 探活。失败仅告警，不阻断 daemon（只读功能仍可用，
    // 自动执行/审批到点时会再报错）。
    let claude_line = match dazi_core::autopilot::probe_claude() {
        Ok(v) => format!("  claude: ✓ {v}"),
        Err(e) => format!("  claude: ✗ 不可用 — {e}\n         （自动执行/审批将无法运行，请检查 claude 安装与登录）"),
    };
    println!("\n========================================");
    println!("  dazi-daemon 已启动: http://{addr}");
    println!("  配对 PIN: {}", auth.pin());
    println!("  （手机首次连接时输入此 PIN 完成配对）");
    println!("{claude_line}");
    println!("========================================\n");

    axum::serve(listener, app).await.expect("服务异常退出");
}

/// Bearer token 鉴权中间件。
async fn require_auth(
    State(state): State<AppState>,
    req: Request<axum::body::Body>,
    next: Next,
) -> Result<Response, StatusCode> {
    let token = req
        .headers()
        .get(header::AUTHORIZATION)
        .and_then(|v| v.to_str().ok())
        .and_then(|s| s.strip_prefix("Bearer "))
        .map(|s| s.to_string());

    match token {
        Some(t) if state.auth.verify(&t) => Ok(next.run(req).await),
        _ => Err(StatusCode::UNAUTHORIZED),
    }
}
