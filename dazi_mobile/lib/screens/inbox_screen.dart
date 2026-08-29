import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../models/models.dart';
import '../providers/assign_provider.dart';
import '../providers/baton_provider.dart';
import '../providers/identity_provider.dart';
import '../utils/time.dart';

/// 「待我处理」：手机上的第一屏应该回答的问题是「现在轮到我做什么」。
///
/// 分三段，按紧迫程度排：
/// 1. 棒在我手里的——现在就该我动手
/// 2. 指派给我但棒不在我手里的——我的责任，但此刻不必动手（可能别人在帮我推）
/// 3. 没人推进的——可以捡起来
///
/// 第 2 段刻意不与第 1 段合并：指派是责任归属，棒是当下动作，
/// 混在一起会让「现在该做什么」这个问题重新变得需要思考。
/// 三段都空说明当前没有需要我操心的事——这是好状态，不是错误。
class InboxScreen extends ConsumerWidget {
  const InboxScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final inboxAsync = ref.watch(inboxProvider);
    final assignedAsync = ref.watch(assignedToMeProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('待我处理')),
      body: RefreshIndicator(
        onRefresh: () async {
          // 两份数据一起刷。只刷一半会让三段之间自相矛盾。
          await Future.wait([
            ref.refresh(inboxProvider.future),
            ref.refresh(assignedToMeProvider.future),
          ]);
        },
        child: inboxAsync.when(
          // 指派读失败不该挡住棒视图——后者是这一屏的主功能，
          // 故用 valueOrNull 降级为空列表而非整屏报错。
          data: (inbox) => _InboxList(
            inbox: inbox,
            assigned: assignedAsync.valueOrNull ?? const [],
          ),
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (e, _) => ListView(
            physics: const AlwaysScrollableScrollPhysics(),
            children: [
              const SizedBox(height: 120),
              Center(child: Text('加载失败: $e')),
            ],
          ),
        ),
      ),
    );
  }
}

class _InboxList extends ConsumerWidget {
  const _InboxList({required this.inbox, required this.assigned});

  final Inbox inbox;
  final List<AssignedItem> assigned;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    // 棒已经在我手里的，不必在「指派给我」里重复出现一次。
    final mineSlugs = {for (final m in inbox.mine) m.slug};
    final assignedOnly =
        assigned.where((a) => !mineSlugs.contains(a.slug)).toList();

    if (inbox.mine.isEmpty && inbox.unclaimed.isEmpty && assignedOnly.isEmpty) {
      return ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        children: [
          const SizedBox(height: 120),
          Center(
            child: Column(
              children: [
                Icon(Icons.done_all, size: 40, color: theme.colorScheme.outline),
                const SizedBox(height: 8),
                const Text('暂时没有轮到你的事'),
              ],
            ),
          ),
        ],
      );
    }

    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.only(bottom: 24),
      children: [
        if (inbox.mine.isNotEmpty) ...[
          _SectionHeader(title: '棒在你手里', count: inbox.mine.length),
          for (final item in inbox.mine) _InboxTile(item: item, mine: true),
        ],
        if (assignedOnly.isNotEmpty) ...[
          _SectionHeader(title: '指派给你', count: assignedOnly.length),
          for (final a in assignedOnly) _AssignedTile(item: a),
        ],
        if (inbox.unclaimed.isNotEmpty) ...[
          _SectionHeader(title: '无人推进', count: inbox.unclaimed.length),
          for (final item in inbox.unclaimed) _InboxTile(item: item, mine: false),
        ],
      ],
    );
  }
}

/// 指派给我、但棒不在我手里的任务。不提供「接手」按钮：
/// 棒可能正在别人手上，这一段的作用是提醒责任，不是催人抢棒。
class _AssignedTile extends StatelessWidget {
  const _AssignedTile({required this.item});

  final AssignedItem item;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      child: ListTile(
        leading: Icon(
          Icons.assignment_ind_outlined,
          color: theme.colorScheme.tertiary,
        ),
        title: Text(item.name),
        subtitle: Text('${item.slug} · 指派于 ${formatRunTime(item.assignment.at)}'),
        trailing: const Icon(Icons.chevron_right),
        onTap: () => context.push('/projects/${item.slug}'),
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  const _SectionHeader({required this.title, required this.count});

  final String title;
  final int count;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 4),
      child: Text(
        '$title · $count',
        style: theme.textTheme.labelLarge?.copyWith(color: theme.colorScheme.outline),
      ),
    );
  }
}

class _InboxTile extends ConsumerWidget {
  const _InboxTile({required this.item, required this.mine});

  final InboxItem item;
  final bool mine;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final names = ref.watch(memberNamesProvider);
    final canRun = ref.watch(meProvider).value?.member.canRun ?? false;

    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      child: ListTile(
        leading: Icon(
          mine ? Icons.front_hand : Icons.pan_tool_outlined,
          color: mine ? theme.colorScheme.primary : theme.colorScheme.outline,
        ),
        title: Text(item.name),
        subtitle: Text(_subtitle(names)),
        trailing: mine || !canRun
            ? const Icon(Icons.chevron_right)
            : TextButton(
                onPressed: () => _claim(context, ref),
                child: const Text('接手'),
              ),
        onTap: () => context.push('/projects/${item.slug}'),
      ),
    );
  }

  String _subtitle(Map<String, String> names) {
    final baton = item.baton;
    if (mine) {
      return baton == null ? item.slug : '${item.slug} · ${formatRemaining(baton.expiresAt)}';
    }
    if (baton == null) return '${item.slug} · 从未有人认领';
    final who = baton.kind == 'agent' ? baton.holder : (names[baton.holder] ?? baton.holder);
    return '${item.slug} · $who 已超时';
  }

  Future<void> _claim(BuildContext context, WidgetRef ref) async {
    try {
      await ref.read(batonActionsProvider).claim(item.slug);
      if (!context.mounted) return;
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text('已接手 ${item.name}')));
    } catch (_) {
      if (!context.mounted) return;
      // 抢不到最常见的原因是别人先点了；刷新后列表自己会变。
      ScaffoldMessenger.of(context)
          .showSnackBar(const SnackBar(content: Text('接手失败，已刷新列表')));
      ref.invalidate(inboxProvider);
    }
  }
}
