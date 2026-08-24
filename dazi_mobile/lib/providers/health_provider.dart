import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../api/dazi_api.dart';
import '../models/health.dart';
import 'auth_provider.dart';

/// 定时轮询 GET /health，取 claude 探活结果供连接徽章展示。
/// 未配对时不轮询；请求失败按未知（claudeOk = null）处理，由徽章结合 WS 状态判色。
final healthProvider = StreamProvider<HealthInfo>((ref) async* {
  final auth = ref.watch(authProvider);
  if (!auth.isPaired) return;
  final api = ref.watch(daziApiProvider);
  while (true) {
    try {
      yield await api.getHealth();
    } catch (_) {
      yield const HealthInfo();
    }
    await Future<void>.delayed(const Duration(seconds: 30));
  }
});
