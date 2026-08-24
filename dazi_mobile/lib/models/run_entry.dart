import 'package:freezed_annotation/freezed_annotation.dart';

part 'run_entry.freezed.dart';
part 'run_entry.g.dart';

/// GET /runs 列表项：跨项目运行历史（带项目归属）。
@freezed
class RunEntry with _$RunEntry {
  const factory RunEntry({
    required String slug,
    required String name,
    required String at,
    required String action,
    required bool ok,
    String? message,
    String? id,
    String? summary,
    @Default([]) List<String> artifacts,
  }) = _RunEntry;

  factory RunEntry.fromJson(Map<String, dynamic> json) =>
      _$RunEntryFromJson(json);
}
