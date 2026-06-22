import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class ShellScreen extends StatelessWidget {
  const ShellScreen({super.key, required this.navigationShell});

  final StatefulNavigationShell navigationShell;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: navigationShell,
      bottomNavigationBar: NavigationBar(
        selectedIndex: navigationShell.currentIndex,
        onDestinationSelected: navigationShell.goBranch,
        destinations: const [
          NavigationDestination(icon: Icon(Icons.folder_outlined), label: '项目'),
          NavigationDestination(icon: Icon(Icons.check_circle_outline), label: '审批'),
          NavigationDestination(icon: Icon(Icons.memory_outlined), label: '记忆'),
        ],
      ),
    );
  }
}
