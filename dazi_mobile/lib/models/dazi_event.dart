import 'package:freezed_annotation/freezed_annotation.dart';

import 'usage_estimate.dart';

part 'dazi_event.freezed.dart';
part 'dazi_event.g.dart';

@Freezed(unionKey: 'type', unionValueCase: FreezedUnionCase.kebab)
class DaziEvent with _$DaziEvent {
  const factory DaziEvent.taskTriggered({
    required String slug,
    required String name,
  }) = TaskTriggered;

  const factory DaziEvent.taskCompleted({
    required String slug,
    required String name,
    required bool ok,
    required String summary,
    // 运行记录 id 与产物清单；旧 daemon 没有这两个字段，向后兼容默认空。
    @JsonKey(name: 'run_id') @Default('') String runId,
    @Default([]) List<String> artifacts,
  }) = TaskCompleted;

  const factory DaziEvent.approvalRequested({
    required String slug,
    required String name,
    @JsonKey(name: 'approval_id') required String approvalId,
    required String plan,
    // 用量/费用预估；无历史时为 null。
    UsageEstimate? estimate,
  }) = ApprovalRequested;

  const factory DaziEvent.approvalResolved({
    required String slug,
    @JsonKey(name: 'approval_id') required String approvalId,
    required bool approved,
  }) = ApprovalResolved;

  factory DaziEvent.fromJson(Map<String, dynamic> json) =>
      _$DaziEventFromJson(json);
}
