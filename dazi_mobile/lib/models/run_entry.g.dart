// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'run_entry.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$RunEntryImpl _$$RunEntryImplFromJson(Map<String, dynamic> json) =>
    _$RunEntryImpl(
      slug: json['slug'] as String,
      name: json['name'] as String,
      at: json['at'] as String,
      action: json['action'] as String,
      ok: json['ok'] as bool,
      message: json['message'] as String?,
      id: json['id'] as String?,
      summary: json['summary'] as String?,
      artifacts: (json['artifacts'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          const [],
    );

Map<String, dynamic> _$$RunEntryImplToJson(_$RunEntryImpl instance) =>
    <String, dynamic>{
      'slug': instance.slug,
      'name': instance.name,
      'at': instance.at,
      'action': instance.action,
      'ok': instance.ok,
      'message': instance.message,
      'id': instance.id,
      'summary': instance.summary,
      'artifacts': instance.artifacts,
    };
