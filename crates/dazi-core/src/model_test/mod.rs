//! model_test — 来自 /Users/wxw/model-test 的服务层 port（反馈 #15）。
//!
//! 原项目是独立 Tauri app，src-tauri/src/services/mod.rs::send_test_request 测 OpenAI / Anthropic
//! 兼容 API 端点的连通性、延迟、token 统计。本模块把核心逻辑搬到 dazi-core，dazi 在
//! "CLI 后端"tab 提供"模型可用检测"按钮，复用同一份测试能力。
//!
//! 与 model-test 的差异：
//! - 去掉 app handle / tokio sleep 等运行时耦合，纯函数化（async）
//! - 调用方负责 spawn（dazi tauri 命令用 tauri::async_runtime::spawn）
//! - 配置 schema 保持兼容，后续可让 model-test 共享本模块

use serde::{Deserialize, Serialize};
use std::time::Duration;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ApiConfig {
    pub id: String,
    pub name: String,
    /// "anthropic" / "openai" / 其他视为 openai 兼容
    pub provider: String,
    pub endpoint: String,
    pub model: String,
    pub api_key: String,
}

#[derive(Debug, Clone, Serialize)]
pub struct ModelTestResponse {
    pub prompt_tokens: u64,
    pub completion_tokens: u64,
    pub content: String,
    pub actual_model: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
pub struct ModelTestResult {
    pub config_id: String,
    pub success: bool,
    pub latency_ms: u64,
    pub prompt_tokens: u64,
    pub completion_tokens: u64,
    pub error_message: Option<String>,
    pub model_response: Option<String>,
    pub actual_model: Option<String>,
}

fn build_client() -> Result<reqwest::Client, String> {
    reqwest::Client::builder()
        .connect_timeout(Duration::from_secs(30))
        .read_timeout(Duration::from_secs(60))
        .build()
        .map_err(|e| format!("创建 HTTP 客户端失败: {e}"))
}

/// 测试单个 API 端点连通性。
/// 与 model-test 行为一致：anthropic 走 /v1/messages，openai 走 /v1/chat/completions。
pub async fn test_config(config: &ApiConfig) -> ModelTestResult {
    if config.api_key.is_empty() || config.endpoint.is_empty() {
        return ModelTestResult {
            config_id: config.id.clone(),
            success: false,
            latency_ms: 0,
            prompt_tokens: 0,
            completion_tokens: 0,
            error_message: Some("api_key 或 endpoint 为空".to_string()),
            model_response: None,
            actual_model: None,
        };
    }
    let start = std::time::Instant::now();
    let outcome = send_test_request(config).await;
    let latency_ms = start.elapsed().as_millis() as u64;
    match outcome {
        Ok(resp) => ModelTestResult {
            config_id: config.id.clone(),
            success: true,
            latency_ms,
            prompt_tokens: resp.prompt_tokens,
            completion_tokens: resp.completion_tokens,
            error_message: None,
            model_response: Some(resp.content),
            actual_model: resp.actual_model,
        },
        Err(e) => ModelTestResult {
            config_id: config.id.clone(),
            success: false,
            latency_ms,
            prompt_tokens: 0,
            completion_tokens: 0,
            error_message: Some(e),
            model_response: None,
            actual_model: None,
        },
    }
}

async fn send_test_request(config: &ApiConfig) -> Result<ModelTestResponse, String> {
    let client = build_client()?;
    let (url, headers, body) = match config.provider.as_str() {
        "anthropic" => build_anthropic_request(config),
        _ => build_openai_request(config),
    };
    let response = client
        .post(&url)
        .headers(headers)
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("请求失败: {e}"))?;
    let status = response.status();
    if !status.is_success() {
        let error_text = response.text().await.unwrap_or_default();
        return Err(format!("HTTP {}: {}", status.as_u16(), error_text));
    }
    let json: serde_json::Value = response
        .json()
        .await
        .map_err(|e| format!("解析响应失败: {e}"))?;
    parse_response(&json, &config.provider)
}

fn build_openai_request(
    config: &ApiConfig,
) -> (String, reqwest::header::HeaderMap, serde_json::Value) {
    use reqwest::header::{HeaderMap, AUTHORIZATION, CONTENT_TYPE};
    let base = config.endpoint.trim_end_matches('/');
    let url = if base.ends_with("/chat/completions") {
        base.to_string()
    } else if base.ends_with("/v1") {
        format!("{base}/chat/completions")
    } else if base.contains("/v1") {
        format!("{base}/chat/completions")
    } else {
        format!("{base}/v1/chat/completions")
    };
    let mut headers = HeaderMap::new();
    headers.insert(
        AUTHORIZATION,
        format!("Bearer {}", config.api_key).parse().unwrap(),
    );
    headers.insert(CONTENT_TYPE, "application/json".parse().unwrap());
    let body = serde_json::json!({
        "model": config.model,
        "messages": [{"role": "user", "content": "Hello"}],
        "max_tokens": 100,
        "stream": false,
    });
    (url, headers, body)
}

fn build_anthropic_request(
    config: &ApiConfig,
) -> (String, reqwest::header::HeaderMap, serde_json::Value) {
    use reqwest::header::{HeaderMap, CONTENT_TYPE};
    let url = format!("{}/v1/messages", config.endpoint.trim_end_matches('/'));
    let mut headers = HeaderMap::new();
    headers.insert("x-api-key", config.api_key.parse().unwrap());
    headers.insert("anthropic-version", "2023-06-01".parse().unwrap());
    headers.insert(CONTENT_TYPE, "application/json".parse().unwrap());
    let body = serde_json::json!({
        "model": config.model,
        "messages": [{"role": "user", "content": "Hello"}],
        "max_tokens": 100,
    });
    (url, headers, body)
}

fn parse_response(json: &serde_json::Value, provider: &str) -> Result<ModelTestResponse, String> {
    match provider {
        "anthropic" => {
            let usage = json
                .get("usage")
                .ok_or_else(|| "缺少 usage 字段".to_string())?;
            let prompt_tokens = usage
                .get("input_tokens")
                .and_then(|v| v.as_u64())
                .unwrap_or(0);
            let completion_tokens = usage
                .get("output_tokens")
                .and_then(|v| v.as_u64())
                .unwrap_or(0);
            let content = json
                .get("content")
                .and_then(|c| c.get(0))
                .and_then(|c| c.get("text"))
                .and_then(|t| t.as_str())
                .unwrap_or("")
                .to_string();
            let actual_model = json.get("model").and_then(|m| m.as_str()).map(String::from);
            Ok(ModelTestResponse {
                prompt_tokens,
                completion_tokens,
                content,
                actual_model,
            })
        }
        _ => {
            let usage = json
                .get("usage")
                .ok_or_else(|| "缺少 usage 字段".to_string())?;
            let prompt_tokens = usage
                .get("prompt_tokens")
                .and_then(|v| v.as_u64())
                .unwrap_or(0);
            let completion_tokens = usage
                .get("completion_tokens")
                .and_then(|v| v.as_u64())
                .unwrap_or(0);
            let content = json
                .get("choices")
                .and_then(|c| c.get(0))
                .and_then(|c| c.get("message"))
                .and_then(|m| m.get("content"))
                .and_then(|t| t.as_str())
                .unwrap_or("")
                .to_string();
            let actual_model = json.get("model").and_then(|m| m.as_str()).map(String::from);
            Ok(ModelTestResponse {
                prompt_tokens,
                completion_tokens,
                content,
                actual_model,
            })
        }
    }
}
