import 'package:freezed_annotation/freezed_annotation.dart';

part 'member.freezed.dart';
part 'member.g.dart';

/// 团队成员。
///
/// 服务端 role：viewer / member / admin / owner；status：active / suspended。
/// 权限矩阵在服务端，客户端只据 role 决定显示哪些按钮，不做授权判断——
/// 真正的把关在 daemon 的 require(perm)。
@freezed
class Member with _$Member {
  const factory Member({
    required String id,
    required String name,
    required String role,
    required String status,
    @JsonKey(name: 'created_at') String? createdAt,
  }) = _Member;

  factory Member.fromJson(Map<String, dynamic> json) => _$MemberFromJson(json);
}

/// GET /api/v1/me：当前设备对应的身份。
@freezed
class Me with _$Me {
  const factory Me({
    required Member member,
    @JsonKey(name: 'device_id') required String deviceId,
  }) = _Me;

  factory Me.fromJson(Map<String, dynamic> json) => _$MeFromJson(json);
}

/// 客户端侧的角色能力判断，只用于决定「显示不显示」。
///
/// 与服务端 team.rs / roles.ts 的矩阵保持一致：run 与 approve 的门槛都是
/// member，viewer 只读。刻意不在客户端重建完整矩阵——重复实现必然漂移，
/// 授权判断以服务端为准。
extension MemberCapabilities on Member {
  bool get isActive => status == 'active';

  /// 能否推进任务（认领/递交棒、产计划、开终端）。
  bool get canRun => isActive && role != 'viewer';

  /// 能否改任务内容与安排（含指派）。服务端 Permission::Write 门槛同为 member。
  bool get canWrite => isActive && role != 'viewer';

  /// 能否决策审批。
  bool get canApprove => isActive && role != 'viewer';

  /// 能否强收他人的棒 / 管理成员。
  bool get canManageMembers => isActive && (role == 'admin' || role == 'owner');
}
