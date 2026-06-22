import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hive_flutter/hive_flutter.dart';

import 'app.dart';
import 'providers/notification_bridge.dart';
import 'services/notification.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Hive.initFlutter();
  await NotificationService().init();

  runApp(
    const ProviderScope(
      child: NotificationInitializer(child: DaziApp()),
    ),
  );
}

class NotificationInitializer extends ConsumerWidget {
  const NotificationInitializer({super.key, required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    ref.watch(notificationBridgeProvider);
    return child;
  }
}
