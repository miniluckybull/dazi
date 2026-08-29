//! 团队管理 HTTP handlers：成员、邀请码、设备吊销。
//!
//! 所有写操作都要求调用者具备相应权限（manage_members / manage_devices），
//! 权限从请求扩展里的 CurrentMember 取——由 main.rs 的 require_auth 注入。
use axum::{
    extract::{Path, State},
    http::StatusCode,
    Json,
};
use serde::{Deserialize, Serialize};

use crate::http::{err, AppState, ApiResult, ErrBody};
use crate::team::{self, Member, Permission, Role};

/// 鉴权后注入请求扩展的当前调用者。handler 用 Extension 取。
#[derive(Clone)]
pub struct CurrentMember {
    pub member: Member,
    pub device_id: String,
}

/// token → 调用者身份。设备已吊销、成员不存在或已停用一律返回 None。
///
/// HTTP 走 require_auth 中间件，WebSocket 走查询参数（浏览器无法设 header），
/// 两条路径必须落到同一份判定逻辑上，否则停用成员仍能开 WS。
pub fn resolve_caller(state: &AppState, token: &str) -> Option<CurrentMember> {
    let device = state.auth.resolve(token)?;
    let member = team::load()
        .members
        .into_iter()
        .find(|m| m.id == device.member_id)
        .filter(|m| m.status == team::MemberStatus::Active)?;
    Some(CurrentMember {
        member,
        device_id: device.id,
    })
}

/// 权限门。缺权限返回 403（而不是 401——身份是有效的，只是不够）。
pub(crate) fn require(
    cur: &CurrentMember,
    perm: Permission,
) -> Result<(), (StatusCode, Json<ErrBody>)> {
    if cur.member.can(perm) {
        Ok(())
    } else {
        Err(err(
            StatusCode::FORBIDDEN,
            format!("当前角色（{:?}）无此操作权限", cur.member.role),
        ))
    }
}

#[derive(Serialize)]
pub struct MeResp {
    pub member: Member,
    pub device_id: String,
}

/// 当前身份自查。任何有效 token 都能调，用于客户端判断该显示哪些操作。
pub async fn me(
    axum::Extension(cur): axum::Extension<CurrentMember>,
) -> ApiResult<MeResp> {
    Ok(Json(MeResp {
        member: cur.member,
        device_id: cur.device_id,
    }))
}

#[derive(Serialize)]
pub struct MembersResp {
    pub members: Vec<Member>,
}

pub async fn list_members(
    axum::Extension(cur): axum::Extension<CurrentMember>,
) -> ApiResult<MembersResp> {
    require(&cur, Permission::Read)?;
    Ok(Json(MembersResp {
        members: team::load().members,
    }))
}

#[derive(Deserialize)]
pub struct AddMemberReq {
    pub name: String,
    pub role: Role,
}

pub async fn add_member(
    axum::Extension(cur): axum::Extension<CurrentMember>,
    Json(req): Json<AddMemberReq>,
) -> ApiResult<Member> {
    require(&cur, Permission::ManageMembers)?;
    if req.name.trim().is_empty() {
        return Err(err(StatusCode::BAD_REQUEST, "成员名不能为空"));
    }
    // owner 唯一：不能通过新增制造第二个 owner。
    if req.role == Role::Owner {
        return Err(err(StatusCode::BAD_REQUEST, "owner 唯一，不能新增"));
    }
    // 不能授出高于自己的角色（admin 不能造 admin 之上的角色）。
    if req.role.rank() > cur.member.role.rank() {
        return Err(err(StatusCode::FORBIDDEN, "不能授出高于自己的角色"));
    }
    let mut t = team::load();
    let member = Member {
        id: team::gen_id('m'),
        name: req.name.trim().to_string(),
        role: req.role,
        status: team::MemberStatus::Active,
        created_at: team::now_iso(),
    };
    t.members.push(member.clone());
    team::save(&t).map_err(|e| err(StatusCode::INTERNAL_SERVER_ERROR, e))?;
    Ok(Json(member))
}

#[derive(Serialize)]
pub struct InviteResp {
    pub code: String,
    pub member_id: String,
    pub expires_at: String,
}

/// 签发单次邀请码。同一成员的旧未用码作废，避免多码并存。
pub async fn create_invite(
    axum::Extension(cur): axum::Extension<CurrentMember>,
    Path(member_id): Path<String>,
) -> ApiResult<InviteResp> {
    require(&cur, Permission::ManageMembers)?;
    let mut t = team::load();
    let target = t
        .members
        .iter()
        .find(|m| m.id == member_id)
        .ok_or_else(|| err(StatusCode::NOT_FOUND, "成员不存在"))?;
    if target.status != team::MemberStatus::Active {
        return Err(err(StatusCode::CONFLICT, "成员已停用，不能签发邀请码"));
    }
    let now = chrono::Utc::now();
    let invite = team::Invite {
        code: team::gen_invite_code(),
        member_id: member_id.clone(),
        created_at: now.to_rfc3339_opts(chrono::SecondsFormat::AutoSi, true),
        expires_at: (now + chrono::Duration::seconds(team::INVITE_TTL_SECS))
            .to_rfc3339_opts(chrono::SecondsFormat::AutoSi, true),
        used_at: None,
    };
    t.invites
        .retain(|i| i.member_id != member_id || i.used_at.is_some());
    t.invites.push(invite.clone());
    team::save(&t).map_err(|e| err(StatusCode::INTERNAL_SERVER_ERROR, e))?;
    Ok(Json(InviteResp {
        code: invite.code,
        member_id: invite.member_id,
        expires_at: invite.expires_at,
    }))
}

