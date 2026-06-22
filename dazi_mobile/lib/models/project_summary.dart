import 'package:freezed_annotation/freezed_annotation.dart';

part 'project_summary.freezed.dart';
part 'project_summary.g.dart';

@freezed
class ProjectSummary with _$ProjectSummary {
  const factory ProjectSummary({
    required String slug,
    required String name,
    required String status,
    required String priority,
    required bool archived,
    required bool requiresReferences,
    required bool hasReferences,
    required String taskType,
    @JsonKey(name: 'handed_off_at') String? handedOffAt,
    @JsonKey(name: 'next_run_at') String? nextRunAt,
    @JsonKey(name: 'last_run_at') String? lastRunAt,
    @JsonKey(name: 'last_run_ok') bool? lastRunOk,
    List<String>? tags,
  }) = _ProjectSummary;

  factory ProjectSummary.fromJson(Map<String, dynamic> json) =>
      _$ProjectSummaryFromJson(json);
}
