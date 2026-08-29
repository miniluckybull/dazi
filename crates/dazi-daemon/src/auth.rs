//! 配对鉴权：首启生成 6 位 PIN 并持久化到 ~/.dazi/pin.json，重启复用；
//! 手机用 PIN（owner 本人设备）或成员邀请码换长期 device_token。
//! token 以 sha256 哈希存 ~/.dazi/devices.json，可通过 DELETE /api/v1/devices/:id 吊销。
//!
//! 每台设备绑定一个 member_id，鉴权返回「是谁」而不只是「通不通过」——
//! 否则审批、运行等操作无法追溯到人。
use crate::team;
use rand::Rng;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::path::PathBuf;
use std::sync::Mutex;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Device {
    /// 稳定标识，吊销时用。旧数据缺失，启动迁移时补齐。
    #[serde(default)]
    pub id: String,
    pub name: String,
    /// device_token 的 sha256 十六进制摘要（不存明文）。
    pub token_hash: String,
    /// 归属成员。旧数据缺失，启动迁移时补绑到 owner。
    #[serde(default)]
    pub member_id: String,
    pub paired_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
struct DeviceStore {
    devices: Vec<Device>,
}

#[derive(Debug, Serialize, Deserialize)]
struct PinFile {
    pin: String,
}

fn dazi_dir() -> Result<PathBuf, String> {
    let home = std::env::var("HOME").map_err(|e| format!("无法读取 HOME: {e}"))?;
    let dir = PathBuf::from(home).join(".dazi");
    std::fs::create_dir_all(&dir).map_err(|e| format!("创建 ~/.dazi 失败: {e}"))?;
    Ok(dir)
}

fn devices_path() -> Result<PathBuf, String> {
    Ok(dazi_dir()?.join("devices.json"))
}

fn pin_path() -> Result<PathBuf, String> {
    Ok(dazi_dir()?.join("pin.json"))
}

/// 与 dazi-core 一致的敏感文件权限惯例：0600。
fn set_private_perms(path: &std::path::Path) {
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        let _ = std::fs::set_permissions(path, std::fs::Permissions::from_mode(0o600));
    }
}

fn load_store() -> DeviceStore {
    let Ok(path) = devices_path() else {
        return DeviceStore::default();
    };
    let Ok(raw) = std::fs::read_to_string(&path) else {
        return DeviceStore::default();
    };
    serde_json::from_str(&raw).unwrap_or_default()
}

/// 原子写 + 0600。devices.json 写坏等于全员失联，且 TS 侧也会读它。
fn save_store(store: &DeviceStore) -> Result<(), String> {
    let path = devices_path()?;
    let mut raw = serde_json::to_string_pretty(store).map_err(|e| e.to_string())?;
    raw.push('\n'); // 与 TS 侧 stringifyDevices 一致
    team::write_atomic(&path, &raw)
}

pub fn hash_token(token: &str) -> String {
    let mut h = Sha256::new();
    h.update(token.as_bytes());
    format!("{:x}", h.finalize())
}

/// 鉴权状态：内存里持有配对 PIN（持久化在 ~/.dazi/pin.json，重启不变）。
pub struct Auth {
    pin: String,
    store: Mutex<DeviceStore>,
}

/// 首次启动生成 6 位 PIN 并落盘；之后重启直接复用。
/// 文件损坏/内容非法时重新生成并覆盖。读写失败时退化为内存 PIN（不阻断启动）。
fn load_or_create_pin() -> String {
    fn is_valid(pin: &str) -> bool {
        pin.len() == 6 && pin.bytes().all(|b| b.is_ascii_digit())
    }
    let gen = || format!("{:06}", rand::thread_rng().gen_range(0..1_000_000));
    let Ok(path) = pin_path() else {
        return gen();
    };
    if let Ok(raw) = std::fs::read_to_string(&path) {
        if let Ok(pf) = serde_json::from_str::<PinFile>(&raw) {
            if is_valid(&pf.pin) {
                return pf.pin;
            }
        }
    }
    let pin = gen();
    match serde_json::to_string_pretty(&PinFile { pin: pin.clone() }) {
        Ok(raw) => match std::fs::write(&path, raw) {
            Ok(()) => set_private_perms(&path),
            Err(e) => tracing::warn!("写入 {} 失败（PIN 仅本次进程有效）: {e}", path.display()),
        },
        Err(e) => tracing::warn!("序列化 PIN 失败: {e}"),
    }
    pin
}

