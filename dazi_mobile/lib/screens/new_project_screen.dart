import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../api/dazi_api.dart';
import '../providers/approvals_provider.dart';
import '../providers/projects_provider.dart';

/// 场景模板：选中后填充描述骨架（目标/范围/输出格式/约束）。
const _templates = <String, String>{
  '调研报告': '''# 目标
调研 {主题} 的现状与趋势，给出结论与建议。

# 范围
- 时间范围：最近一年
- 重点关注：

# 输出格式
Markdown 报告，保存为 report.md，包含摘要、要点、参考来源。

# 约束
- 不修改本任务目录之外的文件
''',
  '数据处理': '''# 目标
处理 {数据文件}，产出 {结果}。

# 范围
- 输入：本任务目录下的数据文件
- 处理步骤：

# 输出格式
结果保存为 output/ 下的 CSV/Markdown 文件。

# 约束
- 保留原始数据，不做破坏性修改
''',
  '日报周报': '''# 目标
汇总 {时间范围} 的 {内容来源}，生成日报/周报。

# 范围
- 数据来源：
- 统计维度：

# 输出格式
Markdown 文档，保存为 report.md，包含概览、明细、待办。

# 约束
- 数据缺失时在报告中注明
''',
  '代码任务': '''# 目标
在 {仓库/模块} 中实现/修复 {需求}。

# 范围
- 涉及的目录/文件：
- 不改动的部分：

# 输出格式
直接修改代码，并在 summary.md 中说明改动点与验证方式。

# 约束
- 遵循项目现有代码风格
- 不提交 git
''',
};

class NewProjectScreen extends ConsumerStatefulWidget {
  const NewProjectScreen({super.key});

  @override
  ConsumerState<NewProjectScreen> createState() => _NewProjectScreenState();
}

class _NewProjectScreenState extends ConsumerState<NewProjectScreen> {
  final _nameController = TextEditingController();
  final _descController = TextEditingController();
  String? _selectedTemplate;
  bool _planFirst = false;
  bool _submitting = false;

  @override
  void dispose() {
    _nameController.dispose();
    _descController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final name = _nameController.text.trim();
    if (name.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('请填写任务名称')),
      );
      return;
    }
    setState(() => _submitting = true);
    try {
      final api = ref.read(daziApiProvider);
      final project = await api.createProject(name);
      final desc = _descController.text.trim();
      if (desc.isNotEmpty) {
        await api.putReadme(project.slug, desc);
      }
      if (!mounted) return;
      if (_planFirst) {
        // 先出计划：产计划登记待批后跳审批详情。
        final approval = await api.createPlan(project.slug);
        await ref.read(approvalsProvider.notifier).refresh();
        if (!mounted) return;
        context.go(
          '/approvals/${Uri.encodeComponent(project.slug)}/${Uri.encodeComponent(approval.id)}',
        );
      } else {
        await ref.read(projectsProvider.notifier).refresh();
        if (!mounted) return;
        context.pop();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('创建失败: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(title: const Text('新建任务')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          TextField(
            controller: _nameController,
            decoration: const InputDecoration(
              labelText: '任务名称',
              hintText: '例如：竞品调研报告',
            ),
            enabled: !_submitting,
          ),
          const SizedBox(height: 16),
          Text('场景模板', style: theme.textTheme.labelLarge),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            runSpacing: 4,
            children: [
              for (final entry in _templates.entries)
                ChoiceChip(
                  label: Text(entry.key),
                  selected: _selectedTemplate == entry.key,
                  onSelected: _submitting
                      ? null
                      : (_) => setState(() {
                            _selectedTemplate = entry.key;
                            _descController.text = entry.value;
                          }),
                ),
            ],
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _descController,
            maxLines: 10,
            minLines: 5,
            textAlignVertical: TextAlignVertical.top,
            decoration: const InputDecoration(
              labelText: '需求描述',
              hintText: '一句话或详细描述，会写入任务 README',
              alignLabelWithHint: true,
            ),
            enabled: !_submitting,
          ),
          const SizedBox(height: 8),
          SwitchListTile(
            title: const Text('先出计划给我确认'),
            subtitle: const Text('开启后创建任务并生成执行计划，批准后才真正执行'),
            value: _planFirst,
            onChanged: _submitting ? null : (v) => setState(() => _planFirst = v),
            contentPadding: EdgeInsets.zero,
          ),
          const SizedBox(height: 16),
          FilledButton(
            onPressed: _submitting ? null : _submit,
            child: _submitting
                ? const SizedBox(
                    height: 18,
                    width: 18,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : Text(_planFirst ? '创建并生成计划' : '创建任务'),
          ),
          if (_submitting && _planFirst) ...[
            const SizedBox(height: 12),
            Text(
              '正在生成计划，可能需要几分钟…',
              textAlign: TextAlign.center,
              style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.outline),
            ),
          ],
        ],
      ),
    );
  }
}
