import 'package:flutter/material.dart';
import 'package:flutter_markdown_plus/flutter_markdown_plus.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../api/dazi_api.dart';
import '../providers/project_content_provider.dart';
import '../providers/project_meta_provider.dart';
import '../widgets/readme_editor.dart';
import '../widgets/terminal_view.dart';

class ProjectDetailScreen extends ConsumerWidget {
  const ProjectDetailScreen({super.key, required this.slug});

  final String slug;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final metaAsync = ref.watch(projectMetaProvider(slug));

    return DefaultTabController(
      length: 4,
      child: Scaffold(
        appBar: AppBar(
          title: metaAsync.when(
            data: (meta) => Text(meta.name),
            loading: () => const Text('加载中…'),
            error: (_, __) => Text(slug),
          ),
          actions: [
            IconButton(
              icon: const Icon(Icons.schedule),
              onPressed: () => context.push('/projects/$slug/schedule'),
            ),
          ],
          bottom: const TabBar(
            isScrollable: true,
            tabs: [
              Tab(text: 'README'),
              Tab(text: '终端'),
              Tab(text: '日志'),
              Tab(text: '上下文'),
            ],
          ),
        ),
        body: TabBarView(
          children: [
            _ReadmeTab(slug: slug),
            DaziTerminalView(slug: slug),
            _JournalTab(slug: slug),
            _ContextTab(slug: slug),
          ],
        ),
      ),
    );
  }
}

class _ReadmeTab extends ConsumerWidget {
  const _ReadmeTab({required this.slug});

  final String slug;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final readmeAsync = ref.watch(readmeProvider(slug));

    return readmeAsync.when(
      data: (content) => ReadmeEditor(
        initialContent: content,
        onSave: (value) async {
          await ref.read(daziApiProvider).putReadme(slug, value);
          ref.invalidate(readmeProvider(slug));
        },
      ),
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, _) => Center(child: Text('加载失败: $e')),
    );
  }
}

class _JournalTab extends ConsumerWidget {
  const _JournalTab({required this.slug});

  final String slug;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final journalAsync = ref.watch(journalProvider(slug));

    return journalAsync.when(
      data: (content) => Markdown(
        data: content.isEmpty ? '（暂无日志）' : content,
        padding: const EdgeInsets.all(16),
      ),
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, _) => Center(child: Text('加载失败: $e')),
    );
  }
}

class _ContextTab extends ConsumerWidget {
  const _ContextTab({required this.slug});

  final String slug;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final contextAsync = ref.watch(contextProvider(slug));

    return contextAsync.when(
      data: (content) => Markdown(
        data: content.isEmpty ? '（暂无上下文）' : content,
        padding: const EdgeInsets.all(16),
      ),
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, _) => Center(child: Text('加载失败: $e')),
    );
  }
}
