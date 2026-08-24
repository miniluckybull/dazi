import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../providers/projects_provider.dart';
import '../widgets/connection_badge.dart';
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
            icon: const Icon(Icons.history),
            tooltip: '运行记录',
            onPressed: () => context.push('/runs'),
          ),
          const Padding(
            padding: EdgeInsets.only(right: 16),
            child: ConnectionBadge(),
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () => ref.read(projectsProvider.notifier).refresh(),
        child: projectsAsync.when(
          data: (projects) {
            if (projects.isEmpty) {
              return const _EmptyProjectsGuide();
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
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.push('/projects/new'),
        icon: const Icon(Icons.add),
        label: const Text('新建任务'),
      ),
    );
  }
}

/// 空态引导：说明「任务即文件夹」心智并给出新建入口。
class _EmptyProjectsGuide extends StatelessWidget {
  const _EmptyProjectsGuide();

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.all(32),
      children: [
        const SizedBox(height: 80),
        Icon(Icons.folder_outlined, size: 56, color: theme.colorScheme.outline),
        const SizedBox(height: 16),
        Text(
          '任务即文件夹：每个任务独立目录，AI 只能看到任务内的文件。',
          textAlign: TextAlign.center,
          style: theme.textTheme.bodyMedium,
        ),
        const SizedBox(height: 24),
        Center(
          child: FilledButton.icon(
            onPressed: () => context.push('/projects/new'),
            icon: const Icon(Icons.add),
            label: const Text('新建任务'),
          ),
        ),
      ],
    );
  }
}
