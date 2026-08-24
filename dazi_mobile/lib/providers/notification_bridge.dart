import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../services/notification.dart';
import 'events_provider.dart';

final notificationBridgeProvider = Provider<void>((ref) {
  final notifications = NotificationService();

  ref.listen(eventsProvider, (_, next) {
    next.whenData((event) {
      event.whenOrNull(
        approvalRequested: (slug, name, approvalId, plan) {
          notifications.showApprovalRequested(slug, name, approvalId, plan);
        },
        taskCompleted: (slug, name, ok, summary) {
          notifications.showTaskCompleted(slug, name, ok, summary);
        },
      );
    });
  });
});
