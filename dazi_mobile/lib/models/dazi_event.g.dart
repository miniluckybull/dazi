// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'dazi_event.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$TaskTriggeredImpl _$$TaskTriggeredImplFromJson(Map<String, dynamic> json) =>
    _$TaskTriggeredImpl(
      slug: json['slug'] as String,
      name: json['name'] as String,
      $type: json['type'] as String?,
    );

Map<String, dynamic> _$$TaskTriggeredImplToJson(_$TaskTriggeredImpl instance) =>
    <String, dynamic>{
      'slug': instance.slug,
      'name': instance.name,
      'type': instance.$type,
    };

_$TaskCompletedImpl _$$TaskCompletedImplFromJson(Map<String, dynamic> json) =>
    _$TaskCompletedImpl(
      slug: json['slug'] as String,
      name: json['name'] as String,
      ok: json['ok'] as bool,
      summary: json['summary'] as String,
      $type: json['type'] as String?,
    );

Map<String, dynamic> _$$TaskCompletedImplToJson(_$TaskCompletedImpl instance) =>
    <String, dynamic>{
      'slug': instance.slug,
      'name': instance.name,
      'ok': instance.ok,
      'summary': instance.summary,
      'type': instance.$type,
    };

_$ApprovalRequestedImpl _$$ApprovalRequestedImplFromJson(
        Map<String, dynamic> json) =>
    _$ApprovalRequestedImpl(
      slug: json['slug'] as String,
      name: json['name'] as String,
      approvalId: json['approvalId'] as String,
      plan: json['plan'] as String,
      $type: json['type'] as String?,
    );

Map<String, dynamic> _$$ApprovalRequestedImplToJson(
        _$ApprovalRequestedImpl instance) =>
    <String, dynamic>{
      'slug': instance.slug,
      'name': instance.name,
      'approvalId': instance.approvalId,
      'plan': instance.plan,
      'type': instance.$type,
    };

_$ApprovalResolvedImpl _$$ApprovalResolvedImplFromJson(
        Map<String, dynamic> json) =>
    _$ApprovalResolvedImpl(
      slug: json['slug'] as String,
      approvalId: json['approvalId'] as String,
      approved: json['approved'] as bool,
      $type: json['type'] as String?,
    );

Map<String, dynamic> _$$ApprovalResolvedImplToJson(
        _$ApprovalResolvedImpl instance) =>
    <String, dynamic>{
      'slug': instance.slug,
      'approvalId': instance.approvalId,
      'approved': instance.approved,
      'type': instance.$type,
    };