impl Auth {
    /// 启动时加载或生成 6 位 PIN（持久化，重启不变），用于 owner 本人设备配对。
    /// 同时把历史遗留设备补绑到 owner（见 migrate_legacy_devices）。
    pub fn new(owner_id: &str) -> Self {
        let mut store = load_store();
        if migrate_legacy_devices(&mut store, owner_id) > 0 {
            if let Err(e) = save_store(&store) {
                tracing::warn!("迁移旧设备记录失败（本次进程内已生效）: {e}");
            }
        }
        Auth {
            pin: load_or_create_pin(),
            store: Mutex::new(store),
        }
    }

    pub fn pin(&self) -> &str {
        &self.pin
    }

    /// PIN 配对：签发 device_token 并绑定到 owner。
    ///
    /// PIN 只打印在本机终端，能拿到它的人本就物理控制这台机器，因此判为 owner
    /// 是可辩护的归属。其他成员走邀请码（pair_with_invite）。
    pub fn pair(&self, pin: &str, device_name: &str, owner_id: &str) -> Result<String, String> {
        if pin != self.pin {
            return Err("PIN 不正确".to_string());
        }
        self.issue(device_name, owner_id)
    }

    /// 邀请码配对：核销邀请码并把设备绑定到该邀请对应的成员。
    ///
    /// 先核销再签发：两步之间若崩溃，宁可让码作废（重新要一个），
    /// 也不能留下可复用的码。
    pub fn pair_with_invite(&self, code: &str, device_name: &str) -> Result<(String, String), String> {
        let normalized = code.trim().to_uppercase();
        let mut t = team::load();
        let now = chrono::Utc::now();

        let invite = t
            .invites
            .iter_mut()
            .find(|i| i.code == normalized)
            .ok_or_else(|| "邀请码无效".to_string())?;
        if invite.used_at.is_some() {
            return Err("邀请码已被使用".to_string());
        }
        let expires = chrono::DateTime::parse_from_rfc3339(&invite.expires_at)
            .map_err(|_| "邀请码时间戳损坏".to_string())?;
        if expires <= now {
            return Err("邀请码已过期".to_string());
        }
        let member_id = invite.member_id.clone();
        invite.used_at = Some(team::now_iso());

        let member = t
            .members
            .iter()
            .find(|m| m.id == member_id)
            .ok_or_else(|| "邀请码对应的成员已不存在".to_string())?;
        if member.status != team::MemberStatus::Active {
            return Err("成员已停用".to_string());
        }
        team::save(&t)?;

        let token = self.issue(device_name, &member_id)?;
        Ok((token, member_id))
    }

    fn issue(&self, device_name: &str, member_id: &str) -> Result<String, String> {
        if device_name.trim().is_empty() {
            return Err("设备名不能为空".to_string());
        }
        let token = gen_token();
        let device = Device {
            id: team::gen_id('d'),
            name: device_name.trim().to_string(),
            token_hash: hash_token(&token),
            member_id: member_id.to_string(),
            paired_at: chrono::Utc::now(),
        };
        let mut store = self.store.lock().map_err(|_| "锁中毒".to_string())?;
        store.devices.push(device);
        save_store(&store)?;
        Ok(token)
    }

    /// 解析 Bearer token → 设备。返回 None 表示未配对或已吊销。
    /// 调用方再用 device.member_id 查成员拿角色（见 main.rs require_auth）。
    pub fn resolve(&self, token: &str) -> Option<Device> {
        if token.is_empty() {
            return None;
        }
        let hash = hash_token(token);
        let store = self.store.lock().ok()?;
        store.devices.iter().find(|d| d.token_hash == hash).cloned()
    }

    /// 吊销单台设备。此前整个产品缺失的路径：注释宣称"可在桌面端吊销"，
    /// 但代码里既无方法也无路由。返回 false 表示 id 不存在。
    pub fn revoke(&self, device_id: &str) -> Result<bool, String> {
        let mut store = self.store.lock().map_err(|_| "锁中毒".to_string())?;
        let before = store.devices.len();
        store.devices.retain(|d| d.id != device_id);
        if store.devices.len() == before {
            return Ok(false);
        }
        save_store(&store)?;
        Ok(true)
    }

