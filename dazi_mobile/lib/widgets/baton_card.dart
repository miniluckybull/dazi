import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/models.dart';
import '../providers/baton_provider.dart';
import '../providers/identity_provider.dart';
import '../utils/time.dart';

/// 任务详情页顶部的接力棒卡片：谁在推进、还剩多久、我能做什么。
///
/// 三种状态各对应不同动作：
/// - 无人持棒 / 已过期 → 「接手」
/// - 我持棒 → 「递给…」「放下」
/// - 他人持棒且未过期 → 只读提示；管理员可「强收」
class BatonCard extends ConsumerWidget {
  const BatonCard({super.key, required this.slug});

  final String slug;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final stateAsync = ref.watch(batonProvider(slug));
    final me = ref.watch(meProvider).value;

    return stateAsync.when(
      data: (state) => _BatonBody(slug: slug, state: state, me: me),
      loading: () => const _BatonShell(
        icon: Icons.hourglass_empty,
        title: '读取接力棒…',
      ),
      error: (e, _) => _BatonShell(
        icon: Icons.link_off,
        title: '接力棒状态不可用',
        subtitle: '$e',
      ),
    );
  }
}

class _BatonShell extends StatelessWidget {
  const _BatonShell({
    required this.icon,
    required this.title,
    this.subtitle,
    this.color,
    this.actions = const [],
  });

