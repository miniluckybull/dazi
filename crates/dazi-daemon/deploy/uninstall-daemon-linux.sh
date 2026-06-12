#!/usr/bin/env bash
# 卸载 dazi-daemon systemd 用户服务（Linux）。
# 停止自启并删 unit 文件。日志（journald）与配对记录（~/.dazi/devices.json）保留。
set -euo pipefail

UNIT="dazi-daemon"
UNIT_FILE="$HOME/.config/systemd/user/$UNIT.service"

echo "==> 停止并禁用服务"
systemctl --user stop "$UNIT.service" 2>/dev/null || true
systemctl --user disable "$UNIT.service" 2>/dev/null || true

if [ -f "$UNIT_FILE" ]; then
  rm -f "$UNIT_FILE"
  echo "==> 已删除 $UNIT_FILE"
fi

systemctl --user daemon-reload

echo "==> 完成。daemon 已停止自启。"
echo "如需清理配对记录：rm ~/.dazi/devices.json"
echo "如需关闭 linger：  sudo loginctl disable-linger $USER"
