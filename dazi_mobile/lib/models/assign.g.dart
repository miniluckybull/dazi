// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'assign.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$AssignmentImpl _$$AssignmentImplFromJson(Map<String, dynamic> json) =>
    _$AssignmentImpl(
      assignee: json['assignee'] as String,
      at: json['at'] as String,
      by: json['by'] as String,
    );

Map<String, dynamic> _$$AssignmentImplToJson(_$AssignmentImpl instance) =>
    <String, dynamic>{
      'assignee': instance.assignee,
      'at': instance.at,
      'by': instance.by,
    };

_$AssignmentRespImpl _$$AssignmentRespImplFromJson(Map<String, dynamic> json) =>
    _$AssignmentRespImpl(
      assignment: json['assignment'] == null
          ? null
          : Assignment.fromJson(json['assignment'] as Map<String, dynamic>),
    );

Map<String, dynamic> _$$AssignmentRespImplToJson(
        _$AssignmentRespImpl instance) =>
    <String, dynamic>{
      'assignment': instance.assignment,
    };

_$AssignedItemImpl _$$AssignedItemImplFromJson(Map<String, dynamic> json) =>
    _$AssignedItemImpl(
      slug: json['slug'] as String,
      name: json['name'] as String,
      assignment:
          Assignment.fromJson(json['assignment'] as Map<String, dynamic>),
    );

Map<String, dynamic> _$$AssignedItemImplToJson(_$AssignedItemImpl instance) =>
    <String, dynamic>{
      'slug': instance.slug,
      'name': instance.name,
      'assignment': instance.assignment,
    };

_$CommentImpl _$$CommentImplFromJson(Map<String, dynamic> json) =>
    _$CommentImpl(
      at: json['at'] as String,
      by: json['by'] as String,
      text: json['text'] as String,
      mentions: (json['mentions'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          const <String>[],
    );

Map<String, dynamic> _$$CommentImplToJson(_$CommentImpl instance) =>
    <String, dynamic>{
      'at': instance.at,
      'by': instance.by,
      'text': instance.text,
      'mentions': instance.mentions,
    };
