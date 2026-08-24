import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/run_entry.dart';
import '../providers/runs_provider.dart';
import '../utils/time.dart';

/// 跨项目运行历史（GET /runs 最近 100 条）。
class RunsScreen extends ConsumerWidget {
  const RunsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final runsAsync = ref.watch(runsProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('运行记录')),
      body: RefreshIndicator(
        onRefresh: () => ref.refresh(runsProvider.future),
        child: runsAsync.when(
          data: (runs) {
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
              itemBuilder: (context, index) => _RunEntryCard(run: runs[index]),
            );
          },
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (e, _) => Center(child: Text('加载失败: $e')),
        ),
      ),
    );
  }
}

class _RunEntryCard extends StatelessWidget {
  const _RunEntryCard({required this.run});

  final RunEntry run;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final okColor = run.ok ? Colors.green : Colors.red;
    final summary = run.summary?.trim() ?? '';
    final firstLine = summary.isEmpty ? '' : summary.split('\n').first;

    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      child: ExpansionTile(
        leading: Icon(
          run.ok ? Icons.check_circle_outline : Icons.error_outline,
          color: okColor,
        ),
        title: Text(run.name, style: theme.textTheme.titleSmall),
        subtitle: Text(
          '${formatRunTime(run.at)} · ${run.action}${firstLine.isEmpty ? '' : '\n$firstLine'}',
          maxLines: 2,
          overflow: TextOverflow.ellipsis,
        ),
        childrenPadding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
        children: [
          if (summary.isNotEmpty)
            Align(
              alignment: Alignment.centerLeft,
              child: SelectableText(summary, style: theme.textTheme.bodySmall),
            )
          else
            Align(
              alignment: Alignment.centerLeft,
              child: Text(
                '（无摘要）',
                style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.outline),
              ),
            ),
          if (run.artifacts.isNotEmpty) ...[
            const SizedBox(height: 8),
            Align(
              alignment: Alignment.centerLeft,
              child: Text('产物文件 (${run.artifacts.length})', style: theme.textTheme.labelLarge),
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
  }
}
