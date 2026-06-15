#!/usr/bin/env bash
# 安装 dazi-daemon 为 macOS LaunchAgent（登录自启 + 崩溃重拉）。
# 用户级，不需 sudo。装完 daemon 在后台常驻，配合 Tailscale 即可随时手机远程。
set -euo pipefail

REPO="/Users/wxw/Projects/dazi"
LABEL="com.wxw.dazi-daemon"
PLIST_DIR="$HOME/Library/LaunchAgents"
PLIST="$PLIST_DIR/$LABEL.plist"
TEMPLATE="$REPO/crates/dazi-daemon/deploy/$LABEL.plist.template"
BIN="$REPO/target/release/dazi-daemon"

echo "==> 1/4 编译 release 二进制"
cd "$REPO"
cargo build --release -p dazi-daemon

if [ ! -x "$BIN" ]; then
  echo "错误：未找到二进制 $BIN" >&2
  exit 1
fi

echo "==> 2/4 渲染 plist 到 $PLIST"
mkdir -p "$PLIST_DIR" "$HOME/.dazi"
# LaunchAgent PATH 兜底：含 homebrew 与系统目录
DAEMON_PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"
sed -e "s#__DAEMON_BIN__#$BIN#g" \
    -e "s#__HOME__#$HOME#g" \
    -e "s#__WORKDIR__#$REPO#g" \
    -e "s#__PATH__#$DAEMON_PATH#g" \
    "$TEMPLATE" > "$PLIST"

echo "==> 3/4 加载 LaunchAgent"
# 已加载则先卸载，保证幂等
launchctl unload "$PLIST" 2>/dev/null || true
launchctl load "$PLIST"

echo "==> 4/4 完成"
sleep 2
echo
echo "dazi-daemon 已设为登录自启，现已在后台运行。"
echo "配对 PIN 看日志（每次启动会变）："
echo "    grep '配对 PIN' $HOME/.dazi/daemon.log | tail -1"
echo
echo "健康检查：curl -s http://127.0.0.1:7878/health"
echo "查看日志：tail -f $HOME/.dazi/daemon.log"
echo "卸载：    $REPO/crates/dazi-daemon/deploy/uninstall-daemon.sh"
