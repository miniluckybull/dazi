import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_markdown_plus/flutter_markdown_plus.dart';

import '../models/approval.dart';
import '../providers/approvals_provider.dart';

/// 按 slug + id 从待批列表里查审批，供通知点击的 go_router 路由使用。
/// 列表只含待批项；查不到说明已处理。
class ApprovalDetailById extends ConsumerWidget {
  const ApprovalDetailById({super.key, required this.slug, required this.id});

  final String slug;
  final String id;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final approvalsAsync = ref.watch(approvalsProvider);
    return approvalsAsync.when(
      data: (approvals) {
        for (final approval in approvals) {
          if (approval.id == id && approval.slug == slug) {
            return ApprovalDetailScreen(approval: approval);
          }
        }
        return Scaffold(
          appBar: AppBar(title: const Text('审批')),
          body: const Center(child: Text('审批不存在或已处理')),
        );
      },
      loading: () => const Scaffold(body: Center(child: CircularProgressIndicator())),
      error: (e, _) => Scaffold(body: Center(child: Text('加载失败: $e'))),
    );
  }
}

class ApprovalDetailScreen extends ConsumerWidget {
  const ApprovalDetailScreen({super.key, required this.approval});

  final Approval approval;

  Future<void> _resolve(BuildContext context, WidgetRef ref, bool approved) async {
    final navigator = Navigator.of(context);
    await ref.read(approvalsProvider.notifier).resolve(approval.slug, approval.id, approved);
    if (context.mounted) {
      navigator.pop();
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final isResolving = ref.watch(approvalsProvider).isLoading;

    return Scaffold(
      appBar: AppBar(title: Text('审批: ${approval.name}')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text('项目: ${approval.slug}', style: theme.textTheme.titleMedium),
            const SizedBox(height: 12),
            Expanded(
              child: Card(
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Markdown(
                    data: approval.plan,
                    selectable: true,
                    shrinkWrap: true,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: FilledButton.tonal(
                    onPressed: isResolving ? null : () => _resolve(context, ref, false),
                    style: FilledButton.styleFrom(backgroundColor: theme.colorScheme.error),
                    child: const Text('拒绝'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: FilledButton(
                    onPressed: isResolving ? null : () => _resolve(context, ref, true),
                    child: const Text('批准'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
