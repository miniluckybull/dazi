// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'project_summary.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$ProjectSummaryImpl _$$ProjectSummaryImplFromJson(Map<String, dynamic> json) =>
    _$ProjectSummaryImpl(
      slug: json['slug'] as String,
      name: json['name'] as String,
      status: json['status'] as String,
      priority: json['priority'] as String,
      archived: json['archived'] as bool,
      requiresReferences: json['requiresReferences'] as bool,
      hasReferences: json['hasReferences'] as bool,
      taskType: json['taskType'] as String,
      handedOffAt: json['handed_off_at'] as String?,
      nextRunAt: json['next_run_at'] as String?,
      lastRunAt: json['last_run_at'] as String?,
      lastRunOk: json['last_run_ok'] as bool?,
      tags: (json['tags'] as List<dynamic>?)?.map((e) => e as String).toList(),
    );

Map<String, dynamic> _$$ProjectSummaryImplToJson(
        _$ProjectSummaryImpl instance) =>
    <String, dynamic>{
      'slug': instance.slug,
      'name': instance.name,
      'status': instance.status,
      'priority': instance.priority,
      'archived': instance.archived,
      'requiresReferences': instance.requiresReferences,
      'hasReferences': instance.hasReferences,
      'taskType': instance.taskType,
      'handed_off_at': instance.handedOffAt,
      'next_run_at': instance.nextRunAt,
      'last_run_at': instance.lastRunAt,
      'last_run_ok': instance.lastRunOk,
      'tags': instance.tags,
    };
