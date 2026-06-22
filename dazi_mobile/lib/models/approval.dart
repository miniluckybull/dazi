import 'package:freezed_annotation/freezed_annotation.dart';

part 'approval.freezed.dart';
part 'approval.g.dart';

@freezed
class Approval with _$Approval {
  const factory Approval({
    required String id,
    required String slug,
    required String name,
    required String plan,
    required bool resolved,
    bool? approved,
  }) = _Approval;

  factory Approval.fromJson(Map<String, dynamic> json) =>
      _$ApprovalFromJson(json);
}
