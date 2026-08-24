import 'package:freezed_annotation/freezed_annotation.dart';

part 'run_record.freezed.dart';
part 'run_record.g.dart';

@freezed
class RunRecord with _$RunRecord {
  const factory RunRecord({
    required String at,
    required String action,
    required bool ok,
    String? message,
    // 运行 id、结尾摘要、产物清单均为后端新增字段；老记录没有，向后兼容。
    String? id,
    String? summary,
    @Default([]) List<String> artifacts,
  }) = _RunRecord;

  factory RunRecord.fromJson(Map<String, dynamic> json) =>
      _$RunRecordFromJson(json);
}
