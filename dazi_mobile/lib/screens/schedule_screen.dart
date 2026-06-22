import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../api/dazi_api.dart';
import '../models/schedule.dart' as schedule_models;
import '../providers/project_meta_provider.dart';

class ScheduleScreen extends ConsumerStatefulWidget {
  const ScheduleScreen({super.key, required this.slug});

  final String slug;

  @override
  ConsumerState<ScheduleScreen> createState() => _ScheduleScreenState();
}

class _ScheduleScreenState extends ConsumerState<ScheduleScreen> {
  String _taskType = 'oneoff';
  String _action = 'notify';
  DateTime? _runAt;
  int _every = 1;
  String _unit = 'day';
  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    _loadFromMeta();
  }

  Future<void> _loadFromMeta() async {
    final meta = await ref.read(projectMetaProvider(widget.slug).future);
    if (!mounted) return;
    setState(() {
      _taskType = meta.taskType;
      _action = meta.schedule?.action ?? 'notify';
      _runAt = _parseDateTime(meta.schedule?.runAt);
      _every = meta.schedule?.interval?.every ?? 1;
      _unit = meta.schedule?.interval?.unit ?? 'day';
    });
  }

  DateTime? _parseDateTime(String? value) {
    if (value == null) return null;
    return DateTime.tryParse(value);
  }

  Future<void> _pickRunAt() async {
    final now = DateTime.now();
    final date = await showDatePicker(
      context: context,
      initialDate: _runAt ?? now,
      firstDate: now,
      lastDate: now.add(const Duration(days: 365 * 2)),
    );
    if (date == null || !mounted) return;

    final time = await showTimePicker(
      context: context,
      initialTime: _runAt != null ? TimeOfDay.fromDateTime(_runAt!) : TimeOfDay.now(),
    );
    if (time == null || !mounted) return;

    setState(() {
      _runAt = DateTime(date.year, date.month, date.day, time.hour, time.minute);
    });
  }

  Future<void> _save() async {
    setState(() => _isSaving = true);
    try {
      schedule_models.Schedule schedule;
      if (_taskType == 'oneoff') {
        schedule = schedule_models.Schedule(
          runAt: _runAt?.toUtc().toIso8601String(),
          action: _action,
        );
      } else if (_taskType == 'scheduled') {
        schedule = schedule_models.Schedule(
          runAt: _runAt?.toUtc().toIso8601String(),
          action: _action,
        );
      } else {
        schedule = schedule_models.Schedule(
          interval: schedule_models.Interval(every: _every, unit: _unit),
          action: _action,
        );
      }

      await ref.read(daziApiProvider).putSchedule(widget.slug, schedule);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('调度已保存')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('保存失败: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final metaAsync = ref.watch(projectMetaProvider(widget.slug));

    return Scaffold(
      appBar: AppBar(title: const Text('调度设置')),
      body: metaAsync.when(
        data: (_) => _buildForm(theme),
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('加载失败: $e')),
      ),
    );
  }

  Widget _buildForm(ThemeData theme) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          _buildSegmentedControl(
            label: '任务类型',
            value: _taskType,
            options: const [
              ('oneoff', '单次'),
              ('scheduled', '定时'),
              ('recurring', '循环'),
            ],
            onChanged: (v) => setState(() => _taskType = v),
          ),
          const SizedBox(height: 16),
          _buildSegmentedControl(
            label: '触发动作',
            value: _action,
            options: const [
              ('notify', '通知'),
              ('autopilot', '自动执行'),
            ],
            onChanged: (v) => setState(() => _action = v),
          ),
          const SizedBox(height: 16),
          if (_taskType != 'recurring') ...[
            ListTile(
              contentPadding: EdgeInsets.zero,
              title: const Text('运行时间'),
              subtitle: Text(_runAt?.toLocal().toString() ?? '未选择'),
              trailing: const Icon(Icons.calendar_today),
              onTap: _pickRunAt,
            ),
            const SizedBox(height: 16),
          ],
          if (_taskType == 'recurring') ...[
            Row(
              children: [
                Expanded(
                  flex: 2,
                  child: TextField(
                    decoration: const InputDecoration(labelText: '间隔'),
                    keyboardType: TextInputType.number,
                    controller: TextEditingController(text: _every.toString()),
                    onChanged: (v) => setState(() => _every = int.tryParse(v) ?? 1),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  flex: 3,
                  child: DropdownButtonFormField<String>(
                    decoration: const InputDecoration(labelText: '单位'),
                    value: _unit,
                    items: const [
                      DropdownMenuItem(value: 'minute', child: Text('分钟')),
                      DropdownMenuItem(value: 'hour', child: Text('小时')),
                      DropdownMenuItem(value: 'day', child: Text('天')),
                      DropdownMenuItem(value: 'week', child: Text('周')),
                      DropdownMenuItem(value: 'month', child: Text('月')),
                    ],
                    onChanged: (v) => setState(() => _unit = v ?? 'day'),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
          ],
          FilledButton(
            onPressed: _isSaving ? null : _save,
            child: _isSaving
                ? const SizedBox(height: 18, width: 18, child: CircularProgressIndicator(strokeWidth: 2))
                : const Text('保存'),
          ),
        ],
      ),
    );
  }

  Widget _buildSegmentedControl({
    required String label,
    required String value,
    required List<(String, String)> options,
    required ValueChanged<String> onChanged,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: Theme.of(context).textTheme.titleSmall),
        const SizedBox(height: 8),
        Row(
          children: options.map((option) {
            final selected = option.$1 == value;
            return Expanded(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 4),
                child: ChoiceChip(
                  label: Text(option.$2),
                  selected: selected,
                  onSelected: (_) => onChanged(option.$1),
                ),
              ),
            );
          }).toList(),
        ),
      ],
    );
  }
}
