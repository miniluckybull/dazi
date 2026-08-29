//! dazi-daemon — Dazi 的常驻大脑（M1：只读 API + 配对鉴权）。
//! 复用 dazi-core 的全部业务逻辑，监听局域网，供手机等瘦客户端访问。
mod approval;
mod auth;
mod http;
mod http_approval;
mod http_assign;
mod http_baton;
mod http_team;
mod http_write;
mod pty;
mod scheduler;
mod ws;

/// baton 与 team 住在 dazi-core：桌面（src-tauri，直读文件系统）与本 daemon
/// 必须共用同一份实现，否则两侧对同一份 baton.json 的判断会漂移。
/// 这里做 crate 内别名，使既有 `crate::team::` 路径不必逐处改写。
use dazi_core::{baton, team};

use axum::{
    extract::State,
    http::{header, Request, StatusCode},
    middleware::{self, Next},
    response::Response,
    routing::{delete, get, post, put},
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

    // 身份地基：首启创建唯一 owner，并把历史遗留设备补绑给它。
    // 失败则直接退出——没有身份表就无法鉴权，带着空表继续跑等于全线放行。
    let owner = match team::bootstrap_owner(&default_owner_name()) {
        Ok(m) => m,
        Err(e) => {
            eprintln!("初始化团队身份失败，无法安全启动: {e}");
            std::process::exit(1);
        }
    };
    tracing::info!("owner: {} ({})", owner.name, owner.id);

    let auth = Arc::new(Auth::new(&owner.id));
    let state = AppState {
        auth: auth.clone(),
        events: ws::WsSink::new(),
        approvals: Arc::new(approval::ApprovalStore::new()),
        ptys: Arc::new(pty::PtyManager::default()),
    };

    // 公开端点：Web 页静态资源、健康检查与配对（配对靠 PIN，不需要 token）。
    // WebSocket 事件流也在此：浏览器无法设 header，token 走查询参数，在 handler 内校验。
    let public = Router::new()
        .route("/", get(http::index))
        .route("/app.js", get(http::app_js))
        .route("/manifest.json", get(http::manifest))
        .route("/service-worker.js", get(http::service_worker))
        .route("/icons/:path", get(http::icon))
        .route("/health", get(http::health))
        .route("/api/v1/pair", post(http::pair))
        .route("/api/v1/pair/invite", post(http_team::pair_with_invite))
        .route("/api/v1/events", get(ws::ws_handler))
        .route(
            "/api/v1/projects/:slug/terminal",
            get(pty::ws_terminal_handler),
        );

    // 受保护端点：需 Bearer device_token。
    let protected = Router::new()
        .route("/api/v1/config", get(http::get_config))
        .route(
            "/api/v1/projects/:slug/terminal",
            delete(pty::kill_terminal),
        )
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
        // 接力棒：认领/递交/放下 + 接力链 + 跨项目「待我处理」。
        .route(
            "/api/v1/projects/:slug/baton",
            get(http_baton::get_baton)
                .post(http_baton::claim_baton)
                .delete(http_baton::release_baton),
        )
        .route(
            "/api/v1/projects/:slug/baton/handoff",
            post(http_baton::handoff_baton),
        )
        .route("/api/v1/projects/:slug/relay", get(http_baton::get_relay_chain))
        .route("/api/v1/inbox", get(http_baton::get_inbox))
        // 指派与评论：责任归属（≠ 棒）+ @提及派活。
        .route(
            "/api/v1/projects/:slug/assignee",
            get(http_assign::get_assignment).put(http_assign::set_assignment),
        )
        .route(
            "/api/v1/projects/:slug/comments",
            get(http_assign::list_comments).post(http_assign::add_comment),
        )
        .route("/api/v1/assigned", get(http_assign::get_assigned_to_me))
        .route(
            "/api/v1/projects/:slug/approvals/:id",
            post(http_approval::resolve_approval),
        )
        // 团队身份：成员、邀请码、设备吊销。
        .route("/api/v1/me", get(http_team::me))
        .route(
            "/api/v1/members",
            get(http_team::list_members).post(http_team::add_member),
        )
        .route(
            "/api/v1/members/:id/invite",
            post(http_team::create_invite),
        )
        .route(
            "/api/v1/members/:id/suspend",
            post(http_team::suspend_member),
        )
        .route("/api/v1/devices", get(http_team::list_devices))
        .route("/api/v1/devices/:id", delete(http_team::revoke_device))
        // 详细健康信息含工作区路径等内部状态，必须鉴权（公开 /health 只回最小信息）。
        .route("/api/v1/health", get(http::health_detail))
        .layer(middleware::from_fn_with_state(state.clone(), require_auth));

    let app = Router::new()
        .merge(public)
        .merge(protected)
        .layer(CorsLayer::permissive())
        .with_state(state.clone());

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
    let daemon_url = format!("http://{}:{port}", lan_ipv4());
    let pair_url = format!(
        "dazi://pair?url={}&pin={}",
        url_encode(&daemon_url),
        auth.pin()
    );
    println!("\n========================================");
    println!("  dazi-daemon 已启动: http://{addr}");
    println!("  配对 PIN: {}", auth.pin());
    println!("  （手机首次连接时输入此 PIN 完成配对）");
    println!("  配对链接: {pair_url}");
    println!("  扫码配对（手机 App 扫码自动填充地址与 PIN）:");
    print_pair_qr(&pair_url);
    println!("{claude_line}");
    println!("========================================\n");

    // 启动内置调度循环：到点的 autopilot 任务走审批流（产计划推手机），
    // notify 任务推 TaskTriggered。让纯服务器部署也能自动推进定时任务。
    scheduler::spawn(state.clone());

    // Ctrl-C 优雅退出：杀掉全部 PTY 子进程，避免孤儿 shell/claude 进程。
    let ptys = state.ptys.clone();
    let shutdown = async move {
        let _ = tokio::signal::ctrl_c().await;
        ptys.kill_all();
    };
    axum::serve(listener, app)
        .with_graceful_shutdown(shutdown)
        .await
        .expect("服务异常退出");
}

