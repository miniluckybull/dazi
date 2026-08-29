import 'package:flutter/material.dart';
import 'package:flutter_markdown_plus/flutter_markdown_plus.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../api/dazi_api.dart';
import '../providers/project_content_provider.dart';
import '../providers/project_meta_provider.dart';
import '../utils/time.dart';
import '../widgets/baton_card.dart';
import '../widgets/readme_editor.dart';
import '../widgets/relay_chain_view.dart';
import '../widgets/terminal_view.dart';

class ProjectDetailScreen extends ConsumerWidget {
  const ProjectDetailScreen({super.key, required this.slug, this.initialTab});

  final String slug;

  /// 初始 Tab（如通知跳转带 ?tab=runs 直达运行记录）。
  final String? initialTab;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final metaAsync = ref.watch(projectMetaProvider(slug));

    return DefaultTabController(
      length: 6,
      initialIndex: initialTab == 'runs' ? 4 : (initialTab == 'relay' ? 5 : 0),
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
              Tab(text: '运行'),
              Tab(text: '接力'),
            ],
          ),
        ),
        // 棒卡片放在 TabBarView 之外：不管在看哪个 Tab，
        // 「现在谁在推进」都必须一眼可见。
        body: Column(
          children: [
            BatonCard(slug: slug),
            Expanded(
              child: TabBarView(
                children: [
                  _ReadmeTab(slug: slug),
                  DaziTerminalView(slug: slug),
                  _JournalTab(slug: slug),
                  _ContextTab(slug: slug),
                  _RunsTab(slug: slug),
                  RelayChainView(slug: slug),
                ],
              ),
            ),
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

/// 运行 Tab：展示该任务的运行记录（时间、成败、摘要、产物清单，只读）。
class _RunsTab extends ConsumerWidget {
  const _RunsTab({required this.slug});

  final String slug;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final metaAsync = ref.watch(projectMetaProvider(slug));

    return RefreshIndicator(
      onRefresh: () => ref.refresh(projectMetaProvider(slug).future),
      child: metaAsync.when(
        data: (meta) {
          final runs = (meta.runs ?? []).reversed.toList();
          if (runs.isEmpty) {
            return ListView(
              physics: const AlwaysScrollableScrollPhysics(),
              children: const [
                SizedBox(height: 120),
                Center(child: Text('暂无运行记录')),
              ],
            );
          }
          return ListView.builder(
            physics: const AlwaysScrollableScrollPhysics(),
            itemCount: runs.length,
            itemBuilder: (context, index) {
              final run = runs[index];
              final theme = Theme.of(context);
              final okColor = run.ok ? Colors.green : Colors.red;
              final summary = run.summary?.trim() ?? '';
              return Card(
                margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                child: ExpansionTile(
                  leading: Icon(
                    run.ok ? Icons.check_circle_outline : Icons.error_outline,
                    color: okColor,
                  ),
                  title: Text('${formatRunTime(run.at)} · ${run.action}',
                      style: theme.textTheme.titleSmall),
                  subtitle: summary.isEmpty
                      ? null
                      : Text(
                          summary.split('\n').first,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                  childrenPadding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
                  children: [
                    Align(
                      alignment: Alignment.centerLeft,
                      child: summary.isEmpty
                          ? Text(
                              '（无摘要）',
                              style: theme.textTheme.bodySmall
                                  ?.copyWith(color: theme.colorScheme.outline),
                            )
                          : SelectableText(summary, style: theme.textTheme.bodySmall),
                    ),
                    if (run.artifacts.isNotEmpty) ...[
                      const SizedBox(height: 8),
                      Align(
                        alignment: Alignment.centerLeft,
                        child: Text('产物文件 (${run.artifacts.length})',
                            style: theme.textTheme.labelLarge),
                      ),
                      for (final path in run.artifacts)
                        Row(
                          children: [
                            Icon(Icons.insert_drive_file_outlined,
                                size: 16, color: theme.colorScheme.outline),
                            const SizedBox(width: 6),
                            Expanded(
                              child: Text(path, style: theme.textTheme.bodySmall),
                            ),
                          ],
                        ),
                    ],
                  ],
                ),
              );
            },
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('加载失败: $e')),
      ),
    );
  }
}
