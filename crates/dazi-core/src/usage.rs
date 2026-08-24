//! usage — token 用量与费用落盘（反馈 #16）。
//!
//! 每次 autopilot 跑完把 usage 落盘到 ~/.dazi/usage/YYYY-MM.json，按月聚合。
//! 单价表（按模型名）估算 cost_usd。设计：append-only，崩溃恢复友好。

use serde::{Deserialize, Serialize};
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UsageEntry {
    pub at: String, // ISO 8601 local
    pub project_slug: String,
    pub model: Option<String>,
    pub input_tokens: u64,
    pub output_tokens: u64,
    pub cache_creation_input_tokens: u64,
    pub cache_read_input_tokens: u64,
    pub cost_usd: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct UsageMonth {
    pub entries: Vec<UsageEntry>,
}

fn home_dir() -> Result<PathBuf, String> {
    std::env::var("HOME")
        .or_else(|_| std::env::var("USERPROFILE"))
        .map(PathBuf::from)
        .map_err(|e| format!("无法读取 HOME/USERPROFILE: {e}"))
}

fn usage_dir() -> Result<PathBuf, String> {
    let dir = home_dir()?.join(".dazi").join("usage");
    std::fs::create_dir_all(&dir).map_err(|e| format!("创建 ~/.dazi/usage 失败: {e}"))?;
    Ok(dir)
}

fn current_month() -> String {
    chrono::Local::now().format("%Y-%m").to_string()
}

/// 单价表（USD / 百万 token）。仅覆盖常见模型；未知模型按 0 计算。
/// 来源：anthropic 公开定价快照（2026-07），可能调整——后续可在 SettingsPanel 加自定义覆盖。
fn price_per_mtok(model: &str) -> (f64, f64, f64, f64) {
    // (input, output, cache_creation, cache_read)
    let m = model.to_lowercase();
    if m.contains("opus-4") || m.contains("opus 4") {
        (15.0, 75.0, 18.75, 1.5)
    } else if m.contains("sonnet-4") || m.contains("sonnet 4") {
        (3.0, 15.0, 3.75, 0.3)
    } else if m.contains("haiku-4") || m.contains("haiku 4") {
        (1.0, 5.0, 1.25, 0.1)
    } else {
        // 未知模型按 0 处理，避免误算；前端 UI 提示"未匹配单价"
        (0.0, 0.0, 0.0, 0.0)
    }
}

pub fn estimate_cost(usage: &serde_json::Value, model: Option<&str>) -> f64 {
    let m = model.unwrap_or("");
    let (p_in, p_out, p_cache_c, p_cache_r) = price_per_mtok(m);
    let input = usage
        .get("input_tokens")
        .and_then(|v| v.as_u64())
        .unwrap_or(0) as f64;
    let output = usage
        .get("output_tokens")
        .and_then(|v| v.as_u64())
        .unwrap_or(0) as f64;
    let cache_c = usage
        .get("cache_creation_input_tokens")
        .and_then(|v| v.as_u64())
        .unwrap_or(0) as f64;
    let cache_r = usage
        .get("cache_read_input_tokens")
        .and_then(|v| v.as_u64())
        .unwrap_or(0) as f64;
    (input * p_in + output * p_out + cache_c * p_cache_c + cache_r * p_cache_r)
        / 1_000_000.0
}

/// 把一次 autopilot 执行的 usage 追加到当前月份文件。
/// usage 为 None 或字段缺失时记 0 token + 0 成本。
pub fn append_usage(
    project_path: &std::path::Path,
    model: Option<&str>,
    usage: Option<&serde_json::Value>,
) -> Result<(), String> {
    let project_slug = project_path
        .file_name()
        .map(|s| s.to_string_lossy().to_string())
        .unwrap_or_else(|| "project".to_string());
    let at = chrono::Local::now().to_rfc3339();
    let (input, output, cache_c, cache_r) = match usage {
        Some(u) => (
            u.get("input_tokens").and_then(|v| v.as_u64()).unwrap_or(0),
            u.get("output_tokens").and_then(|v| v.as_u64()).unwrap_or(0),
            u.get("cache_creation_input_tokens")
                .and_then(|v| v.as_u64())
                .unwrap_or(0),
            u.get("cache_read_input_tokens")
                .and_then(|v| v.as_u64())
                .unwrap_or(0),
        ),
        None => (0, 0, 0, 0),
    };
    let cost = match usage {
        Some(u) => estimate_cost(u, model),
        None => 0.0,
    };
    let entry = UsageEntry {
        at,
        project_slug,
        model: model.map(String::from),
        input_tokens: input,
        output_tokens: output,
        cache_creation_input_tokens: cache_c,
        cache_read_input_tokens: cache_r,
        cost_usd: cost,
    };
    let month = current_month();
    let path = usage_dir()?.join(format!("{month}.json"));
    let mut m: UsageMonth = if path.exists() {
        let raw = std::fs::read_to_string(&path).map_err(|e| e.to_string())?;
        serde_json::from_str(&raw).unwrap_or_default()
    } else {
        UsageMonth::default()
    };
    m.entries.push(entry);
    let raw = serde_json::to_string_pretty(&m).map_err(|e| e.to_string())?;
    std::fs::write(&path, raw).map_err(|e| e.to_string())?;
    Ok(())
}

pub fn read_month(month: &str) -> Result<UsageMonth, String> {
    let path = usage_dir()?.join(format!("{month}.json"));
    if !path.exists() {
        return Ok(UsageMonth::default());
    }
    let raw = std::fs::read_to_string(&path).map_err(|e| e.to_string())?;
    serde_json::from_str(&raw).map_err(|e| e.to_string())
}

pub fn list_months() -> Result<Vec<String>, String> {
    let dir = usage_dir()?;
    let mut months: Vec<String> = Vec::new();
    for entry in std::fs::read_dir(&dir).map_err(|e| e.to_string())? {
        let entry = entry.map_err(|e| e.to_string())?;
        let name = entry.file_name().to_string_lossy().to_string();
        if name.ends_with(".json") && name.len() == 7 + 5 {
            // 2026-07.json
            months.push(name.trim_end_matches(".json").to_string());
        }
    }
    months.sort_by(|a, b| b.cmp(a)); // 倒序
    Ok(months)
}

/// 一次 autopilot 执行的用量/费用预估（审批时展示给用户）。
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UsageEstimate {
    /// 估算依据："project"（该项目历史均值）或 "global"（全部项目历史均值）。
    pub scope: String,
    /// 参与平均的历史样本数。
    pub sample_size: u64,
    pub avg_input_tokens: f64,
    pub avg_output_tokens: f64,
    pub avg_cost_usd: f64,
}

/// 项目历史样本不足时回退全局平均的阈值。
const MIN_PROJECT_SAMPLES: usize = 3;

fn average(entries: &[&UsageEntry], scope: &str) -> UsageEstimate {
    let n = entries.len() as f64;
    let sum = entries.iter().fold((0.0, 0.0, 0.0), |(i, o, c), e| {
        (
            i + e.input_tokens as f64,
            o + e.output_tokens as f64,
            c + e.cost_usd,
        )
    });
    UsageEstimate {
        scope: scope.to_string(),
        sample_size: entries.len() as u64,
        avg_input_tokens: sum.0 / n,
        avg_output_tokens: sum.1 / n,
        avg_cost_usd: sum.2 / n,
    }
}

/// 基于 ~/.dazi/usage 历史估算一次 autopilot 执行的花费。
/// 该项目历史 >= MIN_PROJECT_SAMPLES 次时用项目均值，否则用全局均值；
/// 完全没有任何历史时返回 None（调用方不附预估字段）。
pub fn estimate_run_cost(project_slug: &str) -> Option<UsageEstimate> {
    let months = list_months().ok()?;
    let mut all: Vec<UsageEntry> = Vec::new();
    for m in months {
        if let Ok(mo) = read_month(&m) {
            all.extend(mo.entries);
        }
    }
    if all.is_empty() {
        return None;
    }
    let project: Vec<&UsageEntry> = all
        .iter()
        .filter(|e| e.project_slug == project_slug)
        .collect();
    if project.len() >= MIN_PROJECT_SAMPLES {
        Some(average(&project, "project"))
    } else {
        let refs: Vec<&UsageEntry> = all.iter().collect();
        Some(average(&refs, "global"))
    }
}