#[derive(Serialize)]
pub struct SuspendResp {
    pub member_id: String,
    /// 连带吊销的设备数。
    pub revoked_devices: usize,
}

/// 停用成员，并连带吊销其全部设备——否则停用只是摆设。
pub async fn suspend_member(
    State(state): State<AppState>,
    axum::Extension(cur): axum::Extension<CurrentMember>,
    Path(member_id): Path<String>,
) -> ApiResult<SuspendResp> {
    require(&cur, Permission::ManageMembers)?;
    if member_id == cur.member.id {
        return Err(err(StatusCode::BAD_REQUEST, "不能停用自己"));
    }
    let mut t = team::load();
    let target = t
        .members
        .iter_mut()
        .find(|m| m.id == member_id)
        .ok_or_else(|| err(StatusCode::NOT_FOUND, "成员不存在"))?;
    if target.role == Role::Owner {
        return Err(err(StatusCode::FORBIDDEN, "不能停用 owner"));
    }
    // 不能停用权力 >= 自己的人（admin 不能停用另一个 admin）。
    if target.role.rank() >= cur.member.role.rank() {
        return Err(err(StatusCode::FORBIDDEN, "不能停用同级或更高角色"));
    }
    target.status = team::MemberStatus::Suspended;
    team::save(&t).map_err(|e| err(StatusCode::INTERNAL_SERVER_ERROR, e))?;

    let revoked = state
        .auth
        .revoke_by_member(&member_id)
        .map_err(|e| err(StatusCode::INTERNAL_SERVER_ERROR, e))?;
    Ok(Json(SuspendResp {
        member_id,
        revoked_devices: revoked,
    }))
}

#[derive(Serialize)]
pub struct DeviceInfo {
    pub id: String,
    pub name: String,
    pub member_id: String,
    pub paired_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Serialize)]
pub struct DevicesResp {
    pub devices: Vec<DeviceInfo>,
}

/// 列设备。故意不返回 token_hash——它虽是摘要，但没有任何客户端需要它。
pub async fn list_devices(
    State(state): State<AppState>,
    axum::Extension(cur): axum::Extension<CurrentMember>,
) -> ApiResult<DevicesResp> {
    require(&cur, Permission::ManageDevices)?;
    Ok(Json(DevicesResp {
        devices: state
            .auth
            .list_devices()
            .into_iter()
            .map(|d| DeviceInfo {
                id: d.id,
                name: d.name,
                member_id: d.member_id,
                paired_at: d.paired_at,
            })
            .collect(),
    }))
}

#[derive(Serialize)]
pub struct RevokeResp {
    pub revoked: bool,
}

/// 吊销设备。此前只有注释宣称可吊销，既无方法也无路由。
///
/// 允许两种调用者：有 manage_devices 权限的管理者，或设备归属人本人
/// （自己的手机丢了，不该等管理员）。
pub async fn revoke_device(
    State(state): State<AppState>,
    axum::Extension(cur): axum::Extension<CurrentMember>,
    Path(device_id): Path<String>,
) -> ApiResult<RevokeResp> {
    let owns = state
        .auth
        .list_devices()
        .into_iter()
        .any(|d| d.id == device_id && d.member_id == cur.member.id);
    if !owns {
        require(&cur, Permission::ManageDevices)?;
    }
    let revoked = state
        .auth
        .revoke(&device_id)
        .map_err(|e| err(StatusCode::INTERNAL_SERVER_ERROR, e))?;
    if !revoked {
        return Err(err(StatusCode::NOT_FOUND, "设备不存在"));
    }
    Ok(Json(RevokeResp { revoked }))
}

#[derive(Deserialize)]
pub struct PairInviteReq {
    pub code: String,
    pub device_name: String,
}

#[derive(Serialize)]
pub struct PairInviteResp {
    pub device_token: String,
    pub member_id: String,
}

/// 用邀请码配对（公开端点，凭码即身份）。
pub async fn pair_with_invite(
    State(state): State<AppState>,
    Json(req): Json<PairInviteReq>,
) -> ApiResult<PairInviteResp> {
    let (token, member_id) = state
        .auth
        .pair_with_invite(&req.code, &req.device_name)
        .map_err(|e| err(StatusCode::UNAUTHORIZED, e))?;
    Ok(Json(PairInviteResp {
        device_token: token,
        member_id,
    }))
}
