import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../services/notification.dart';
import 'assign_provider.dart';
import 'baton_provider.dart';
import 'events_provider.dart';
import 'identity_provider.dart';

final notificationBridgeProvider = Provider<void>((ref) {
  final notifications = NotificationService();

  ref.listen(eventsProvider, (_, next) {
    next.whenData((event) {
      // WS 是全量广播，谁该被打扰要在客户端按身份筛。
      // 拿不到身份时（尚未加载完）不弹提及/指派类通知——
      // 宁可漏一条，也不要给不相关的人推送。
      final meId = ref.read(meProvider).valueOrNull?.member.id;
      final names = ref.read(memberNamesProvider);
      String who(String id) => names[id] ?? id;

      event.whenOrNull(
        approvalRequested: (slug, name, approvalId, plan, estimate) {
          notifications.showApprovalRequested(slug, name, approvalId, plan);
        },
        taskCompleted: (slug, name, ok, summary, runId, artifacts) {
          notifications.showTaskCompleted(slug, name, ok, summary, runId);
        },
        mentioned: (slug, name, mentions, by, text) {
          if (meId != null && mentions.contains(meId)) {
            notifications.showMentioned(slug, name, who(by), text);
          }
          // 不管有没有 @ 我，讨论列表都该刷新——我可能正开着那一页。
          ref.invalidate(commentsProvider(slug));
        },
        taskAssigned: (slug, name, assignee, by) {
          // 只在「指派给我」时通知；取消指派与指派给别人都不打扰。
          // 自己指派给自己也不弹——那是我刚做的动作。
          if (meId != null && assignee == meId && by != meId) {
            notifications.showAssigned(slug, name, who(by));
          }
          ref.invalidate(assignmentProvider(slug));
          ref.invalidate(assignedToMeProvider);
          // 指派变化会改「待我处理」的第二段。
          ref.invalidate(inboxProvider);
        },
      );
    });
  });
});
