// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'project_meta.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$ProjectMetaImpl _$$ProjectMetaImplFromJson(Map<String, dynamic> json) =>
    _$ProjectMetaImpl(
      slug: json['slug'] as String,
      name: json['name'] as String,
      status: json['status'] as String,
      priority: json['priority'] as String,
      archived: json['archived'] as bool,
      requiresReferences: json['requiresReferences'] as bool,
      taskType: json['taskType'] as String,
      tags: (json['tags'] as List<dynamic>?)?.map((e) => e as String).toList(),
      startDate: json['start_date'] as String?,
      dueDate: json['due_date'] as String?,
      handedOffAt: json['handed_off_at'] as String?,
      schedule: json['schedule'] == null
          ? null
          : Schedule.fromJson(json['schedule'] as Map<String, dynamic>),
      nextRunAt: json['next_run_at'] as String?,
      lastRunAt: json['last_run_at'] as String?,
      lastRunOk: json['last_run_ok'] as bool?,
      runs: (json['runs'] as List<dynamic>?)
          ?.map((e) => RunRecord.fromJson(e as Map<String, dynamic>))
          .toList(),
    );

Map<String, dynamic> _$$ProjectMetaImplToJson(_$ProjectMetaImpl instance) =>
    <String, dynamic>{
      'slug': instance.slug,
      'name': instance.name,
      'status': instance.status,
      'priority': instance.priority,
      'archived': instance.archived,
      'requiresReferences': instance.requiresReferences,
      'taskType': instance.taskType,
      'tags': instance.tags,
      'start_date': instance.startDate,
      'due_date': instance.dueDate,
      'handed_off_at': instance.handedOffAt,
      'schedule': instance.schedule,
      'next_run_at': instance.nextRunAt,
      'last_run_at': instance.lastRunAt,
      'last_run_ok': instance.lastRunOk,
      'runs': instance.runs,
    };
