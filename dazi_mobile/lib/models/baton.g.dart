// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'baton.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$BatonImpl _$$BatonImplFromJson(Map<String, dynamic> json) => _$BatonImpl(
      holder: json['holder'] as String,
      kind: json['kind'] as String,
      since: json['since'] as String,
      expiresAt: json['expires_at'] as String,
    );

Map<String, dynamic> _$$BatonImplToJson(_$BatonImpl instance) =>
    <String, dynamic>{
      'holder': instance.holder,
      'kind': instance.kind,
      'since': instance.since,
      'expires_at': instance.expiresAt,
    };

_$BatonStateImpl _$$BatonStateImplFromJson(Map<String, dynamic> json) =>
    _$BatonStateImpl(
      baton: json['baton'] == null
          ? null
          : Baton.fromJson(json['baton'] as Map<String, dynamic>),
      expired: json['expired'] as bool? ?? false,
    );

Map<String, dynamic> _$$BatonStateImplToJson(_$BatonStateImpl instance) =>
    <String, dynamic>{
      'baton': instance.baton,
      'expired': instance.expired,
    };

_$RelayEntryImpl _$$RelayEntryImplFromJson(Map<String, dynamic> json) =>
    _$RelayEntryImpl(
      at: json['at'] as String,
      action: json['action'] as String,
      from: json['from'] as String?,
      to: json['to'] as String?,
      kind: json['kind'] as String?,
      note: json['note'] as String?,
      by: json['by'] as String,
    );

Map<String, dynamic> _$$RelayEntryImplToJson(_$RelayEntryImpl instance) =>
    <String, dynamic>{
      'at': instance.at,
      'action': instance.action,
      'from': instance.from,
      'to': instance.to,
      'kind': instance.kind,
      'note': instance.note,
      'by': instance.by,
    };

_$InboxItemImpl _$$InboxItemImplFromJson(Map<String, dynamic> json) =>
    _$InboxItemImpl(
      slug: json['slug'] as String,
      name: json['name'] as String,
      baton: json['baton'] == null
          ? null
          : Baton.fromJson(json['baton'] as Map<String, dynamic>),
      expired: json['expired'] as bool? ?? false,
    );

Map<String, dynamic> _$$InboxItemImplToJson(_$InboxItemImpl instance) =>
    <String, dynamic>{
      'slug': instance.slug,
      'name': instance.name,
      'baton': instance.baton,
      'expired': instance.expired,
    };

_$InboxImpl _$$InboxImplFromJson(Map<String, dynamic> json) => _$InboxImpl(
      mine: (json['mine'] as List<dynamic>?)
              ?.map((e) => InboxItem.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const <InboxItem>[],
      unclaimed: (json['unclaimed'] as List<dynamic>?)
              ?.map((e) => InboxItem.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const <InboxItem>[],
    );

Map<String, dynamic> _$$InboxImplToJson(_$InboxImpl instance) =>
    <String, dynamic>{
      'mine': instance.mine,
      'unclaimed': instance.unclaimed,
    };
