import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../api/dazi_api.dart';
import '../models/approval.dart';
import '../services/local_cache.dart';
import 'core_providers.dart';
import 'events_provider.dart';

class ApprovalsNotifier extends StateNotifier<AsyncValue<List<Approval>>> {
  ApprovalsNotifier(this._api, this._cache) : super(const AsyncValue.loading());

  final DaziApi _api;
  final LocalCacheService _cache;

  static const _cacheKey = 'approvals_list';

  Future<void> load() async {
    final cached = await _cache.getJson(_cacheKey);
    if (cached != null && cached is List) {
      state = AsyncValue.data(
        cached.map((e) => Approval.fromJson(e as Map<String, dynamic>)).toList(),
      );
    }
    await refresh();
  }

  Future<void> refresh() async {
    try {
      final approvals = await _api.getApprovals();
      await _cache.setJson(_cacheKey, approvals.map((a) => a.toJson()).toList());
      state = AsyncValue.data(approvals);
    } catch (e, st) {
      if (state.value == null) {
        state = AsyncValue.error(e, st);
      }
    }
  }

  Future<void> resolve(String slug, String id, bool approved) async {
    await _api.resolveApproval(slug, id, approved);
    await refresh();
  }

  void removeApproval(String id) {
    state.whenData((list) => state = AsyncValue.data(list.where((a) => a.id != id).toList()));
  }
}

final approvalsProvider = StateNotifierProvider<ApprovalsNotifier, AsyncValue<List<Approval>>>((ref) {
  final api = ref.watch(daziApiProvider);
  final cache = ref.watch(localCacheProvider);
  final notifier = ApprovalsNotifier(api, cache);

  notifier.load();

  ref.listen(eventsProvider, (_, next) {
    next.whenData((event) {
      event.whenOrNull(
        approvalRequested: (_, __, ___, ____) => notifier.refresh(),
        approvalResolved: (_, id, ____) => notifier.removeApproval(id),
      );
    });
  });

  return notifier;
});
