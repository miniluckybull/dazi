import 'package:freezed_annotation/freezed_annotation.dart';

part 'assign.freezed.dart';
part 'assign.g.dart';

/// 任务指派。与接力棒是两件事：
/// 棒是「现在谁在动手」（抢占、有 TTL、空着是常态），
/// 指派是「这活归谁负责」（不过期，通常几天不变）。
/// 一个活可以归我但棒在别人手里——他在帮我推进。
@freezed
class Assignment with _$Assignment {
  const factory Assignment({
    required String assignee,
    required String at,
    required String by,
  }) = _Assignment;

  factory Assignment.fromJson(Map<String, dynamic> json) =>
      _$AssignmentFromJson(json);
}

/// GET /api/v1/projects/{slug}/assignee 的响应。
/// `assignment == null` 表示未指派。
@freezed
class AssignmentResp with _$AssignmentResp {
  const factory AssignmentResp({Assignment? assignment}) = _AssignmentResp;

  factory AssignmentResp.fromJson(Map<String, dynamic> json) =>
      _$AssignmentRespFromJson(json);
}

/// 「指派给我的」里的一条。
@freezed
class AssignedItem with _$AssignedItem {
  const factory AssignedItem({
    required String slug,
    required String name,
    required Assignment assignment,
  }) = _AssignedItem;

  factory AssignedItem.fromJson(Map<String, dynamic> json) =>
      _$AssignedItemFromJson(json);
}

/// 一条评论。`mentions` 由**服务端**解析出的 member_id 列表——
/// 客户端不自己匹配 @：中文名无词边界，两端各写一套规则必然漂移，
/// 而漂移的后果是「我 @ 了他但他没收到通知」。
@freezed
class Comment with _$Comment {
  const factory Comment({
    required String at,
    required String by,
    required String text,
    @Default(<String>[]) List<String> mentions,
  }) = _Comment;

  factory Comment.fromJson(Map<String, dynamic> json) =>
      _$CommentFromJson(json);
}
