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
      resolved: json['resolved'] as bool,
      approved: json['approved'] as bool?,
    );

Map<String, dynamic> _$$ApprovalImplToJson(_$ApprovalImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'slug': instance.slug,
      'name': instance.name,
      'plan': instance.plan,
      'resolved': instance.resolved,
      'approved': instance.approved,
    };
