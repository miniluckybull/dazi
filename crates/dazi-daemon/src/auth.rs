//! 配对鉴权：首启生成 6 位 PIN 并持久化到 ~/.dazi/pin.json，重启复用；
//! 手机用 PIN 换长期 device_token。
//! token 以 sha256 哈希存 ~/.dazi/devices.json，可在桌面端吊销。
use rand::Rng;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::path::PathBuf;
use std::sync::Mutex;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Device {
    pub name: String,
    /// device_token 的 sha256 十六进制摘要（不存明文）。
    pub token_hash: String,
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

fn save_store(store: &DeviceStore) -> Result<(), String> {
    let path = devices_path()?;
    let raw = serde_json::to_string_pretty(store).map_err(|e| e.to_string())?;
    std::fs::write(&path, raw).map_err(|e| e.to_string())
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
    /// 启动时加载或生成 6 位 PIN（持久化，重启不变），用于新设备配对。
    pub fn new() -> Self {
        Auth {
            pin: load_or_create_pin(),
            store: Mutex::new(load_store()),
        }
    }

    pub fn pin(&self) -> &str {
        &self.pin
    }

    /// 校验 PIN，成功则签发新 device_token 并持久化设备记录。
    pub fn pair(&self, pin: &str, device_name: &str) -> Result<String, String> {
        if pin != self.pin {
            return Err("PIN 不正确".to_string());
        }
        let token = gen_token();
        let device = Device {
            name: device_name.to_string(),
            token_hash: hash_token(&token),
            paired_at: chrono::Utc::now(),
        };
        let mut store = self.store.lock().map_err(|_| "锁中毒".to_string())?;
        store.devices.push(device);
        save_store(&store)?;
        Ok(token)
    }

    /// 校验 Bearer token 是否属于已配对设备。
    pub fn verify(&self, token: &str) -> bool {
        let hash = hash_token(token);
        let Ok(store) = self.store.lock() else {
            return false;
        };
        store.devices.iter().any(|d| d.token_hash == hash)
    }

    /// 已配对设备数（供 /health 展示）。
    pub fn device_count(&self) -> usize {
        self.store.lock().map(|s| s.devices.len()).unwrap_or(0)
    }
}

fn gen_token() -> String {
    let bytes: [u8; 32] = rand::thread_rng().gen();
    bytes.iter().map(|b| format!("{b:02x}")).collect()
}
