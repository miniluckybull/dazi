import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../widgets/terminal_view.dart';

class ProjectDetailScreen extends StatelessWidget {
  const ProjectDetailScreen({super.key, required this.slug});

  final String slug;

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 2,
      child: Scaffold(
        appBar: AppBar(
          title: Text(slug),
          actions: [
            IconButton(
              icon: const Icon(Icons.schedule),
              onPressed: () => context.push('/projects/$slug/schedule'),
            ),
          ],
          bottom: const TabBar(
            tabs: [
              Tab(text: 'README'),
              Tab(text: '终端'),
            ],
          ),
        ),
        body: TabBarView(
          children: [
            const Center(child: Text('README')),
            DaziTerminalView(slug: slug),
          ],
        ),
      ),
    );
  }
}
