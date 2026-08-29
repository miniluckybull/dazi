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

  /// 任务被指派/取消指派。`assignee` 为 null 表示取消。
  const factory DaziEvent.taskAssigned({
    required String slug,
    required String name,
    String? assignee,
    required String by,
  }) = TaskAssigned;

  /// 有人评论并 @ 了成员。服务端只在 mentions 非空时推送，
  /// 客户端再判断自己是否在 mentions 里——不在就不该打扰。
  const factory DaziEvent.mentioned({
    required String slug,
    required String name,
    @Default(<String>[]) List<String> mentions,
    required String by,
    required String text,
  }) = Mentioned;

  factory DaziEvent.fromJson(Map<String, dynamic> json) =>
      _$DaziEventFromJson(json);
}
