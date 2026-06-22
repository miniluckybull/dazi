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
  }) = _RunRecord;

  factory RunRecord.fromJson(Map<String, dynamic> json) =>
      _$RunRecordFromJson(json);
}
