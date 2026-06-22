import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../services/notification.dart';

class ShellScreen extends StatefulWidget {
  const ShellScreen({super.key, required this.navigationShell});

  final StatefulNavigationShell navigationShell;

  @override
  State<ShellScreen> createState() => _ShellScreenState();
}

class _ShellScreenState extends State<ShellScreen> {
  @override
  void initState() {
    super.initState();
    NotificationService().requestPermission();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: widget.navigationShell,
      bottomNavigationBar: NavigationBar(
        selectedIndex: widget.navigationShell.currentIndex,
        onDestinationSelected: widget.navigationShell.goBranch,
        destinations: const [
          NavigationDestination(icon: Icon(Icons.folder_outlined), label: '项目'),
          NavigationDestination(icon: Icon(Icons.check_circle_outline), label: '审批'),
          NavigationDestination(icon: Icon(Icons.memory_outlined), label: '记忆'),
        ],
      ),
    );
  }
}
