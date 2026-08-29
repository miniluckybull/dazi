//! team — 成员、角色与权限矩阵，读写 ~/.dazi/team.json。
//!
//! 磁盘格式与 TS 侧 `ts/packages/team/src/store.ts` 必须一致（两边各有对齐测试）。
//! 迁移期两个运行时都会读这个文件，字段名一律 snake_case。
//!
//! 写入用临时文件 + rename：team.json 是安全关键文件，写坏一次就是全员失联，
//! 原子写的代价可以忽略。
use rand::Rng;
use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};

/// 角色由弱到强。判权靠 rank() 比较，不要直接匹配字符串。
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Role {
    Viewer,
    Member,
    Admin,
    Owner,
}

impl Role {
    pub fn rank(self) -> u8 {
        match self {
            Role::Viewer => 0,
            Role::Member => 1,
            Role::Admin => 2,
            Role::Owner => 3,
        }
    }
}

/// 权限点。与 TS 侧 PERMISSIONS 一一对应。
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Permission {
    Read,
    Write,
    Run,
    Approve,
    ManageMembers,
    ManageDevices,
    TransferOwnership,
}

impl Permission {
    /// 所需最低角色。这张表是安全边界，改动必须同步 TS 侧 MIN_ROLE。
    fn min_role(self) -> Role {
        match self {
            Permission::Read => Role::Viewer,
            Permission::Write | Permission::Run | Permission::Approve => Role::Member,
            Permission::ManageMembers | Permission::ManageDevices => Role::Admin,
            Permission::TransferOwnership => Role::Owner,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum MemberStatus {
    Active,
    Suspended,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Member {
    pub id: String,
    pub name: String,
    pub role: Role,
    pub status: MemberStatus,
    pub created_at: String,
}

impl Member {
    /// 判权唯一入口。停用成员无论角色一律拒绝。
    pub fn can(&self, perm: Permission) -> bool {
        self.status == MemberStatus::Active && self.role.rank() >= perm.min_role().rank()
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Invite {
    pub code: String,
    pub member_id: String,
    pub created_at: String,
    pub expires_at: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub used_at: Option<String>,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct Team {
    #[serde(default)]
    pub members: Vec<Member>,
    #[serde(default)]
    pub invites: Vec<Invite>,
}

/// 邀请码有效期 24 小时，与 TS 侧 INVITE_TTL_MS 一致。
pub const INVITE_TTL_SECS: i64 = 24 * 60 * 60;

/// 去掉 0/O/1/I/L，避免口头或截图传递时认错。与 TS 侧 CODE_ALPHABET 一致。
const CODE_ALPHABET: &[u8] = b"ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const CODE_LEN: usize = 8;

pub fn dazi_dir() -> Result<PathBuf, String> {
    let home = std::env::var("HOME").map_err(|e| format!("无法读取 HOME: {e}"))?;
    let dir = PathBuf::from(home).join(".dazi");
    std::fs::create_dir_all(&dir).map_err(|e| format!("创建 ~/.dazi 失败: {e}"))?;
    Ok(dir)
}

pub fn team_path() -> Result<PathBuf, String> {
    Ok(dazi_dir()?.join("team.json"))
}

/// 敏感文件权限 0600，与 auth.rs 惯例一致。
pub fn set_private_perms(path: &Path) {
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        let _ = std::fs::set_permissions(path, std::fs::Permissions::from_mode(0o600));
    }
}

/// 原子写：同目录临时文件 + rename。失败时清理临时文件。
pub fn write_atomic(path: &Path, contents: &str) -> Result<(), String> {
    let tmp = path.with_extension(format!("tmp.{}", std::process::id()));
    std::fs::write(&tmp, contents).map_err(|e| format!("写入 {} 失败: {e}", tmp.display()))?;
    set_private_perms(&tmp);
    if let Err(e) = std::fs::rename(&tmp, path) {
        let _ = std::fs::remove_file(&tmp);
        return Err(format!("替换 {} 失败: {e}", path.display()));
    }
    Ok(())
}

/// JSON 与 TS 侧一致：2 空格缩进 + 尾换行，便于两边往返比对与 git diff。
fn to_json(team: &Team) -> Result<String, String> {
    let mut s = serde_json::to_string_pretty(team).map_err(|e| e.to_string())?;
    s.push('\n');
    Ok(s)
}

pub fn gen_id(prefix: char) -> String {
    let bytes: [u8; 6] = rand::thread_rng().gen();
    let hex: String = bytes.iter().map(|b| format!("{b:02x}")).collect();
    format!("{prefix}-{hex}")
}

pub fn gen_invite_code() -> String {
    let mut rng = rand::thread_rng();
    (0..CODE_LEN)
        .map(|_| CODE_ALPHABET[rng.gen_range(0..CODE_ALPHABET.len())] as char)
        .collect()
}

/// 时间戳格式与 chrono AutoSi 一致（0ms 时省略小数部分），TS 侧同样处理。
pub fn now_iso() -> String {
    chrono::Utc::now().to_rfc3339_opts(chrono::SecondsFormat::AutoSi, true)
}

/// 成员表。损坏文件退化为空表而不是 panic——但空表意味着无人可鉴权，
/// 调用方（bootstrap）负责重建 owner。
pub fn load() -> Team {
    let Ok(path) = team_path() else {
        return Team::default();
    };
    let Ok(raw) = std::fs::read_to_string(&path) else {
        return Team::default();
    };
    serde_json::from_str(&raw).unwrap_or_default()
}

pub fn save(team: &Team) -> Result<(), String> {
    write_atomic(&team_path()?, &to_json(team)?)
}

/// 首次启动引导：无任何成员时创建唯一 owner。返回 owner。
/// 已存在则原样返回，幂等。
pub fn bootstrap_owner(owner_name: &str) -> Result<Member, String> {
    let mut team = load();
    if let Some(existing) = team.members.iter().find(|m| m.role == Role::Owner) {
        return Ok(existing.clone());
    }
    let owner = Member {
        id: gen_id('m'),
        name: owner_name.to_string(),
        role: Role::Owner,
        status: MemberStatus::Active,
        created_at: now_iso(),
    };
    team.members.push(owner.clone());
    save(&team)?;
    Ok(owner)
}

#[cfg(test)]
mod tests {
    use super::*;

    /// 权限矩阵必须与 TS 侧 ts/packages/team/test/roles.test.ts 的 ALLOWED 表一致。
    #[test]
    fn permission_matrix_matches_ts() {
        let roles = [Role::Viewer, Role::Member, Role::Admin, Role::Owner];
        let cases: &[(Permission, &[Role])] = &[
            (
                Permission::Read,
                &[Role::Viewer, Role::Member, Role::Admin, Role::Owner],
            ),
            (Permission::Write, &[Role::Member, Role::Admin, Role::Owner]),
            (Permission::Run, &[Role::Member, Role::Admin, Role::Owner]),
            (
                Permission::Approve,
                &[Role::Member, Role::Admin, Role::Owner],
            ),
            (Permission::ManageMembers, &[Role::Admin, Role::Owner]),
            (Permission::ManageDevices, &[Role::Admin, Role::Owner]),
            (Permission::TransferOwnership, &[Role::Owner]),
        ];
        for (perm, allowed) in cases {
            for role in roles {
                let m = Member {
                    id: "m-1".into(),
                    name: "t".into(),
                    role,
                    status: MemberStatus::Active,
                    created_at: now_iso(),
                };
                assert_eq!(
                    m.can(*perm),
                    allowed.contains(&role),
                    "{role:?} × {perm:?}"
                );
            }
        }
    }

    /// 停用成员一切权限归零，包括 owner。
    #[test]
    fn suspended_member_has_no_permission() {
        for role in [Role::Viewer, Role::Member, Role::Admin, Role::Owner] {
            let m = Member {
                id: "m-1".into(),
                name: "t".into(),
                role,
                status: MemberStatus::Suspended,
                created_at: now_iso(),
            };
            for perm in [
                Permission::Read,
                Permission::Write,
                Permission::Run,
                Permission::Approve,
                Permission::ManageMembers,
                Permission::ManageDevices,
                Permission::TransferOwnership,
            ] {
                assert!(!m.can(perm), "{role:?} × {perm:?} 应被拒");
            }
        }
    }

    /// 角色与状态序列化成小写字符串，与 TS 侧字面量一致。
    #[test]
    fn role_serializes_lowercase() {
        assert_eq!(serde_json::to_string(&Role::Owner).unwrap(), "\"owner\"");
        assert_eq!(serde_json::to_string(&Role::Viewer).unwrap(), "\"viewer\"");
        assert_eq!(
            serde_json::to_string(&MemberStatus::Suspended).unwrap(),
            "\"suspended\""
        );
    }

    /// 非法角色必须解析失败（丢弃而不是降级放行），与 TS 侧 parseMember 语义一致。
    #[test]
    fn unknown_role_is_rejected() {
        let raw = r#"{"id":"m-1","name":"x","role":"root","status":"active","created_at":"t"}"#;
        assert!(serde_json::from_str::<Member>(raw).is_err());
    }

    /// 邀请码字母表不含易混字符。
    #[test]
    fn invite_code_avoids_ambiguous_chars() {
        for _ in 0..200 {
            let code = gen_invite_code();
            assert_eq!(code.len(), CODE_LEN);
            assert!(
                !code.contains(['0', 'O', '1', 'I', 'L']),
                "易混字符: {code}"
            );
        }
    }

    /// 能读 TS 侧写出的 team.json（含未知字段与可选 used_at）。
    #[test]
    fn parses_ts_written_json() {
        let raw = r#"{
  "members": [
    { "id": "m-abc", "name": "Kevin", "role": "owner", "status": "active", "created_at": "2026-01-01T00:00:00Z" }
  ],
  "invites": [
    { "code": "ABCD2345", "member_id": "m-abc", "created_at": "2026-01-01T00:00:00Z", "expires_at": "2026-01-02T00:00:00Z", "used_at": "2026-01-01T01:00:00Z" }
  ],
  "unknown_future_field": 1
}"#;
        let team: Team = serde_json::from_str(raw).unwrap();
        assert_eq!(team.members.len(), 1);
        assert_eq!(team.members[0].role, Role::Owner);
        assert!(team.members[0].can(Permission::TransferOwnership));
        assert_eq!(team.invites[0].used_at.as_deref(), Some("2026-01-01T01:00:00Z"));
    }

    /// 未使用的邀请不写出 used_at 字段（与 TS 侧 stringifyTeam 一致）。
    #[test]
    fn unused_invite_omits_used_at() {
        let team = Team {
            members: vec![],
            invites: vec![Invite {
                code: "ABCD2345".into(),
                member_id: "m-1".into(),
                created_at: "t".into(),
                expires_at: "t2".into(),
                used_at: None,
            }],
        };
        let json = to_json(&team).unwrap();
        assert!(!json.contains("used_at"));
        assert!(json.ends_with("}\n"), "必须以换行结尾");
    }
}
