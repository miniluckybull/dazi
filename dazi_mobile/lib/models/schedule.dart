import 'package:freezed_annotation/freezed_annotation.dart';

part 'schedule.freezed.dart';
part 'schedule.g.dart';

@freezed
class Schedule with _$Schedule {
  const factory Schedule({
    @JsonKey(name: 'run_at') String? runAt,
    Interval? interval,
    @JsonKey(name: 'ends_at') String? endsAt,
    @JsonKey(name: 'max_runs') int? maxRuns,
    bool? paused,
    String? action,
    String? model,
  }) = _Schedule;

  factory Schedule.fromJson(Map<String, dynamic> json) =>
      _$ScheduleFromJson(json);
}

@freezed
class Interval with _$Interval {
  const factory Interval({
    required int every,
    required String unit,
  }) = _Interval;

  factory Interval.fromJson(Map<String, dynamic> json) =>
      _$IntervalFromJson(json);
}
