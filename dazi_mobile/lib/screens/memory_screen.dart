import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../api/dazi_api.dart';

final memoryProvider = FutureProvider.family<String, String>((ref, name) async {
  final api = ref.watch(daziApiProvider);
  return api.getMemory(name);
});

class MemoryScreen extends ConsumerStatefulWidget {
  const MemoryScreen({super.key});

  @override
  ConsumerState<MemoryScreen> createState() => _MemoryScreenState();
}

class _MemoryScreenState extends ConsumerState<MemoryScreen>
    with SingleTickerProviderStateMixin {
  late final TabController _tabController;
  final _controllers = <String, TextEditingController>{};
  final _names = const ['profile', 'facts', 'patterns'];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: _names.length, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    for (final c in _controllers.values) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _save(String name) async {
    final controller = _controllers[name];
    if (controller == null) return;
    try {
      await ref.read(daziApiProvider).putMemory(name, controller.text);
      ref.invalidate(memoryProvider(name));
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('$name 已保存')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('保存失败: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('记忆'),
        bottom: TabBar(
          controller: _tabController,
          isScrollable: true,
          tabs: const [
            Tab(text: 'Profile'),
            Tab(text: 'Facts'),
            Tab(text: 'Patterns'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: _names.map((name) => _MemoryEditor(
          name: name,
          controller: _controllers.putIfAbsent(name, () => TextEditingController()),
          onSave: () => _save(name),
        )).toList(),
      ),
    );
  }
}

class _MemoryEditor extends ConsumerWidget {
  const _MemoryEditor({
    required this.name,
    required this.controller,
    required this.onSave,
  });

  final String name;
  final TextEditingController controller;
  final VoidCallback onSave;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final contentAsync = ref.watch(memoryProvider(name));

    return contentAsync.when(
      data: (content) {
        if (controller.text.isEmpty) {
          controller.text = content;
        }
        return Column(
          children: [
            Expanded(
              child: TextField(
                controller: controller,
                maxLines: null,
                expands: true,
                textAlignVertical: TextAlignVertical.top,
                decoration: InputDecoration(
                  hintText: '编辑 $name...',
                  contentPadding: const EdgeInsets.all(16),
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(12),
              child: SizedBox(
                width: double.infinity,
                child: FilledButton(
                  onPressed: onSave,
                  child: const Text('保存'),
                ),
              ),
            ),
          ],
        );
      },
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, _) => Center(child: Text('加载失败: $e')),
    );
  }
}
