#!/usr/bin/env bash
# 卸载 dazi-daemon LaunchAgent：停止自启并删除 plist。不影响代码与数据。
set -euo pipefail

LABEL="com.wxw.dazi-daemon"
PLIST="$HOME/Library/LaunchAgents/$LABEL.plist"

if [ -f "$PLIST" ]; then
  echo "==> 卸载 LaunchAgent"
  launchctl unload "$PLIST" 2>/dev/null || true
  rm -f "$PLIST"
  echo "已删除 $PLIST，dazi-daemon 不再开机自启。"
else
  echo "未发现已安装的 LaunchAgent（$PLIST 不存在）。"
fi

# 兜底：若仍有残留进程，提示用户
if pgrep -f "target/release/dazi-daemon" >/dev/null 2>&1; then
  echo "注意：仍有 dazi-daemon 进程在运行，如需立即停止："
  echo "    pkill -f 'target/release/dazi-daemon'"
fi
echo "（日志 ~/.dazi/daemon.log 与配对记录 ~/.dazi/devices.json 保留，如需清理请手动删除。）"
