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
      runId: json['run_id'] as String? ?? '',
      artifacts: (json['artifacts'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          const [],
      $type: json['type'] as String?,
    );

Map<String, dynamic> _$$TaskCompletedImplToJson(_$TaskCompletedImpl instance) =>
    <String, dynamic>{
      'slug': instance.slug,
      'name': instance.name,
      'ok': instance.ok,
      'summary': instance.summary,
      'run_id': instance.runId,
      'artifacts': instance.artifacts,
      'type': instance.$type,
    };

_$ApprovalRequestedImpl _$$ApprovalRequestedImplFromJson(
        Map<String, dynamic> json) =>
    _$ApprovalRequestedImpl(
      slug: json['slug'] as String,
      name: json['name'] as String,
      approvalId: json['approval_id'] as String,
      plan: json['plan'] as String,
      estimate: json['estimate'] == null
          ? null
          : UsageEstimate.fromJson(json['estimate'] as Map<String, dynamic>),
      $type: json['type'] as String?,
    );

Map<String, dynamic> _$$ApprovalRequestedImplToJson(
        _$ApprovalRequestedImpl instance) =>
    <String, dynamic>{
      'slug': instance.slug,
      'name': instance.name,
      'approval_id': instance.approvalId,
      'plan': instance.plan,
      'estimate': instance.estimate,
      'type': instance.$type,
    };

_$ApprovalResolvedImpl _$$ApprovalResolvedImplFromJson(
        Map<String, dynamic> json) =>
    _$ApprovalResolvedImpl(
      slug: json['slug'] as String,
      approvalId: json['approval_id'] as String,
      approved: json['approved'] as bool,
      $type: json['type'] as String?,
    );

Map<String, dynamic> _$$ApprovalResolvedImplToJson(
        _$ApprovalResolvedImpl instance) =>
    <String, dynamic>{
      'slug': instance.slug,
      'approval_id': instance.approvalId,
      'approved': instance.approved,
      'type': instance.$type,
    };