  final IconData icon;
  final String title;
  final String? subtitle;
  final Color? color;
  final List<Widget> actions;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Card(
      margin: const EdgeInsets.fromLTRB(16, 12, 16, 4),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(icon, color: color ?? theme.colorScheme.primary, size: 20),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(title, style: theme.textTheme.titleSmall),
                ),
              ],
            ),
            if (subtitle != null) ...[
              const SizedBox(height: 4),
              Padding(
                padding: const EdgeInsets.only(left: 28),
                child: Text(
                  subtitle!,
                  style: theme.textTheme.bodySmall
                      ?.copyWith(color: theme.colorScheme.outline),
                ),
              ),
            ],
            if (actions.isNotEmpty) ...[
              const SizedBox(height: 4),
              Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: actions,
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _BatonBody extends ConsumerWidget {
  const _BatonBody({required this.slug, required this.state, required this.me});

  final String slug;
  final BatonState state;
  final Me? me;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final baton = state.baton;
    final member = me?.member;
    final names = ref.watch(memberNamesProvider);

    // 棒空着或超时了都算可认领——超时的棒服务端允许直接接管。
    final claimable = baton == null || state.expired;
    final mine = baton != null && baton.kind == 'human' && baton.holder == member?.id;

    if (claimable) {
      return _BatonShell(
        icon: Icons.pan_tool_outlined,
        title: baton == null ? '暂无人推进' : '上一位已超时未推进',
        subtitle: baton == null
            ? '接手后由你负责推进，2 小时无动作自动释放'
            : '${_display(baton.holder, baton.kind, names)} 的棒已过期，可直接接手',
        color: theme.colorScheme.outline,
        actions: [
          if (member?.canRun ?? false)
            FilledButton.icon(
              icon: const Icon(Icons.front_hand, size: 18),
              label: const Text('接手'),
              onPressed: () => _claim(context, ref),
            ),
        ],
      );
    }

    if (mine) {
      return _BatonShell(
        icon: Icons.front_hand,
        title: '棒在你手里',
        subtitle: formatRemaining(baton.expiresAt),
        actions: [
          TextButton(
            onPressed: () => _release(context, ref, force: false),
            child: const Text('放下'),
          ),
          const SizedBox(width: 4),
          FilledButton.icon(
            icon: const Icon(Icons.send, size: 18),
            label: const Text('递给…'),
            onPressed: () => _handoff(context, ref),
          ),
        ],
      );
    }

    return _BatonShell(
      icon: baton.kind == 'agent' ? Icons.smart_toy_outlined : Icons.person_outline,
      title: '${_display(baton.holder, baton.kind, names)} 正在推进',
      subtitle: formatRemaining(baton.expiresAt),
      color: theme.colorScheme.tertiary,
      actions: [
        if (member?.canManageMembers ?? false)
          TextButton(
            onPressed: () => _release(context, ref, force: true),
            child: const Text('强收'),
          ),
      ],
    );
  }

  /// agent 的 holder 就是 agent 名，不查成员表；human 查不到名字时退回 id。
  static String _display(String holder, String kind, Map<String, String> names) =>
      kind == 'agent' ? holder : (names[holder] ?? holder);

  Future<void> _claim(BuildContext context, WidgetRef ref) async {
    final note = await _askNote(context, title: '接手任务', hint: '这一轮你打算做什么（可留空）');
    if (note == null || !context.mounted) return;
    await _run(context, ref, () => ref.read(batonActionsProvider).claim(slug, note: note));
  }

  Future<void> _release(BuildContext context, WidgetRef ref, {required bool force}) async {
    final note = await _askNote(
      context,
      title: force ? '强收他人的棒' : '放下任务',
      hint: force ? '说明强收原因（会记进接力链）' : '交代进展或卡点（可留空）',
    );
    if (note == null || !context.mounted) return;
    await _run(
      context,
      ref,
      () => ref.read(batonActionsProvider).release(slug, note: note, force: force),
    );
  }

  Future<void> _handoff(BuildContext context, WidgetRef ref) async {
    final members = ref.read(membersProvider).value ?? const <Member>[];
    // 停用成员与自己都不作为候选：递给停用成员服务端会回 400。
    final candidates = members
        .where((m) => m.isActive && m.id != me?.member.id)
        .toList();
    if (candidates.isEmpty) {
      _toast(context, '没有可接手的成员');
      return;
    }
    if (!context.mounted) return;
    final picked = await showModalBottomSheet<Member>(
      context: context,
      builder: (sheetContext) => SafeArea(
        child: ListView(
          shrinkWrap: true,
          children: [
            const ListTile(title: Text('递给谁'), dense: true),
            for (final m in candidates)
              ListTile(
                leading: const Icon(Icons.person_outline),
                title: Text(m.name),
                subtitle: Text(m.role),
                onTap: () => Navigator.of(sheetContext).pop(m),
              ),
          ],
        ),
      ),
    );
    if (picked == null || !context.mounted) return;
    final note = await _askNote(
      context,
      title: '递给 ${picked.name}',
      hint: '交接说明：做到哪了、下一步是什么',
    );
    if (note == null || !context.mounted) return;
    await _run(
      context,
      ref,
      () => ref.read(batonActionsProvider).handoff(slug, to: picked.id, note: note),
    );
  }

  /// 返回 null 表示用户取消；返回空串表示确认但不写备注。
  Future<String?> _askNote(BuildContext context, {required String title, required String hint}) {
    final controller = TextEditingController();
    return showDialog<String>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: Text(title),
        content: TextField(
          controller: controller,
          autofocus: true,
          maxLines: 3,
          decoration: InputDecoration(hintText: hint),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(),
            child: const Text('取消'),
          ),
          FilledButton(
            onPressed: () => Navigator.of(dialogContext).pop(controller.text.trim()),
            child: const Text('确定'),
          ),
        ],
      ),
    );
  }

  Future<void> _run(BuildContext context, WidgetRef ref, Future<void> Function() action) async {
    try {
      await action();
    } on DioException catch (e) {
      if (!context.mounted) return;
      _toast(context, _explain(e));
      // 409/403 都意味着本地看到的状态已经不对了，强制重取。
      ref.invalidate(batonProvider(slug));
    }
  }

  /// 服务端语义翻成人话。409 是状态冲突（别人先抢到），不是权限问题。
  static String _explain(DioException e) {
    switch (e.response?.statusCode) {
      case 409:
        return '有人先接手了，已刷新状态';
      case 403:
        return '你的角色没有这个权限';
      case 400:
        return '对方不可接手（可能已停用）';
      default:
        return '操作失败：${e.message ?? e}';
    }
  }

  static void _toast(BuildContext context, String message) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
  }
}
