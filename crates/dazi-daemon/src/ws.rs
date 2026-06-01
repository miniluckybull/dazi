//! WebSocket 实时事件下发（M2-3）。
//! WsSink 把 DaziEvent 广播给所有已连接客户端；ws_handler 订阅 broadcast
//! 并把事件序列化为 JSON 文本帧推给手机。
use axum::{
    extract::{
        ws::{Message, WebSocket, WebSocketUpgrade},
        Query, State,
    },
    http::StatusCode,
    response::Response,
};
use dazi_core::events::{DaziEvent, EventSink};
use serde::Deserialize;
use tokio::sync::broadcast;

use crate::http::AppState;

/// 基于 tokio broadcast 的事件出口。克隆便宜（内部 Arc），可在多处持有。
#[derive(Clone)]
pub struct WsSink {
    tx: broadcast::Sender<DaziEvent>,
}

impl WsSink {
    pub fn new() -> Self {
        // 容量 256：慢客户端落后过多会丢最旧事件（重连后用 REST 全量对账）。
        let (tx, _rx) = broadcast::channel(256);
        WsSink { tx }
    }

    pub fn subscribe(&self) -> broadcast::Receiver<DaziEvent> {
        self.tx.subscribe()
    }
}

impl EventSink for WsSink {
    fn emit(&self, event: DaziEvent) {
        // 无订阅者时返回 Err，忽略即可。
        let _ = self.tx.send(event);
    }
}

#[derive(Deserialize)]
pub struct WsQuery {
    token: Option<String>,
}

/// WebSocket 升级入口。浏览器 WebSocket 无法自定义 header，
/// 故 token 走查询参数 ?token=xxx 鉴权。
pub async fn ws_handler(
    ws: WebSocketUpgrade,
    Query(q): Query<WsQuery>,
    State(state): State<AppState>,
) -> Result<Response, StatusCode> {
    let token = q.token.unwrap_or_default();
    if !state.auth.verify(&token) {
        return Err(StatusCode::UNAUTHORIZED);
    }
    let rx = state.events.subscribe();
    Ok(ws.on_upgrade(move |socket| handle_socket(socket, rx)))
}

async fn handle_socket(mut socket: WebSocket, mut rx: broadcast::Receiver<DaziEvent>) {
    loop {
        match rx.recv().await {
            Ok(event) => {
                let Ok(json) = serde_json::to_string(&event) else {
                    continue;
                };
                if socket.send(Message::Text(json)).await.is_err() {
                    break; // 客户端已断开
                }
            }
            Err(broadcast::error::RecvError::Lagged(_)) => {
                // 落后丢帧：提示客户端重新全量拉取。
                let _ = socket
                    .send(Message::Text(
                        r#"{"type":"lagged"}"#.to_string(),
                    ))
                    .await;
            }
            Err(broadcast::error::RecvError::Closed) => break,
        }
    }
}
