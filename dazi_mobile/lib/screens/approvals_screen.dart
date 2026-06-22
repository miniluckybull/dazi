import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../providers/approvals_provider.dart';
import 'approval_detail_screen.dart';

class ApprovalsScreen extends ConsumerWidget {
  const ApprovalsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final approvalsAsync = ref.watch(approvalsProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('审批')),
      body: RefreshIndicator(
        onRefresh: () => ref.read(approvalsProvider.notifier).refresh(),
        child: approvalsAsync.when(
          data: (approvals) {
            if (approvals.isEmpty) {
              return const Center(child: Text('暂无待审批'));
            }
            return ListView.builder(
              physics: const AlwaysScrollableScrollPhysics(),
              itemCount: approvals.length,
              itemBuilder: (context, index) {
                final approval = approvals[index];
                return Card(
                  margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                  child: ListTile(
                    title: Text(approval.name),
                    subtitle: Text('${approval.slug} · ${approval.plan.length > 60 ? '${approval.plan.substring(0, 60)}...' : approval.plan}'),
                    trailing: const Icon(Icons.chevron_right),
                    onTap: () => Navigator.of(context).push(
                      MaterialPageRoute(
                        builder: (_) => ApprovalDetailScreen(approval: approval),
                      ),
                    ),
                  ),
                );
              },
            );
          },
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (e, _) => Center(child: Text('加载失败: $e')),
        ),
      ),
    );
  }
}
