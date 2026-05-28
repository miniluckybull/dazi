use chrono::{DateTime, Datelike, Duration, Utc};
use std::path::Path;

use crate::project::{
    list_projects, projects_dir, read_meta, write_meta, Interval, ProjectMeta, RunRecord,
};

/// 计算给定 meta 的下一次触发时间。
/// - oneoff: None
/// - scheduled: schedule.run_at（若已运行过则 None）
/// - recurring: 基于 interval 与上一次运行时间（或 schedule.run_at）推算
pub fn compute_next_run(meta: &ProjectMeta, now: DateTime<Utc>) -> Option<DateTime<Utc>> {
    match meta.task_type.as_str() {
        "scheduled" => {
            let sched = meta.schedule.as_ref()?;
            let run_at = sched.run_at?;
            // 已经触发过就不再排
            let already_ran = meta.runs.iter().any(|r| r.at >= run_at);
            if already_ran {
                None
            } else {
                Some(run_at)
            }
        }
        "recurring" => {
            let sched = meta.schedule.as_ref()?;
            if sched.paused {
                return None;
            }
            let interval = sched.interval.as_ref()?;
            // 达到次数上限
            if let Some(max) = sched.max_runs {
                if meta.runs.len() as u32 >= max {
                    return None;
                }
            }
            // 起点：上一次运行 or schedule.run_at（首次锚点）or 现在
            let anchor = meta
                .runs
                .last()
                .map(|r| r.at)
                .or(sched.run_at)
                .unwrap_or(now);
            let mut next = if meta.runs.is_empty() && sched.run_at.is_some() {
                anchor
            } else {
                advance(anchor, interval)?
            };
            // 若 next 仍在过去，连续推进直到 >= now（避免一次补跑过多）
            while next < now {
                next = advance(next, interval)?;
            }
            if let Some(end) = sched.ends_at {
                if next > end {
                    return None;
                }
            }
            Some(next)
        }
        _ => None,
    }
}

fn advance(t: DateTime<Utc>, iv: &Interval) -> Option<DateTime<Utc>> {
    let n = iv.every.max(1) as i64;
    match iv.unit.as_str() {
        "minute" => Some(t + Duration::minutes(n)),
        "hour" => Some(t + Duration::hours(n)),
        "day" => Some(t + Duration::days(n)),
        "week" => Some(t + Duration::weeks(n)),
        "month" => Some(add_months(t, n as i32)),
        _ => None,
    }
}

fn add_months(t: DateTime<Utc>, months: i32) -> DateTime<Utc> {
    let mut y = t.year();
    let mut m = t.month() as i32 + months;
    while m > 12 {
        m -= 12;
        y += 1;
    }
    while m < 1 {
        m += 12;
        y -= 1;
    }
    let day = t.day().min(last_day_of_month(y, m as u32));
    t.with_year(y)
        .and_then(|d| d.with_month(m as u32))
        .and_then(|d| d.with_day(day))
        .unwrap_or(t)
}

fn last_day_of_month(year: i32, month: u32) -> u32 {
    let (ny, nm) = if month == 12 {
        (year + 1, 1)
    } else {
        (year, month + 1)
    };
    let first_next = chrono::NaiveDate::from_ymd_opt(ny, nm, 1).unwrap();
    (first_next - chrono::Duration::days(1)).day()
}

/// 重新计算并写回 next_run_at（不改 updated_at）。
pub fn recompute_and_save(project_path: &Path) -> Result<ProjectMeta, String> {
    let mut meta = read_meta(project_path)?;
    meta.next_run_at = compute_next_run(&meta, Utc::now());
    write_meta(project_path, &meta)?;
    Ok(meta)
}

/// 记录一次触发，并重算 next_run_at。
pub fn record_run(
    project_path: &Path,
    action: &str,
    ok: bool,
    message: Option<String>,
) -> Result<ProjectMeta, String> {
    let mut meta = read_meta(project_path)?;
    meta.runs.push(RunRecord {
        at: Utc::now(),
        action: action.to_string(),
        ok,
        message,
    });
    meta.next_run_at = compute_next_run(&meta, Utc::now());
    write_meta(project_path, &meta)?;
    Ok(meta)
}

#[derive(Debug, Clone, serde::Serialize)]
pub struct DueProject {
    pub slug: String,
    pub name: String,
    pub path: std::path::PathBuf,
    pub action: String,
    pub due_at: DateTime<Utc>,
}

/// 扫描 workspace 下所有项目，返回 next_run_at <= now 的待触发项。
pub fn scan_due(workspace: &Path, now: DateTime<Utc>) -> Vec<DueProject> {
    let mut out = vec![];
    let summaries = list_projects(workspace).unwrap_or_default();
    for s in summaries {
        let Ok(meta) = read_meta(&s.path) else {
            continue;
        };
        let Some(due) = meta.next_run_at else { continue };
        if due > now {
            continue;
        }
        let action = meta
            .on_trigger
            .as_ref()
            .map(|t| t.action.clone())
            .unwrap_or_else(|| "notify".to_string());
        out.push(DueProject {
            slug: s.slug,
            name: s.name,
            path: s.path,
            action,
            due_at: due,
        });
    }
    out
}

/// 启动时为存量项目补算 next_run_at（兼容老数据）。
pub fn refresh_all(workspace: &Path) {
    let dir = projects_dir(workspace);
    let Ok(read) = std::fs::read_dir(&dir) else {
        return;
    };
    for entry in read.flatten() {
        let p = entry.path();
        if !p.is_dir() {
            continue;
        }
        let _ = recompute_and_save(&p);
    }
}
