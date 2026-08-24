import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'router.dart';
import 'services/notification.dart';
import 'theme.dart';

class DaziApp extends ConsumerWidget {
  const DaziApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(routerProvider);
    // 通知点击跳转直接用 go_router 全局实例，不依赖 widget context。
    NotificationService().attachRouter(router);

    return MaterialApp.router(
      title: 'Dazi',
      debugShowCheckedModeBanner: false,
      theme: DaziTheme.light(),
      darkTheme: DaziTheme.dark(),
      themeMode: ThemeMode.system,
      routerConfig: router,
    );
  }
}
