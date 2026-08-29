//! 指派与评论 HTTP handlers。
//!
//! 权限口径：
//! - 读指派/读评论按 read。
//! - **发评论按 read 而非 write**：viewer 是「能看但不能改任务」，
//!   不是「不能说话」。评论不动任务内容，把它按 write 把关会让 viewer
//!   连提问都做不到，那这个角色就没有存在意义了。
//! - 改指派按 write：指派是对任务的安排，属于改任务。
use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    Json,
};
use serde::{Deserialize, Serialize};

use crate::http::{err, find_project_path, workspace, ApiResult, AppState};
use crate::http_team::{require, CurrentMember};
use crate::team::Permission;
use dazi_core::assign::{self, Assignment};
use dazi_core::comments::{self, Comment};
use dazi_core::events::{DaziEvent, EventSink};
use dazi_core::project;

/// Mentioned 事件里评论摘要的最大长度（字符）。
/// 通知只需让人判断要不要点进去，全文在详情页。
const MENTION_TEXT_MAX: usize = 120;

fn head_chars(s: &str, n: usize) -> String {
    if s.chars().count() <= n {
        return s.to_string();
    }
    let cut: String = s.chars().take(n).collect();
    format!("{cut}…")
}

/// 项目名，读不到 meta 时退回 slug——通知里宁可显示 slug 也不能是空。
fn name_of(path: &std::path::Path, slug: &str) -> String {
    project::read_meta(path)
        .map(|m| m.name)
        .unwrap_or_else(|_| slug.to_string())
}

#[derive(Serialize)]
pub struct AssignmentResp {
    /// None 表示未指派。
    pub assignment: Option<Assignment>,
}

pub async fn get_assignment(
    axum::Extension(cur): axum::Extension<CurrentMember>,
    Path(slug): Path<String>,
) -> ApiResult<AssignmentResp> {
    require(&cur, Permission::Read)?;
    let path = find_project_path(&slug)?;
    Ok(Json(AssignmentResp {
        assignment: assign::read_assignment(&path),
    }))
}

#[derive(Deserialize)]
pub struct AssignReq {
    /// 负责人 member_id；null 或缺省表示取消指派。
    #[serde(default)]
    pub assignee: Option<String>,
}

/// 指派任务。指派给人时校验对方在职——指派给已停用成员等于把活丢进黑洞
/// （与 handoff 同口径）。
pub async fn set_assignment(
    State(state): State<AppState>,
    axum::Extension(cur): axum::Extension<CurrentMember>,
    Path(slug): Path<String>,
    Json(req): Json<AssignReq>,
) -> ApiResult<AssignmentResp> {
    require(&cur, Permission::Write)?;
    if let Some(who) = &req.assignee {
        let ok = crate::team::load()
            .members
            .into_iter()
            .any(|m| &m.id == who && m.status == crate::team::MemberStatus::Active);
        if !ok {
            return Err(err(StatusCode::BAD_REQUEST, "负责人不存在或已停用"));
        }
    }
    let path = find_project_path(&slug)?;
    let assignment = assign::set_assignment(
        &path,
        req.assignee.as_deref(),
        &cur.member.id,
        chrono::Utc::now(),
    )
    .map_err(|e| err(StatusCode::INTERNAL_SERVER_ERROR, e))?;

    state.events.emit(DaziEvent::TaskAssigned {
        slug: slug.clone(),
        name: name_of(&path, &slug),
        assignee: req.assignee.clone(),
        by: cur.member.id.clone(),
    });
    Ok(Json(AssignmentResp { assignment }))
}

#[derive(Deserialize)]
pub struct CommentsQuery {
    pub limit: Option<usize>,
}

pub async fn list_comments(
    axum::Extension(cur): axum::Extension<CurrentMember>,
    Path(slug): Path<String>,
    Query(q): Query<CommentsQuery>,
) -> ApiResult<Vec<Comment>> {
    require(&cur, Permission::Read)?;
    let path = find_project_path(&slug)?;
    Ok(Json(comments::read_comments(&path, q.limit)))
}

#[derive(Deserialize)]
pub struct CommentReq {
    pub text: String,
}

/// 发评论。@提及在服务端解析——客户端各自实现一套匹配规则必然漂移，
/// 而漂移的后果是「我 @ 了他但他没收到通知」。
pub async fn add_comment(
    State(state): State<AppState>,
    axum::Extension(cur): axum::Extension<CurrentMember>,
    Path(slug): Path<String>,
    Json(req): Json<CommentReq>,
) -> ApiResult<Comment> {
    require(&cur, Permission::Read)?;
    let path = find_project_path(&slug)?;

    // 只有在职成员可被提及：提及一个停用成员没有通知对象，留在链上只是噪音。
    let candidates: Vec<(String, String)> = crate::team::load()
        .members
        .into_iter()
        .filter(|m| m.status == crate::team::MemberStatus::Active)
        .map(|m| (m.id, m.name))
        .collect();
    let mentions = comments::parse_mentions(&req.text, &candidates);

    let c = comments::append_comment(
        &path,
        &cur.member.id,
        &req.text,
        mentions.clone(),
        chrono::Utc::now(),
    )
    .map_err(|e| err(StatusCode::BAD_REQUEST, e))?;

    // 无提及不推事件：给全队弹一条「有人说话了」会让通知迅速变成噪音。
    if !mentions.is_empty() {
        state.events.emit(DaziEvent::Mentioned {
            slug: slug.clone(),
            name: name_of(&path, &slug),
            mentions,
            by: cur.member.id.clone(),
            text: head_chars(&c.text, MENTION_TEXT_MAX),
        });
    }
    Ok(Json(c))
}

#[derive(Serialize)]
pub struct AssignedItem {
    pub slug: String,
    pub name: String,
    pub assignment: Assignment,
}

/// 「指派给我的」。与 /inbox 的棒视图是两个问题：
/// inbox 答「现在轮到我动手吗」，本接口答「哪些活归我负责」——
/// 一个活可以归我但棒在别人手里（他在帮我推进），反之亦然。
/// 归档项目不计入。
pub async fn get_assigned_to_me(
    axum::Extension(cur): axum::Extension<CurrentMember>,
) -> ApiResult<Vec<AssignedItem>> {
    require(&cur, Permission::Read)?;
    let ws = workspace()?;
    let mut out = Vec::new();
    for p in project::list_projects(&ws).unwrap_or_default() {
        if let Some(a) = assign::read_assignment(&p.path) {
            if a.assignee == cur.member.id {
                out.push(AssignedItem {
                    slug: p.slug,
                    name: p.name,
                    assignment: a,
                });
            }
        }
    }
    Ok(Json(out))
}

#[cfg(test)]
mod tests {
    use super::*;

    /// 通知摘要必须按字符截断。中文按字节切会 panic，而这条路径
    /// 恰好总是中文（与 backend::head_chars 同一类问题）。
    #[test]
    fn mention_text_truncates_by_chars() {
        let long = "他".repeat(200);
        let head = head_chars(&long, MENTION_TEXT_MAX);
        assert_eq!(head.chars().count(), MENTION_TEXT_MAX + 1, "含省略号");
        assert!(head.ends_with('…'));
        assert_eq!(head_chars("短评论", MENTION_TEXT_MAX), "短评论");
    }
}
