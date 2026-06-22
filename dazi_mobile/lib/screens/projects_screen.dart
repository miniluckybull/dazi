import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../providers/auth_provider.dart';
import '../providers/projects_provider.dart';
import '../widgets/project_card.dart';

class ProjectsScreen extends ConsumerWidget {
  const ProjectsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final projectsAsync = ref.watch(projectsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('项目'),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () => ref.read(authProvider.notifier).logout(),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () => ref.read(projectsProvider.notifier).refresh(),
        child: projectsAsync.when(
          data: (projects) {
            if (projects.isEmpty) {
              return const Center(child: Text('暂无项目'));
            }
            return ListView.builder(
              physics: const AlwaysScrollableScrollPhysics(),
              itemCount: projects.length,
              itemBuilder: (context, index) => ProjectCard(
                project: projects[index],
                onTap: () => context.push('/projects/${projects[index].slug}'),
              ),
            );
          },
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (e, _) => Center(child: Text('加载失败: $e')),
        ),
      ),
    );
  }
}