    /// 吊销某成员的全部设备（停用成员时连带调用，否则停用只是摆设）。
    pub fn revoke_by_member(&self, member_id: &str) -> Result<usize, String> {
        let mut store = self.store.lock().map_err(|_| "锁中毒".to_string())?;
        let before = store.devices.len();
        store.devices.retain(|d| d.member_id != member_id);
        let removed = before - store.devices.len();
        if removed > 0 {
            save_store(&store)?;
        }
        Ok(removed)
    }

    pub fn list_devices(&self) -> Vec<Device> {
        self.store.lock().map(|s| s.devices.clone()).unwrap_or_default()
    }

    /// 已配对设备数（供受保护的 /health 详情展示）。
    pub fn device_count(&self) -> usize {
        self.store.lock().map(|s| s.devices.len()).unwrap_or(0)
    }
}

/// 给缺 id / member_id 的旧设备补齐字段，返回改动条数。
///
/// 把旧设备判为 owner 而不是一律失效：配对必须先拿到只打印在本机终端的 PIN，
/// 能配上的人本就物理控制这台机器。若改为失效，用户自己的手机会突然断连；
/// 若留作匿名，则永远无法追溯归属。token_hash 绝不改动。
fn migrate_legacy_devices(store: &mut DeviceStore, owner_id: &str) -> usize {
    let mut changed = 0;
    for d in &mut store.devices {
        if d.id.is_empty() {
            d.id = team::gen_id('d');
            changed += 1;
        }
        if d.member_id.is_empty() {
            d.member_id = owner_id.to_string();
            changed += 1;
        }
    }
    changed
}

fn gen_token() -> String {
    let bytes: [u8; 32] = rand::thread_rng().gen();
    bytes.iter().map(|b| format!("{b:02x}")).collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    fn legacy_device(name: &str) -> Device {
        Device {
            id: String::new(),
            name: name.to_string(),
            token_hash: hash_token("t"),
            member_id: String::new(),
            paired_at: chrono::Utc::now(),
        }
    }

    /// 旧设备补绑到 owner，且 token_hash 绝不能被改动（否则用户手机断连）。
    #[test]
    fn migrate_binds_legacy_devices_to_owner() {
        let mut store = DeviceStore {
            devices: vec![legacy_device("iPhone")],
        };
        let original_hash = store.devices[0].token_hash.clone();
        let changed = migrate_legacy_devices(&mut store, "m-owner");
        assert_eq!(changed, 2, "id 与 member_id 各算一次");
        assert_eq!(store.devices[0].member_id, "m-owner");
        assert!(store.devices[0].id.starts_with("d-"));
        assert_eq!(store.devices[0].token_hash, original_hash);
    }

    /// 已迁移过的记录不再改动（幂等）。
    #[test]
    fn migrate_is_idempotent() {
        let mut store = DeviceStore {
            devices: vec![legacy_device("iPhone")],
        };
        migrate_legacy_devices(&mut store, "m-owner");
        let id = store.devices[0].id.clone();
        assert_eq!(migrate_legacy_devices(&mut store, "m-other"), 0);
        assert_eq!(store.devices[0].id, id);
        assert_eq!(store.devices[0].member_id, "m-owner", "不能被改绑");
    }

    /// 能反序列化升级前的 devices.json（无 id / member_id 字段）。
    #[test]
    fn deserializes_pre_upgrade_json() {
        let raw = r#"{"devices":[{"name":"iPhone","token_hash":"abc","paired_at":"2026-01-01T00:00:00Z"}]}"#;
        let store: DeviceStore = serde_json::from_str(raw).unwrap();
        assert_eq!(store.devices.len(), 1);
        assert!(store.devices[0].id.is_empty());
        assert!(store.devices[0].member_id.is_empty());
    }

    /// 空 token 不得通过（防 header 缺失时误判）。
    #[test]
    fn empty_token_never_resolves() {
        let auth = Auth {
            pin: "000000".into(),
            store: Mutex::new(DeviceStore::default()),
        };
        assert!(auth.resolve("").is_none());
        assert!(auth.resolve("nonexistent").is_none());
    }
}
