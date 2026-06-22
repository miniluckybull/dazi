// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'schedule.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$ScheduleImpl _$$ScheduleImplFromJson(Map<String, dynamic> json) =>
    _$ScheduleImpl(
      runAt: json['run_at'] as String?,
      interval: json['interval'] == null
          ? null
          : Interval.fromJson(json['interval'] as Map<String, dynamic>),
      endsAt: json['ends_at'] as String?,
      maxRuns: (json['max_runs'] as num?)?.toInt(),
      paused: json['paused'] as bool?,
      action: json['action'] as String?,
      model: json['model'] as String?,
    );

Map<String, dynamic> _$$ScheduleImplToJson(_$ScheduleImpl instance) =>
    <String, dynamic>{
      'run_at': instance.runAt,
      'interval': instance.interval,
      'ends_at': instance.endsAt,
      'max_runs': instance.maxRuns,
      'paused': instance.paused,
      'action': instance.action,
      'model': instance.model,
    };

_$IntervalImpl _$$IntervalImplFromJson(Map<String, dynamic> json) =>
    _$IntervalImpl(
      every: (json['every'] as num).toInt(),
      unit: json['unit'] as String,
    );

Map<String, dynamic> _$$IntervalImplToJson(_$IntervalImpl instance) =>
    <String, dynamic>{
      'every': instance.every,
      'unit': instance.unit,
    };
