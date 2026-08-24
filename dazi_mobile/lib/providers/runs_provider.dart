import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../api/dazi_api.dart';
import '../models/run_entry.dart';
import 'events_provider.dart';

/// 跨项目最近运行历史（GET /runs）。任务完成事件到达时自动刷新。
final runsProvider = FutureProvider<List<RunEntry>>((ref) {
  ref.listen(eventsProvider, (_, next) {
    next.whenData((event) {
      event.whenOrNull(
        taskCompleted: (_, __, ___, ____, _____, ______) => ref.invalidateSelf(),
      );
    });
  });
  return ref.watch(daziApiProvider).getRuns();
});
