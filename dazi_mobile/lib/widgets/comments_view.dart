import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/models.dart';
import '../providers/assign_provider.dart';
import '../providers/identity_provider.dart';
import '../utils/time.dart';

/// 评论 Tab：讨论与 @派活。
///
/// 正序展示（旧的在上、新的在下）并停在底部——与接力链的倒序刻意不同：
/// 接力链是查历史（最近的最相关），讨论是读上下文（要顺着看下来）。
///
/// viewer 也能发评论。viewer 的语义是「能看不能改任务」，不是「不能说话」；
/// 把评论按 write 把关会让 viewer 连提问都做不到。
class CommentsView extends ConsumerStatefulWidget {
  const CommentsView({super.key, required this.slug});

  final String slug;

  @override
  ConsumerState<CommentsView> createState() => _CommentsViewState();
}

class _CommentsViewState extends ConsumerState<CommentsView> {
  final _controller = TextEditingController();
  bool _sending = false;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final async = ref.watch(commentsProvider(widget.slug));
    final names = ref.watch(memberNamesProvider);

    return Column(
      children: [
        Expanded(
          child: async.when(
            data: (list) => list.isEmpty
                ? const _Empty()
                : ListView.builder(
                    padding: const EdgeInsets.symmetric(vertical: 8),
                    itemCount: list.length,
                    itemBuilder: (_, i) =>
                        _Bubble(comment: list[i], names: names),
                  ),
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (e, _) => Center(child: Text('读不到讨论：$e')),
          ),
        ),
        const Divider(height: 1),
        _Composer(
          controller: _controller,
          sending: _sending,
          onSend: _send,
        ),
      ],
    );
  }

  Future<void> _send() async {
    final text = _controller.text.trim();
    if (text.isEmpty || _sending) return;
    setState(() => _sending = true);
    try {
      await ref.read(assignActionsProvider).comment(widget.slug, text);
      _controller.clear();
    } on DioException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('发送失败：${e.message ?? e}')),
        );
      }
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }
}

class _Empty extends StatelessWidget {
  const _Empty();

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.forum_outlined, size: 44, color: theme.colorScheme.outline),
            const SizedBox(height: 12),
            Text('还没有讨论', style: theme.textTheme.titleSmall),
            const SizedBox(height: 6),
            Text(
              '用 @姓名 提到某人，他会收到通知。',
              textAlign: TextAlign.center,
              style: theme.textTheme.bodySmall
                  ?.copyWith(color: theme.colorScheme.outline),
            ),
          ],
        ),
      ),
    );
  }
}

class _Bubble extends StatelessWidget {
  const _Bubble({required this.comment, required this.names});

  final Comment comment;
  final Map<String, String> names;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(
                names[comment.by] ?? comment.by,
                style: theme.textTheme.labelLarge,
              ),
              const SizedBox(width: 8),
              Text(
                formatRunTime(comment.at),
                style: theme.textTheme.bodySmall
                    ?.copyWith(color: theme.colorScheme.outline),
              ),
            ],
          ),
          const SizedBox(height: 2),
          Text(comment.text, style: theme.textTheme.bodyMedium),
          if (comment.mentions.isNotEmpty) ...[
            const SizedBox(height: 4),
            Wrap(
              spacing: 6,
              children: [
                for (final id in comment.mentions)
                  Chip(
                    label: Text(names[id] ?? id),
                    avatar: const Icon(Icons.alternate_email, size: 14),
                    visualDensity: VisualDensity.compact,
                    materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                  ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}

class _Composer extends StatelessWidget {
  const _Composer({
    required this.controller,
    required this.sending,
    required this.onSend,
  });

  final TextEditingController controller;
  final bool sending;
  final Future<void> Function() onSend;

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      top: false,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(12, 8, 8, 8),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Expanded(
              child: TextField(
                controller: controller,
                minLines: 1,
                maxLines: 4,
                textInputAction: TextInputAction.newline,
                decoration: const InputDecoration(
                  hintText: '说点什么，@姓名 可派给他',
                  border: OutlineInputBorder(),
                  isDense: true,
                ),
              ),
            ),
            const SizedBox(width: 4),
            IconButton(
              icon: sending
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Icon(Icons.send),
              onPressed: sending ? null : onSend,
            ),
          ],
        ),
      ),
    );
  }
}
