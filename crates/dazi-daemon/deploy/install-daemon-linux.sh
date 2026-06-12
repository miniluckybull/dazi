#!/usr/bin/env bash
# 安装 dazi-daemon 为 systemd 用户服务（Linux，开机/登录自启 + 崩溃重拉）。
# 用户级（systemctl --user），不需 sudo。装完 daemon 在后台常驻，
# 配合 Tailscale 即可团队成员手机远程。
set -euo pipefail

# REPO 由脚本自身位置推导（deploy/ 的上三级即仓库根），不写死路径，便于在任意机器部署。
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO="$(cd "$SCRIPT_DIR/../../.." && pwd)"
UNIT="dazi-daemon"
UNIT_DIR="$HOME/.config/systemd/user"
UNIT_FILE="$UNIT_DIR/$UNIT.service"
TEMPLATE="$SCRIPT_DIR/$UNIT.service.template"
BIN="$REPO/target/release/dazi-daemon"

echo "==> 仓库根: $REPO"

echo "==> 1/4 编译 release 二进制"
cd "$REPO"
cargo build --release -p dazi-daemon

if [ ! -x "$BIN" ]; then
  echo "错误：未找到二进制 $BIN" >&2
  exit 1
fi

echo "==> 2/4 渲染 unit 到 $UNIT_FILE"
mkdir -p "$UNIT_DIR" "$HOME/.dazi"
# PATH 兜底：含用户级与系统常见目录（claude 可能装在 ~/.local/bin 或 /usr/bin）。
DAEMON_PATH="$HOME/.local/bin:$HOME/.claude/local:/usr/local/bin:/usr/bin:/bin"
sed -e "s#__DAEMON_BIN__#$BIN#g" \
    -e "s#__WORKDIR__#$REPO#g" \
    -e "s#__PATH__#$DAEMON_PATH#g" \
    "$TEMPLATE" > "$UNIT_FILE"

echo "==> 3/4 启用并启动服务"
systemctl --user daemon-reload
systemctl --user enable "$UNIT.service"
systemctl --user restart "$UNIT.service"

# 让用户服务在未登录时也能随开机运行（需一次性开启 linger）。
if command -v loginctl >/dev/null 2>&1; then
  loginctl enable-linger "$USER" 2>/dev/null \
    && echo "    已开启 linger：未登录也会随开机启动" \
    || echo "    （提示：如需未登录也自启，手动运行 sudo loginctl enable-linger $USER）"
fi

echo "==> 4/4 完成"
sleep 2
echo
echo "dazi-daemon 已设为用户服务并启动。"
echo "配对 PIN 看日志（每次启动会变）："
echo "    journalctl --user -u $UNIT -n 50 | grep '配对 PIN' | tail -1"
echo
echo "健康检查：curl -s http://127.0.0.1:7878/health"
echo "查看日志：journalctl --user -u $UNIT -f"
echo "卸载：    $SCRIPT_DIR/uninstall-daemon-linux.sh"
