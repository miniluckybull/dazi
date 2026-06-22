import 'package:awesome_notifications/awesome_notifications.dart';
import 'package:flutter/material.dart';

class NotificationService {
  static final NotificationService _instance = NotificationService._internal();
  factory NotificationService() => _instance;
  NotificationService._internal();

  bool _initialized = false;

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
  }

  Future<bool> requestPermission() async {
    return AwesomeNotifications().requestPermissionToSendNotifications();
  }

  void showApprovalRequested(String slug, String name, String plan) {
    AwesomeNotifications().createNotification(
      content: NotificationContent(
        id: _hashId('$slug-approval'),
        channelKey: 'dazi_events',
        title: 'Dazi: $name',
        body: plan.length > 80 ? '${plan.substring(0, 80)}...' : plan,
        notificationLayout: NotificationLayout.Default,
        payload: {'type': 'approval', 'slug': slug},
      ),
    );
  }

  void showTaskCompleted(String slug, String name, bool ok, String summary) {
    AwesomeNotifications().createNotification(
      content: NotificationContent(
        id: _hashId('$slug-completed'),
        channelKey: 'dazi_events',
        title: 'Dazi: $name',
        body: '${ok ? '✓' : '✗'} $summary',
        notificationLayout: NotificationLayout.Default,
        payload: {'type': 'task', 'slug': slug},
      ),
    );
  }

  int _hashId(String input) {
    return input.hashCode.abs() % 0x7FFFFFFF;
  }
}
