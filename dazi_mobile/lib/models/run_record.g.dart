// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'run_record.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$RunRecordImpl _$$RunRecordImplFromJson(Map<String, dynamic> json) =>
    _$RunRecordImpl(
      at: json['at'] as String,
      action: json['action'] as String,
      ok: json['ok'] as bool,
      message: json['message'] as String?,
    );

Map<String, dynamic> _$$RunRecordImplToJson(_$RunRecordImpl instance) =>
    <String, dynamic>{
      'at': instance.at,
      'action': instance.action,
      'ok': instance.ok,
      'message': instance.message,
    };
