import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/models.dart';
import '../providers/assign_provider.dart';
import '../providers/identity_provider.dart';

/// 「负责人」一行，紧挨接力棒卡片下方。
///
/// 刻意做成一行而不是一张卡：指派是低频信息（几天不变），
/// 它不该和棒（每次推进都变）抢同样的视觉重量。
class AssigneeRow extends ConsumerWidget {
  const AssigneeRow({super.key, required this.slug});

  final String slug;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final async = ref.watch(assignmentProvider(slug));
    final me = ref.watch(meProvider).value;
    final names = ref.watch(memberNamesProvider);
    final canWrite = me?.member.canWrite ?? false;

    final label = async.when(
      data: (a) => a == null
          ? '未指派'
          : (names[a.assignee] ?? a.assignee),
      loading: () => '…',
      // 读不到就说读不到。显示「未指派」会让人以为可以放心认领。
      error: (_, __) => '负责人未知',
    );
    final unassigned = async.value == null && !async.isLoading;

    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 0, 20, 8),
      child: Row(
        children: [
          Icon(
            unassigned ? Icons.person_add_alt : Icons.assignment_ind_outlined,
            size: 18,
            color: theme.colorScheme.outline,
          ),
          const SizedBox(width: 8),
          Text('负责人', style: theme.textTheme.bodySmall),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              label,
              style: theme.textTheme.bodyMedium?.copyWith(
                color: unassigned ? theme.colorScheme.outline : null,
              ),
              overflow: TextOverflow.ellipsis,
            ),
          ),
          if (canWrite)
            TextButton(
              onPressed: () => _pick(context, ref),
              child: Text(unassigned ? '指派' : '改派'),
            ),
        ],
      ),
    );
  }

  Future<void> _pick(BuildContext context, WidgetRef ref) async {
    final members = ref.read(membersProvider).value ?? const <Member>[];
    // 停用成员不作为候选：服务端会回 400。
    final candidates = members.where((m) => m.isActive).toList();
    final current = ref.read(assignmentProvider(slug)).value;

    final picked = await showModalBottomSheet<_Pick>(
      context: context,
      builder: (sheetContext) => SafeArea(
        child: ListView(
          shrinkWrap: true,
          children: [
            const ListTile(title: Text('指派给谁'), dense: true),
            for (final m in candidates)
              ListTile(
                leading: const Icon(Icons.person_outline),
                title: Text(m.name),
                subtitle: Text(m.role),
                trailing: m.id == current?.assignee
                    ? const Icon(Icons.check, size: 18)
                    : null,
                onTap: () => Navigator.of(sheetContext).pop(_Pick(m.id)),
              ),
            if (current != null) ...[
              const Divider(height: 1),
              ListTile(
                leading: const Icon(Icons.person_off_outlined),
                title: const Text('取消指派'),
                onTap: () => Navigator.of(sheetContext).pop(const _Pick(null)),
              ),
            ],
          ],
        ),
      ),
    );
    if (picked == null || !context.mounted) return;
    try {
      await ref.read(assignActionsProvider).assign(slug, picked.id);
    } on DioException catch (e) {
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            e.response?.statusCode == 400
                ? '这位成员不可指派（可能已停用）'
                : e.response?.statusCode == 403
                    ? '你的角色不能改指派'
                    : '指派失败：${e.message ?? e}',
          ),
        ),
      );
    }
  }
}

/// 包一层是为了把「选了某人」与「取消指派（null）」区分开——
/// 直接回 String? 的话，两者在 pop 的返回值上都是 null。
class _Pick {
  const _Pick(this.id);
  final String? id;
}
