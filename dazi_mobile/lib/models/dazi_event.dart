import 'package:freezed_annotation/freezed_annotation.dart';

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
  }) = TaskCompleted;

  const factory DaziEvent.approvalRequested({
    required String slug,
    required String name,
    required String approvalId,
    required String plan,
  }) = ApprovalRequested;

  const factory DaziEvent.approvalResolved({
    required String slug,
    required String approvalId,
    required bool approved,
  }) = ApprovalResolved;

  factory DaziEvent.fromJson(Map<String, dynamic> json) =>
      _$DaziEventFromJson(json);
}
