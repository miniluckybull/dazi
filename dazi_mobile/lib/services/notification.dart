import 'package:awesome_notifications/awesome_notifications.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

/// awesome_notifications 要求 action 回调是 static 或 top-level 函数。
/// 这里只做转发，真正的导航逻辑在 NotificationService 单例里。
@pragma('vm:entry-point')
Future<void> onNotificationActionReceived(ReceivedAction receivedAction) async {
  await NotificationService().handleAction(receivedAction);
}

class NotificationService {
  static final NotificationService _instance = NotificationService._internal();
  factory NotificationService() => _instance;
  NotificationService._internal();

  bool _initialized = false;

  /// go_router 全局实例，不依赖 widget context；App 启动早期可能尚未挂载，
  /// 此时把 action 存到 [_pendingAction]，等 [attachRouter] 时再补跳。
  GoRouter? _router;
  ReceivedAction? _pendingAction;

  Future<void> init() async {
    if (_initialized) return;
    _initialized = true;

    await AwesomeNotifications().initialize(
      null,
      [
        NotificationChannel(
          channelKey: 'dazi_events',
          channelName: 'Dazi 事件',
          channelDescription: '来自 Dazi daemon 的实时事件通知',
          defaultColor: const Color(0xFF7C3AED),
          ledColor: const Color(0xFF7C3AED),
          importance: NotificationImportance.High,
          channelShowBadge: true,
        ),
      ],
    );

    await AwesomeNotifications().setListeners(
      onActionReceivedMethod: onNotificationActionReceived,
    );

    // 冷启动：App 被通知点击拉活时，action 不会走 listener，要主动取。
    final initial = await AwesomeNotifications().getInitialNotificationAction();
    if (initial != null) {
      _pendingAction = initial;
    }
  }

  /// 由 App 在拿到 GoRouter 实例后调用；补发启动早期积压的 action。
  void attachRouter(GoRouter router) {
    _router = router;
    final pending = _pendingAction;
    if (pending != null) {
      _pendingAction = null;
      handleAction(pending);
    }
  }

  /// 根据通知 payload 跳转：审批类进审批详情页，其余进项目详情页。
  Future<void> handleAction(ReceivedAction action) async {
    final payload = action.payload;
    if (payload == null) return;
    final router = _router;
    if (router == null) {
      _pendingAction = action;
      return;
    }

    final slug = payload['slug'];
    if (payload['type'] == 'approval') {
      final id = payload['id'];
      if (slug != null && id != null) {
        router.push('/approvals/${Uri.encodeComponent(slug)}/${Uri.encodeComponent(id)}');
      } else {
        router.push('/approvals');
      }
      return;
    }
    if (slug != null) {
      // 任务完成类通知直达项目详情的运行 Tab。
      final tab = payload['type'] == 'task' ? '?tab=runs' : '';
      router.push('/projects/${Uri.encodeComponent(slug)}$tab');
    }
  }

  Future<bool> requestPermission() async {
    return AwesomeNotifications().requestPermissionToSendNotifications();
  }

  void showApprovalRequested(String slug, String name, String approvalId, String plan) {
    AwesomeNotifications().createNotification(
      content: NotificationContent(
        id: _hashId('$slug-approval'),
        channelKey: 'dazi_events',
        title: 'Dazi: $name',
        body: plan.length > 80 ? '${plan.substring(0, 80)}...' : plan,
        notificationLayout: NotificationLayout.Default,
        payload: {'type': 'approval', 'slug': slug, 'id': approvalId},
      ),
    );
  }

  void showTaskCompleted(String slug, String name, bool ok, String summary, String runId) {
    AwesomeNotifications().createNotification(
      content: NotificationContent(
        id: _hashId('$slug-completed'),
        channelKey: 'dazi_events',
        title: 'Dazi: $name',
        body: '${ok ? '✓' : '✗'} $summary',
        notificationLayout: NotificationLayout.Default,
        payload: {'type': 'task', 'slug': slug, 'run_id': runId},
      ),
    );
  }

  int _hashId(String input) {
    return input.hashCode.abs() % 0x7FFFFFFF;
  }
}
