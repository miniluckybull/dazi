//! 调度循环（M3c）：daemon 内置周期 tick，让纯服务器部署（无桌面 GUI）也能
//! 到点自动推进定时/循环任务。等价桌面端 src-tauri 里的 60s tick，但服务器端
//! 强制走审批流——autopilot 任务到点只产「计划」推手机等批，不直接执行。
//!
//! 与桌面端的差异：
//! - 桌面端到点直接 bypassPermissions 执行（execute_autopilot）；
//! - daemon 到点改为 plan 模式产计划 + 推 ApprovalRequested，人批准后才真执行
//!   （复用 http_approval::resolve_approval 的现有路径）。
use std::collections::HashSet;
use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use std::time::Duration;

use dazi_core::events::DaziEvent;
use dazi_core::events::EventSink;
use dazi_core::{config, schedule};
use tokio::sync::Semaphore;

use crate::http::AppState;

const TICK_SECS: u64 = 60;

/// 同时进行的产计划任务上限。
///
/// 每个 request_plan 都会起一个真实的 CLI 进程（各自还要拉起模型请求）。
/// 此前无任何上限：20 个任务排到同一分钟就是 20 个并发进程，在 8 核小机上
/// 足以把机器压死，而团队版的执行点只有一台。取核数一半（至少 1），
/// 给 daemon 自身的 HTTP/WS 留出余量。
fn plan_concurrency() -> usize {
    std::thread::available_parallelism()
        .map(|n| (n.get() / 2).max(1))
        .unwrap_or(1)
}

/// 启动周期调度循环（在独立 tokio 任务里跑）。
/// 启动时先为存量项目补算 next_run_at，之后每 TICK_SECS 扫一次 due 列表。
pub fn spawn(state: AppState) {
    // 正在生成计划的项目路径，防止上一次 plan 还没跑完时本 tick 重复触发。
    let in_flight: Arc<Mutex<HashSet<PathBuf>>> = Arc::new(Mutex::new(HashSet::new()));
    // 全局并发闸。与 in_flight 是两件事：in_flight 防同一项目重入，
    // 闸门限制不同项目的总并发。
    let gate = Arc::new(Semaphore::new(plan_concurrency()));

    tokio::spawn(async move {
        // 启动补算（兼容老数据 / daemon 重启）。
        if let Ok(cfg) = config::load() {
            if let Some(ws) = cfg.workspace.clone() {
                schedule::refresh_all(&ws);
            }
        }

        let mut ticker = tokio::time::interval(Duration::from_secs(TICK_SECS));
        loop {
            ticker.tick().await;
            tick(&state, &in_flight, &gate).await;
        }
    });
}

/// 单次扫描：取 due 列表，autopilot 走审批流、notify 保持原行为。
async fn tick(
    state: &AppState,
    in_flight: &Arc<Mutex<HashSet<PathBuf>>>,
    gate: &Arc<Semaphore>,
) {
    let Ok(cfg) = config::load() else { return };
    let Some(ws) = cfg.workspace.clone() else { return };

    let due = schedule::scan_due(&ws, chrono::Utc::now());
    for d in due {
        if d.action == "autopilot" {
            // 已在生成计划的跳过；否则标记 in-flight 并起 blocking 任务产计划。
            {
                let mut set = in_flight.lock().unwrap();
                if set.contains(&d.path) {
                    continue;
                }
                set.insert(d.path.clone());
            }
            let state = state.clone();
            let flight = in_flight.clone();
            let gate = gate.clone();
            let path = d.path.clone();
            let slug = d.slug.clone();
            // 排队等闸门放行，再进 blocking 线程池。等待放在独立任务里，
            // 否则会把 tick 循环连同 notify 分支一起堵住。
            tokio::spawn(async move {
                // 闸门与 daemon 同生命周期，acquire 只在关闭时失败，此时直接放弃本次。
                let Ok(_permit) = gate.acquire_owned().await else {
                    flight.lock().unwrap().remove(&path);
                    return;
                };
                // request_plan 内部阻塞调用 claude，放 blocking 线程池。
                let handle = tokio::task::spawn_blocking(move || {
                    // 调度器自动发起，无人类调用者，故发起人为 None。
                    let result = crate::http_approval::request_plan(&state, &slug, None);
                    match result {
                        Ok(_) => {
                            // 记一次触发并推进 next_run_at，避免下个 tick 重复生成计划。
                            let _ = schedule::record_run(&path, "plan-requested", true, None);
                        }
                        Err(e) => {
                            // 生成计划失败也记一条，推进调度，避免卡在同一到期点反复重试。
                            let _ = schedule::record_run(&path, "plan-requested", false, Some(e));
                        }
                    }
                    path
                });
                // blocking 任务 panic 也要把 in-flight 标记清掉，否则该项目永久卡死。
                match handle.await {
                    Ok(p) => {
                        flight.lock().unwrap().remove(&p);
                    }
                    Err(e) => {
                        tracing::error!("产计划任务异常退出: {e}");
                        flight.lock().unwrap().clear();
                    }
                }
            });
        } else {
            // notify（及其它）：记录触发 + 推 TaskTriggered，保持桌面端原行为。
            let _ = schedule::record_run(&d.path, &d.action, true, None);
            state.events.emit(DaziEvent::TaskTriggered {
                slug: d.slug.clone(),
                name: d.name.clone(),
            });
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    /// 闸门必须真的有上限——此前是无上限，N 个任务到点起 N 个进程。
    #[test]
    fn plan_concurrency_is_bounded_and_at_least_one() {
        let n = plan_concurrency();
        assert!(n >= 1, "至少要能跑一个，否则调度永久停摆");
        let cores = std::thread::available_parallelism()
            .map(|c| c.get())
            .unwrap_or(1);
        assert!(n <= cores, "不该超过核数：{n} > {cores}");
    }
}
