import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../api/dazi_api.dart';
import '../models/models.dart';

/// 单个任务的棒状态。
final batonProvider = FutureProvider.family<BatonState, String>((ref, slug) async {
  return ref.watch(daziApiProvider).getBaton(slug);
});

/// 单个任务的接力链（服务端按时间正序返回，界面倒序展示）。
final relayChainProvider = FutureProvider.family<List<RelayEntry>, String>((ref, slug) async {
  return ref.watch(daziApiProvider).getRelayChain(slug);
});

/// 「待我处理」：棒在我手里的 + 可认领的。
///
/// 不做本地缓存。棒是抢占性资源，展示一份过期的持棒人比不展示更糟——
/// 用户会据此判断「这活有没有人在干」。
final inboxProvider = FutureProvider<Inbox>((ref) async {
  return ref.watch(daziApiProvider).getInbox();
});

/// 棒相关操作。成功后让受影响的 provider 失效重取，而不是本地推断新状态：
/// 服务端可能因过期、强收等原因给出与预期不同的结果。
class BatonActions {
  BatonActions(this._ref);

  final Ref _ref;

  DaziApi get _api => _ref.read(daziApiProvider);

  Future<void> claim(String slug, {String? note}) async {
    await _api.claimBaton(slug, note: note);
    _invalidate(slug);
  }

  Future<void> handoff(String slug, {required String to, String? note}) async {
    await _api.handoffBaton(slug, to: to, note: note);
    _invalidate(slug);
  }

  Future<void> release(String slug, {String? note, bool force = false}) async {
    await _api.releaseBaton(slug, note: note, force: force);
    _invalidate(slug);
  }

  void _invalidate(String slug) {
    _ref.invalidate(batonProvider(slug));
    _ref.invalidate(relayChainProvider(slug));
    _ref.invalidate(inboxProvider);
  }
}

final batonActionsProvider = Provider<BatonActions>((ref) => BatonActions(ref));
