import 'package:freezed_annotation/freezed_annotation.dart';

part 'baton.freezed.dart';
part 'baton.g.dart';

/// 接力棒当前状态。
///
/// 服务端 kind：human / agent。human 时 holder 是 member_id，agent 时是 agent 名。
@freezed
class Baton with _$Baton {
  const factory Baton({
    required String holder,
    required String kind,
    required String since,
    @JsonKey(name: 'expires_at') required String expiresAt,
  }) = _Baton;

  factory Baton.fromJson(Map<String, dynamic> json) => _$BatonFromJson(json);
}

/// GET /api/v1/projects/{slug}/baton 的响应。
///
/// `expired` 让界面能区分「从没人碰过」（baton == null）与
/// 「有人拿了但超时了」（baton != null && expired）——后者是可以直接接管的。
@freezed
class BatonState with _$BatonState {
  const factory BatonState({
    Baton? baton,
    @Default(false) bool expired,
  }) = _BatonState;

  factory BatonState.fromJson(Map<String, dynamic> json) =>
      _$BatonStateFromJson(json);
}

/// relay.jsonl 的一条记录。
///
/// 服务端 action：claim / handoff / release / expire。
/// `by` 是实际写入者，可能不等于 from/to（管理员强收时）。
@freezed
class RelayEntry with _$RelayEntry {
  const factory RelayEntry({
    required String at,
    required String action,
    String? from,
    String? to,
    String? kind,
    String? note,
    required String by,
  }) = _RelayEntry;

  factory RelayEntry.fromJson(Map<String, dynamic> json) =>
      _$RelayEntryFromJson(json);
}

/// 「待我处理」里的一条任务。
@freezed
class InboxItem with _$InboxItem {
  const factory InboxItem({
    required String slug,
    required String name,
    Baton? baton,
    @Default(false) bool expired,
  }) = _InboxItem;

  factory InboxItem.fromJson(Map<String, dynamic> json) =>
      _$InboxItemFromJson(json);
}

/// GET /api/v1/inbox 的响应：棒在我手里的，与可认领的。
@freezed
class Inbox with _$Inbox {
  const factory Inbox({
    @Default(<InboxItem>[]) List<InboxItem> mine,
    @Default(<InboxItem>[]) List<InboxItem> unclaimed,
  }) = _Inbox;

  factory Inbox.fromJson(Map<String, dynamic> json) => _$InboxFromJson(json);
}
