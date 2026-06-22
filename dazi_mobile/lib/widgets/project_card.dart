import 'package:flutter/material.dart';

import '../models/project_summary.dart';

class ProjectCard extends StatelessWidget {
  const ProjectCard({super.key, required this.project, required this.onTap});

  final ProjectSummary project;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      project.name,
                      style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600),
                    ),
                  ),
                  _TaskTypeChip(type: project.taskType),
                ],
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  _StatusChip(status: project.status),
                  const SizedBox(width: 8),
                  _PriorityChip(priority: project.priority),
                ],
              ),
              if (project.nextRunAt != null) ...[
                const SizedBox(height: 8),
                Text(
                  '下次运行: ${project.nextRunAt}',
                  style: theme.textTheme.bodySmall?.copyWith(color: colorScheme.outline),
                ),
              ],
              if (project.lastRunAt != null) ...[
                const SizedBox(height: 4),
                Text(
                  '上次运行: ${project.lastRunAt} ${project.lastRunOk == true ? '✓' : project.lastRunOk == false ? '✗' : ''}',
                  style: theme.textTheme.bodySmall?.copyWith(color: colorScheme.outline),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class _TaskTypeChip extends StatelessWidget {
  const _TaskTypeChip({required this.type});

  final String type;

  @override
  Widget build(BuildContext context) {
    final label = switch (type) {
      'oneoff' => '单次',
      'scheduled' => '定时',
      'recurring' => '循环',
      _ => type,
    };
    return Chip(
      label: Text(label),
      visualDensity: VisualDensity.compact,
      padding: EdgeInsets.zero,
    );
  }
}

class _StatusChip extends StatelessWidget {
  const _StatusChip({required this.status});

  final String status;

  @override
  Widget build(BuildContext context) {
    final color = switch (status) {
      'todo' => Colors.grey,
      'in_progress' => Colors.orange,
      'done' => Colors.green,
      _ => Colors.blue,
    };
    return _MiniChip(label: status, color: color);
  }
}

class _PriorityChip extends StatelessWidget {
  const _PriorityChip({required this.priority});

  final String priority;

  @override
  Widget build(BuildContext context) {
    final color = switch (priority) {
      'high' => Colors.red,
      'low' => Colors.blue,
      _ => Colors.grey,
    };
    return _MiniChip(label: priority, color: color);
  }
}

class _MiniChip extends StatelessWidget {
  const _MiniChip({required this.label, required this.color});

  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(
        label,
        style: TextStyle(color: color, fontSize: 12, fontWeight: FontWeight.w500),
      ),
    );
  }
}
