import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../providers/events_provider.dart';
import '../providers/health_provider.dart';

/// 连接状态徽章（三态）：
/// 绿 = WS 已连接且 /health claude 探活通过；
/// 黄 = 连接中，或已连接但 claude 探活未知；
/// 红 = WS 断开，或 claude 探活失败（点击给指引）。
class ConnectionBadge extends ConsumerWidget {
  const ConnectionBadge({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final eventsAsync = ref.watch(eventsProvider);
    final claudeOk = ref.watch(healthProvider).valueOrNull?.claudeOk;

    final String label;
    final Color color;
    final String? tip;
    if (eventsAsync.hasError) {
      label = '断开';
      color = Colors.red;
      tip = '无法连接服务器，请检查服务器地址和网络';
    } else if (!eventsAsync.hasValue) {
      label = '连接中…';
      color = Colors.orange;
      tip = null;
    } else if (claudeOk == true) {
      label = '已连接';
      color = Colors.green;
      tip = null;
    } else if (claudeOk == false) {
      label = 'claude 异常';
      color = Colors.red;
      tip = '服务器上的 claude 不可用，请检查 API key/网络';
    } else {
      // 已连接但尚未探测 / 探活结果未知。
      label = '已连接';
      color = Colors.orange;
      tip = null;
    }

    return GestureDetector(
      onTap: tip == null
          ? null
          : () => ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text(tip!)),
              ),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.15),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Text(
          label,
          style: TextStyle(color: color, fontSize: 12, fontWeight: FontWeight.w500),
        ),
      ),
    );
  }
}
