import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../models/models.dart';
import '../providers/baton_provider.dart';
import '../providers/identity_provider.dart';
import '../utils/time.dart';

/// 「待我处理」：手机上的第一屏应该回答的问题是「现在轮到我做什么」。
///
/// 分两段：棒在我手里的（我的责任）、没人推进的（可以捡起来）。
/// 两段都空说明当前没有需要我动手的事——这是好状态，不是错误。
class InboxScreen extends ConsumerWidget {
  const InboxScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final inboxAsync = ref.watch(inboxProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('待我处理')),
      body: RefreshIndicator(
        onRefresh: () => ref.refresh(inboxProvider.future),
        child: inboxAsync.when(
          data: (inbox) => _InboxList(inbox: inbox),
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
  const _InboxList({required this.inbox});

  final Inbox inbox;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    if (inbox.mine.isEmpty && inbox.unclaimed.isEmpty) {
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
        if (inbox.unclaimed.isNotEmpty) ...[
          _SectionHeader(title: '无人推进', count: inbox.unclaimed.length),
          for (final item in inbox.unclaimed) _InboxTile(item: item, mine: false),
        ],
      ],
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
