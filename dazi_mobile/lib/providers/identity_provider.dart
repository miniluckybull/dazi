import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../api/dazi_api.dart';
import '../models/models.dart';
import 'auth_provider.dart';

/// 当前设备对应的成员身份。
///
/// 界面据此决定显示哪些操作（viewer 不显示「接手」）。身份在配对期间不变，
/// 故不轮询；被吊销时接口会回 401，由 auth_interceptor 统一处理。
final meProvider = FutureProvider<Me>((ref) async {
  final auth = ref.watch(authProvider);
  if (!auth.isPaired) throw StateError('未配对');
  return ref.watch(daziApiProvider).getMe();
});

/// 成员列表。递棒要选人，故手机也需要它。
final membersProvider = FutureProvider<List<Member>>((ref) async {
  final auth = ref.watch(authProvider);
  if (!auth.isPaired) return const [];
  return ref.watch(daziApiProvider).getMembers();
});

/// member_id → 显示名。接力链里存的是 id，展示要换成人名。
final memberNamesProvider = Provider<Map<String, String>>((ref) {
  final members = ref.watch(membersProvider).value ?? const <Member>[];
  return {for (final m in members) m.id: m.name};
});
