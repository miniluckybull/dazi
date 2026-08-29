import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../api/dazi_api.dart';
import '../models/models.dart';

/// 单个任务的指派。未指派为 null。
final assignmentProvider =
    FutureProvider.family<Assignment?, String>((ref, slug) async {
  return ref.watch(daziApiProvider).getAssignment(slug);
});

/// 「指派给我的」。与 inboxProvider 并列而非合并：
/// inbox 答「现在轮到我动手吗」，这里答「哪些活归我负责」——
/// 归我但棒在别人手里的活不该从我的责任清单里消失。
final assignedToMeProvider = FutureProvider<List<AssignedItem>>((ref) async {
  return ref.watch(daziApiProvider).getAssignedToMe();
});

/// 单个任务的评论。
final commentsProvider =
    FutureProvider.family<List<Comment>, String>((ref, slug) async {
  return ref.watch(daziApiProvider).getComments(slug);
});

/// 指派与评论操作。同 BatonActions：成功后失效重取，不本地推断新状态。
class AssignActions {
  AssignActions(this._ref);

  final Ref _ref;

  DaziApi get _api => _ref.read(daziApiProvider);

  /// `assignee` 传 null 表示取消指派。
  Future<void> assign(String slug, String? assignee) async {
    await _api.setAssignment(slug, assignee: assignee);
    _ref.invalidate(assignmentProvider(slug));
    _ref.invalidate(assignedToMeProvider);
  }

  Future<void> comment(String slug, String text) async {
    await _api.addComment(slug, text);
    _ref.invalidate(commentsProvider(slug));
  }
}

final assignActionsProvider =
    Provider<AssignActions>((ref) => AssignActions(ref));
