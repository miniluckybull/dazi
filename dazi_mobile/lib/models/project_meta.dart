import 'package:freezed_annotation/freezed_annotation.dart';

import 'run_record.dart';
import 'schedule.dart';

part 'project_meta.freezed.dart';
part 'project_meta.g.dart';

@freezed
class ProjectMeta with _$ProjectMeta {
  const factory ProjectMeta({
    required String slug,
    required String name,
    required String status,
    required String priority,
    @Default(false) bool archived,
    @JsonKey(name: 'requires_references') required bool requiresReferences,
    @JsonKey(name: 'task_type') required String taskType,
    List<String>? tags,
    @JsonKey(name: 'start_date') String? startDate,
    @JsonKey(name: 'due_date') String? dueDate,
    @JsonKey(name: 'handed_off_at') String? handedOffAt,
    Schedule? schedule,
    @JsonKey(name: 'on_trigger') OnTrigger? onTrigger,
    @JsonKey(name: 'next_run_at') String? nextRunAt,
    @JsonKey(name: 'last_run_at') String? lastRunAt,
    @JsonKey(name: 'last_run_ok') bool? lastRunOk,
    @JsonKey(name: 'runs') List<RunRecord>? runs,
  }) = _ProjectMeta;

  factory ProjectMeta.fromJson(Map<String, dynamic> json) =>
      _$ProjectMetaFromJson(json);
}