/// 探测本机局域网 IPv4（UDP connect 不产生真实流量），找不到回退 127.0.0.1。
fn lan_ipv4() -> String {
    std::net::UdpSocket::bind("0.0.0.0:0")
        .and_then(|s| {
            s.connect("8.8.8.8:80")?;
            s.local_addr()
        })
        .map(|a| a.ip().to_string())
        .ok()
        .filter(|ip| ip != "0.0.0.0")
        .unwrap_or_else(|| "127.0.0.1".to_string())
}

/// 最小 URL percent-encoding（unreserved 之外全部转义）。
fn url_encode(s: &str) -> String {
    let mut out = String::with_capacity(s.len());
    for b in s.bytes() {
        match b {
            b'A'..=b'Z' | b'a'..=b'z' | b'0'..=b'9' | b'-' | b'_' | b'.' | b'~' => {
                out.push(b as char)
            }
            _ => out.push_str(&format!("%{b:02X}")),
        }
    }
    out
}

/// 在终端打印可扫描的二维码（unicode 半块渲染）。
fn print_pair_qr(content: &str) {
    match qrcode::QrCode::new(content.as_bytes()) {
        Ok(code) => {
            let art = code
                .render::<qrcode::render::unicode::Dense1x2>()
                .quiet_zone(true)
                .build();
            println!("{art}");
        }
        Err(e) => println!("  （二维码生成失败: {e}）"),
    }
}

/// Bearer token 鉴权中间件。
///
/// 解析出「是谁」并注入请求扩展，而不只是判断「通不通过」——后者会让审批、
/// 运行等操作永远无法追溯到人。设备已吊销、成员不存在或已停用一律 401。
async fn require_auth(
    State(state): State<AppState>,
    mut req: Request<axum::body::Body>,
    next: Next,
) -> Result<Response, StatusCode> {
    let token = req
        .headers()
        .get(header::AUTHORIZATION)
        .and_then(|v| v.to_str().ok())
        .and_then(|s| s.strip_prefix("Bearer "))
        .map(|s| s.to_string())
        .ok_or(StatusCode::UNAUTHORIZED)?;

    let cur = http_team::resolve_caller(&state, &token).ok_or(StatusCode::UNAUTHORIZED)?;
    req.extensions_mut().insert(cur);
    Ok(next.run(req).await)
}

/// owner 默认名：取系统用户名，拿不到就用占位名。仅首启使用，之后可改。
fn default_owner_name() -> String {
    std::env::var("USER")
        .or_else(|_| std::env::var("USERNAME"))
        .unwrap_or_else(|_| "owner".to_string())
}
