import 'package:freezed_annotation/freezed_annotation.dart';

import 'usage_estimate.dart';

part 'approval.freezed.dart';
part 'approval.g.dart';

@freezed
class Approval with _$Approval {
  const factory Approval({
    required String id,
    required String slug,
    required String name,
    required String plan,
    // 服务端 ApprovalStatus：pending / approved / rejected。
    required String status,
    @JsonKey(name: 'created_at') String? createdAt,
    // 基于历史 usage 的用量/费用预估；无历史时为 null。
    UsageEstimate? estimate,
  }) = _Approval;

  factory Approval.fromJson(Map<String, dynamic> json) =>
      _$ApprovalFromJson(json);
}
