# Dazi daemon 部署到 Linux 服务器（Ubuntu + systemd 用户服务）

让 dazi-daemon 在 Linux 服务器（如本地 4090 Ubuntu 机）上**后台常驻、开机自启、崩溃重拉**，
团队成员通过 Tailscale 内网用手机远程协作。配套 macOS 的 LaunchAgent 方案见 `README.md`。

> 这是**用户级** systemd 服务（`systemctl --user`），随用户会话启动，**不需 root、不改系统全局**。
> 数据全部落在这台服务器的 `~/.dazi` 与你设置的 workspace 目录，不出内网。

## 前置依赖（务必先装好）

1. **Rust 工具链**（编译 daemon）：`curl https://sh.rustup.rs -sSf | sh`
2. **claude CLI 并完成认证**。autopilot 全靠它，且走 Anthropic 云端 API：
   ```
   # 安装 claude CLI（区域受限导致官方脚本/npm 失败时，可用 corepack 绕开损坏的系统 npm）：
   npm install -g @anthropic-ai/claude-code     # 或 corepack npm@10.8.2 install -g ...
   claude --version                              # 确认可执行
   ```
   认证两种方式任选：
   - **订阅登录**：普通终端 `claude` 跟随提示登录，凭证存 `~/.claude`。
   - **API key / 中转端点**（区域受限时常用）：在 `~/.bashrc` 设环境变量，例如
     `export ANTHROPIC_BASE_URL="https://中转地址"` 与 `export ANTHROPIC_AUTH_TOKEN="..."`
     （直连官方则用 `export ANTHROPIC_API_KEY="sk-ant-..."`）。
   - **务必验证真实调用**（不是只看 --version）：
     `claude -p "hi" --output-format json`，输出含 `"is_error":false` 才算通。

   > **关键坑（Ubuntu 必看）**：daemon 调 claude 用 `bash -lc`（登录 shell），而登录 shell
   > 读的是 `~/.bash_profile`/`~/.profile`，**默认不读 `~/.bashrc`**。若你的 key 写在
   > `~/.bashrc` 且没有 `~/.bash_profile`，daemon 会报 `Not logged in · Please run /login`。
   > 修复：创建 `~/.bash_profile` 让它加载 .bashrc：
   > ```
   > printf '%s\n' '[ -f ~/.bashrc ] && . ~/.bashrc' > ~/.bash_profile
   > # 验证干净登录 shell 能读到 key：
   > env -i /bin/bash -lc 'echo ${#ANTHROPIC_AUTH_TOKEN}'   # 应非 0
   > ```
3. **bash**（Ubuntu 自带）。daemon 运行时探测 `/bin/bash`，无需额外配置。
4. **Tailscale**（团队远程访问，见末节）。

## 设置 workspace

daemon 从 `~/.dazi/config.json` 读 workspace 路径（与桌面端共用同一配置格式）。
首次部署需手动指定项目数据存放目录：

```
mkdir -p ~/dazi-workspace
printf '{"workspace":"%s"}' "$HOME/dazi-workspace" > ~/.dazi/config.json
```

> workspace 下会自动建 `projects/`、`archive/` 等子目录。这台服务器是**唯一执行点**，
> 所有项目数据都在这里，团队成员只是远程读写，不在各自手机/电脑上存。

## 安装

```
crates/dazi-daemon/deploy/install-daemon-linux.sh
```

脚本做四件事：① `cargo build --release`；② 渲染 systemd unit 到
`~/.config/systemd/user/dazi-daemon.service`；③ `enable + restart` 启动服务；
④ 尝试 `enable-linger`（让服务在你未登录时也随开机运行）。幂等，可重复跑。

### 看配对 PIN

systemd 服务无终端，PIN 进 journald 日志：
```
journalctl --user -u dazi-daemon -n 50 | grep '配对 PIN' | tail -1
```
PIN 每次 daemon 启动都会变。手机首次配对后 token 存本地，之后刷新无需再输。

## 验证

```
curl -s http://127.0.0.1:7878/health
```
重点看 `claude` 字段是否 `"ok": true`——验证 systemd 环境下能正常调用 claude。
- `"ok": true` → 调度 / 自动执行 / 审批可正常工作；
- `"ok": false` → 只读功能仍可用，但到点产计划 / 审批执行会失败。多半是 claude 未登录
  或凭证不可达——在普通终端 `claude` 登录一次，再 `systemctl --user restart dazi-daemon`。

## 常用运维

```
systemctl --user status dazi-daemon      # 看运行状态
systemctl --user restart dazi-daemon     # 重启（改了配置/更新二进制后）
journalctl --user -u dazi-daemon -f      # 实时跟日志
```

## 卸载

```
crates/dazi-daemon/deploy/uninstall-daemon-linux.sh
```
停止自启并删 unit。配对记录（`~/.dazi/devices.json`）与 workspace 数据保留。

## 团队远程访问（Tailscale，关键）

1. 服务器装 Tailscale 并加入你们的 tailnet：`curl -fsSL https://tailscale.com/install.sh | sh && sudo tailscale up`
2. 记下服务器的 Tailscale IP：`tailscale ip -4`
3. 团队成员手机装 Tailscale 登录同一 tailnet，浏览器开
   `http://<服务器Tailscale-IP>:7878`，输 PIN 配对即可。

## 安全注意（团队共用，务必看）

- daemon 监听 `0.0.0.0:7878` 且能（经审批）在服务器上 `bypassPermissions` 执行任务。
- **只通过 Tailscale 等私有网络访问，绝不做公网端口转发。**
- 服务器端定时任务**强制走审批流**：到点先产计划推手机，团队成员批准后才真执行。
  这是多人共用时防误改的关键闸——不要绕过。
- 鉴权靠配对 token，删 `~/.dazi/devices.json` 可一键吊销全部设备。
- 数据在本地服务器，但注意 claude 调用本身会把项目上下文发给 Anthropic 云端 API。
