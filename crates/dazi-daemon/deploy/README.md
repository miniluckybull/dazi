# Dazi daemon 开机自启（macOS LaunchAgent）

让 dazi-daemon 在你登录 Mac 后**自动后台启动并常驻**（崩溃自动重拉），免去每次手动 `cargo run`。配合 Tailscale 即可随时手机远程，不用碰电脑。

> 这是**用户级** LaunchAgent（`~/Library/LaunchAgents`），随你登录启动，**不需 sudo、不改系统全局**。
> 安装与否由你决定——脚本不会被自动执行。

## 它是什么、不是什么

- **是**：让后台服务 `dazi-daemon`（监听 7878，手机连的就是它）在 macOS 登录时自动起来。
- **不是**：Dazi 桌面 app 的开机自启。两者完全独立——app 是 GUI，不该自启；daemon 是后台服务，远程时才需要自启。

## 安装

```
/Users/wxw/wxw_workspace/dazi/crates/dazi-daemon/deploy/install-daemon.sh
```

脚本做四件事：① `cargo build --release`；② 渲染 plist 到 `~/Library/LaunchAgents/com.wxw.dazi-daemon.plist`；③ `launchctl load`；④ 提示如何看 PIN。幂等，可重复跑（会先卸载旧的）。

### 看配对 PIN

LaunchAgent 没有终端，PIN 写进日志：
```
grep '配对 PIN' ~/.dazi/daemon.log | tail -1
```
PIN 每次 daemon 启动都会变。手机首次配对后 token 存本地，之后刷新无需再输。

## 验证

```
curl -s http://127.0.0.1:7878/health
```
应返回 JSON，重点看 `claude` 字段是否 `"ok": true`——这验证 LaunchAgent 环境下能正常调用 claude（见下「登录态」）。

手机端（已装 Tailscale 时）：开 `http://<Mac的Tailscale-IP>:7878`，输 PIN 配对。

## 卸载

```
/Users/wxw/wxw_workspace/dazi/crates/dazi-daemon/deploy/uninstall-daemon.sh
```
停止自启并删 plist。日志与配对记录保留（如需清理手动删 `~/.dazi/daemon.log`、`~/.dazi/devices.json`）。

## 日志

- 标准输出：`~/.dazi/daemon.log`（启动横幅、PIN、claude 探活结果）
- 错误输出：`~/.dazi/daemon.err.log`
- 实时跟踪：`tail -f ~/.dazi/daemon.log`

## claude 登录态（关键，务必验证）

LaunchAgent 启动的进程 PATH 极简，且不一定继承你交互式登录的 claude 凭证。本方案两层保障：
1. daemon 内部跑 claude 时用 `zsh -lc` 包裹（走登录 shell，能拿回 PATH 与 `~/.claude` 凭证）；
2. plist 里显式设 `PATH` 含 `/opt/homebrew/bin` 兜底。

**安装后务必看一次 `/health` 的 `claude` 字段**：
- `"ok": true` → 自动执行/审批可正常工作；
- `"ok": false` → 只读功能仍可用，但自动执行/审批会失败。多半是 claude 未登录或凭证不可达——在普通终端 `claude` 登录一次，再 `launchctl unload/load` 重启 daemon。

## 安全注意

- daemon 开机常驻 + 监听 `0.0.0.0:7878`，意味着开机后一直有个能（经审批）执行任务的服务在听网络。
- 务必只通过 Tailscale 等私有网络访问（不要做公网端口转发）。
- 鉴权靠配对 token，可删 `~/.dazi/devices.json` 吊销全部设备。
- 远程触发建议始终走**审批流**（先看计划再批准），别开「免审批直跑」。
