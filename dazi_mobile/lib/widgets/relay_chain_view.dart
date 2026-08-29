import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/models.dart';
import '../providers/baton_provider.dart';
import '../providers/identity_provider.dart';
import '../utils/time.dart';

/// 接力链：这个任务经过谁的手、每人交代了什么。
///
/// 倒序展示（最近的在上）。这份历史同时会注入 agent 的 prompt——
/// 界面上看到的就是 agent 读到的，两边不该有第二套叙述。
class RelayChainView extends ConsumerWidget {
  const RelayChainView({super.key, required this.slug});

  final String slug;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final chainAsync = ref.watch(relayChainProvider(slug));
    final names = ref.watch(memberNamesProvider);

    return RefreshIndicator(
      onRefresh: () => ref.refresh(relayChainProvider(slug).future),
      child: chainAsync.when(
        data: (entries) {
          if (entries.isEmpty) {
            return ListView(
              physics: const AlwaysScrollableScrollPhysics(),
              children: const [
                SizedBox(height: 120),
                Center(child: Text('还没有接力记录')),
              ],
            );
          }
          final ordered = entries.reversed.toList();
          return ListView.builder(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.symmetric(vertical: 8),
            itemCount: ordered.length,
            itemBuilder: (context, index) => _RelayTile(
              entry: ordered[index],
              names: names,
            ),
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('加载失败: $e')),
      ),
    );
  }
}

class _RelayTile extends StatelessWidget {
  const _RelayTile({required this.entry, required this.names});

  final RelayEntry entry;
  final Map<String, String> names;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final note = entry.note?.trim() ?? '';
    // by 与 from/to 不一致说明是管理员代操作（强收），要显式点出来。
    final actor = _name(entry.by);
    final showActor = entry.action == 'release' && entry.from != null && entry.from != entry.by;

    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(_icon, size: 18, color: _color(theme)),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(_headline, style: theme.textTheme.bodyMedium),
                  const SizedBox(height: 2),
                  Text(
                    showActor
                        ? '${formatRunTime(entry.at)} · 由 $actor 操作'
                        : formatRunTime(entry.at),
                    style: theme.textTheme.bodySmall
                        ?.copyWith(color: theme.colorScheme.outline),
                  ),
                  if (note.isNotEmpty) ...[
                    const SizedBox(height: 6),
                    SelectableText(note, style: theme.textTheme.bodySmall),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _name(String? id) {
    if (id == null || id.isEmpty) return '未知';
    // agent 的标识不在成员表里，查不到就原样显示。
    return names[id] ?? id;
  }

  IconData get _icon => switch (entry.action) {
        'claim' => Icons.front_hand,
        'handoff' => Icons.send,
        'release' => Icons.logout,
        'expire' => Icons.timer_off_outlined,
        _ => Icons.circle_outlined,
      };

  Color _color(ThemeData theme) => switch (entry.action) {
        'claim' => theme.colorScheme.primary,
        'handoff' => theme.colorScheme.tertiary,
        'expire' => theme.colorScheme.error,
        _ => theme.colorScheme.outline,
      };

  String get _headline => switch (entry.action) {
        'claim' => '${_name(entry.to ?? entry.by)} 接手',
        'handoff' => '${_name(entry.from)} 递给 ${_name(entry.to)}',
        'release' => '${_name(entry.from)} 放下',
        'expire' => '${_name(entry.from)} 超时未推进',
        _ => entry.action,
      };
}
