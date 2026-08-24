// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'approval.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$ApprovalImpl _$$ApprovalImplFromJson(Map<String, dynamic> json) =>
    _$ApprovalImpl(
      id: json['id'] as String,
      slug: json['slug'] as String,
      name: json['name'] as String,
      plan: json['plan'] as String,
      status: json['status'] as String,
      createdAt: json['created_at'] as String?,
      estimate: json['estimate'] == null
          ? null
          : UsageEstimate.fromJson(json['estimate'] as Map<String, dynamic>),
    );

Map<String, dynamic> _$$ApprovalImplToJson(_$ApprovalImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'slug': instance.slug,
      'name': instance.name,
      'plan': instance.plan,
      'status': instance.status,
      'created_at': instance.createdAt,
      'estimate': instance.estimate,
    };
