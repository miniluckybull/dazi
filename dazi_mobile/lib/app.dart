import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'router.dart';
import 'theme.dart';

class DaziApp extends ConsumerWidget {
  const DaziApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(routerProvider);

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
