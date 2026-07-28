//! dazi-core — Dazi 的纯逻辑核心，零 tauri 依赖。
//! 桌面 app（src-tauri）与未来的 dazi-daemon 都依赖本 crate 复用同一套逻辑。

pub mod autopilot;
pub mod backend;
pub mod config;
pub mod events;
pub mod memory;
pub mod model_test;
pub mod project;
pub mod prompt;
pub mod schedule;
