// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'member.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$MemberImpl _$$MemberImplFromJson(Map<String, dynamic> json) => _$MemberImpl(
      id: json['id'] as String,
      name: json['name'] as String,
      role: json['role'] as String,
      status: json['status'] as String,
      createdAt: json['created_at'] as String?,
    );

Map<String, dynamic> _$$MemberImplToJson(_$MemberImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'name': instance.name,
      'role': instance.role,
      'status': instance.status,
      'created_at': instance.createdAt,
    };

_$MeImpl _$$MeImplFromJson(Map<String, dynamic> json) => _$MeImpl(
      member: Member.fromJson(json['member'] as Map<String, dynamic>),
      deviceId: json['device_id'] as String,
    );

Map<String, dynamic> _$$MeImplToJson(_$MeImpl instance) => <String, dynamic>{
      'member': instance.member,
      'device_id': instance.deviceId,
    };
