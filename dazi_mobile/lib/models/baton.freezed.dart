// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'baton.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
    'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models');

Baton _$BatonFromJson(Map<String, dynamic> json) {
  return _Baton.fromJson(json);
}

/// @nodoc
mixin _$Baton {
  String get holder => throw _privateConstructorUsedError;
  String get kind => throw _privateConstructorUsedError;
  String get since => throw _privateConstructorUsedError;
  @JsonKey(name: 'expires_at')
  String get expiresAt => throw _privateConstructorUsedError;

  /// Serializes this Baton to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of Baton
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $BatonCopyWith<Baton> get copyWith => throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $BatonCopyWith<$Res> {
  factory $BatonCopyWith(Baton value, $Res Function(Baton) then) =
      _$BatonCopyWithImpl<$Res, Baton>;
  @useResult
  $Res call(
      {String holder,
      String kind,
      String since,
      @JsonKey(name: 'expires_at') String expiresAt});
}

/// @nodoc
class _$BatonCopyWithImpl<$Res, $Val extends Baton>
    implements $BatonCopyWith<$Res> {
  _$BatonCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of Baton
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? holder = null,
    Object? kind = null,
    Object? since = null,
    Object? expiresAt = null,
  }) {
    return _then(_value.copyWith(
      holder: null == holder
          ? _value.holder
          : holder // ignore: cast_nullable_to_non_nullable
              as String,
      kind: null == kind
          ? _value.kind
          : kind // ignore: cast_nullable_to_non_nullable
              as String,
      since: null == since
          ? _value.since
          : since // ignore: cast_nullable_to_non_nullable
              as String,
      expiresAt: null == expiresAt
          ? _value.expiresAt
          : expiresAt // ignore: cast_nullable_to_non_nullable
              as String,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$BatonImplCopyWith<$Res> implements $BatonCopyWith<$Res> {
  factory _$$BatonImplCopyWith(
          _$BatonImpl value, $Res Function(_$BatonImpl) then) =
      __$$BatonImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {String holder,
      String kind,
      String since,
      @JsonKey(name: 'expires_at') String expiresAt});
}

/// @nodoc
class __$$BatonImplCopyWithImpl<$Res>
    extends _$BatonCopyWithImpl<$Res, _$BatonImpl>
    implements _$$BatonImplCopyWith<$Res> {
  __$$BatonImplCopyWithImpl(
      _$BatonImpl _value, $Res Function(_$BatonImpl) _then)
      : super(_value, _then);

  /// Create a copy of Baton
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? holder = null,
    Object? kind = null,
    Object? since = null,
    Object? expiresAt = null,
  }) {
    return _then(_$BatonImpl(
      holder: null == holder
          ? _value.holder
          : holder // ignore: cast_nullable_to_non_nullable
              as String,
      kind: null == kind
          ? _value.kind
          : kind // ignore: cast_nullable_to_non_nullable
              as String,
      since: null == since
          ? _value.since
          : since // ignore: cast_nullable_to_non_nullable
              as String,
      expiresAt: null == expiresAt
          ? _value.expiresAt
          : expiresAt // ignore: cast_nullable_to_non_nullable
              as String,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$BatonImpl implements _Baton {
  const _$BatonImpl(
      {required this.holder,
      required this.kind,
      required this.since,
      @JsonKey(name: 'expires_at') required this.expiresAt});

  factory _$BatonImpl.fromJson(Map<String, dynamic> json) =>
      _$$BatonImplFromJson(json);

  @override
  final String holder;
  @override
  final String kind;
  @override
  final String since;
  @override
  @JsonKey(name: 'expires_at')
  final String expiresAt;

  @override
  String toString() {
    return 'Baton(holder: $holder, kind: $kind, since: $since, expiresAt: $expiresAt)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$BatonImpl &&
            (identical(other.holder, holder) || other.holder == holder) &&
            (identical(other.kind, kind) || other.kind == kind) &&
            (identical(other.since, since) || other.since == since) &&
            (identical(other.expiresAt, expiresAt) ||
                other.expiresAt == expiresAt));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(runtimeType, holder, kind, since, expiresAt);

  /// Create a copy of Baton
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$BatonImplCopyWith<_$BatonImpl> get copyWith =>
      __$$BatonImplCopyWithImpl<_$BatonImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$BatonImplToJson(
      this,
    );
  }
}

abstract class _Baton implements Baton {
  const factory _Baton(
          {required final String holder,
          required final String kind,
          required final String since,
          @JsonKey(name: 'expires_at') required final String expiresAt}) =
      _$BatonImpl;

  factory _Baton.fromJson(Map<String, dynamic> json) = _$BatonImpl.fromJson;

  @override
  String get holder;
  @override
  String get kind;
  @override
  String get since;
  @override
  @JsonKey(name: 'expires_at')
  String get expiresAt;

  /// Create a copy of Baton
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$BatonImplCopyWith<_$BatonImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

BatonState _$BatonStateFromJson(Map<String, dynamic> json) {
  return _BatonState.fromJson(json);
}

/// @nodoc
mixin _$BatonState {
  Baton? get baton => throw _privateConstructorUsedError;
  bool get expired => throw _privateConstructorUsedError;

  /// Serializes this BatonState to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of BatonState
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $BatonStateCopyWith<BatonState> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $BatonStateCopyWith<$Res> {
  factory $BatonStateCopyWith(
          BatonState value, $Res Function(BatonState) then) =
      _$BatonStateCopyWithImpl<$Res, BatonState>;
  @useResult
  $Res call({Baton? baton, bool expired});

  $BatonCopyWith<$Res>? get baton;
}

/// @nodoc
class _$BatonStateCopyWithImpl<$Res, $Val extends BatonState>
    implements $BatonStateCopyWith<$Res> {
  _$BatonStateCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of BatonState
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? baton = freezed,
    Object? expired = null,
  }) {
    return _then(_value.copyWith(
      baton: freezed == baton
          ? _value.baton
          : baton // ignore: cast_nullable_to_non_nullable
              as Baton?,
      expired: null == expired
          ? _value.expired
          : expired // ignore: cast_nullable_to_non_nullable
              as bool,
    ) as $Val);
  }

  /// Create a copy of BatonState
  /// with the given fields replaced by the non-null parameter values.
  @override
  @pragma('vm:prefer-inline')
  $BatonCopyWith<$Res>? get baton {
    if (_value.baton == null) {
      return null;
    }

    return $BatonCopyWith<$Res>(_value.baton!, (value) {
      return _then(_value.copyWith(baton: value) as $Val);
    });
  }
}

/// @nodoc
abstract class _$$BatonStateImplCopyWith<$Res>
    implements $BatonStateCopyWith<$Res> {
  factory _$$BatonStateImplCopyWith(
          _$BatonStateImpl value, $Res Function(_$BatonStateImpl) then) =
      __$$BatonStateImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({Baton? baton, bool expired});

  @override
  $BatonCopyWith<$Res>? get baton;
}

/// @nodoc
class __$$BatonStateImplCopyWithImpl<$Res>
    extends _$BatonStateCopyWithImpl<$Res, _$BatonStateImpl>
    implements _$$BatonStateImplCopyWith<$Res> {
  __$$BatonStateImplCopyWithImpl(
      _$BatonStateImpl _value, $Res Function(_$BatonStateImpl) _then)
      : super(_value, _then);

  /// Create a copy of BatonState
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? baton = freezed,
    Object? expired = null,
  }) {
    return _then(_$BatonStateImpl(
      baton: freezed == baton
          ? _value.baton
          : baton // ignore: cast_nullable_to_non_nullable
              as Baton?,
      expired: null == expired
          ? _value.expired
          : expired // ignore: cast_nullable_to_non_nullable
              as bool,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$BatonStateImpl implements _BatonState {
  const _$BatonStateImpl({this.baton, this.expired = false});

  factory _$BatonStateImpl.fromJson(Map<String, dynamic> json) =>
      _$$BatonStateImplFromJson(json);

  @override
  final Baton? baton;
  @override
  @JsonKey()
  final bool expired;

  @override
  String toString() {
    return 'BatonState(baton: $baton, expired: $expired)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$BatonStateImpl &&
            (identical(other.baton, baton) || other.baton == baton) &&
            (identical(other.expired, expired) || other.expired == expired));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(runtimeType, baton, expired);

  /// Create a copy of BatonState
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$BatonStateImplCopyWith<_$BatonStateImpl> get copyWith =>
      __$$BatonStateImplCopyWithImpl<_$BatonStateImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$BatonStateImplToJson(
      this,
    );
  }
}

abstract class _BatonState implements BatonState {
  const factory _BatonState({final Baton? baton, final bool expired}) =
      _$BatonStateImpl;

  factory _BatonState.fromJson(Map<String, dynamic> json) =
      _$BatonStateImpl.fromJson;

  @override
  Baton? get baton;
  @override
  bool get expired;

  /// Create a copy of BatonState
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$BatonStateImplCopyWith<_$BatonStateImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

RelayEntry _$RelayEntryFromJson(Map<String, dynamic> json) {
  return _RelayEntry.fromJson(json);
}

/// @nodoc
mixin _$RelayEntry {
  String get at => throw _privateConstructorUsedError;
  String get action => throw _privateConstructorUsedError;
  String? get from => throw _privateConstructorUsedError;
  String? get to => throw _privateConstructorUsedError;
  String? get kind => throw _privateConstructorUsedError;
  String? get note => throw _privateConstructorUsedError;
  String get by => throw _privateConstructorUsedError;

  /// Serializes this RelayEntry to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of RelayEntry
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $RelayEntryCopyWith<RelayEntry> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $RelayEntryCopyWith<$Res> {
  factory $RelayEntryCopyWith(
          RelayEntry value, $Res Function(RelayEntry) then) =
      _$RelayEntryCopyWithImpl<$Res, RelayEntry>;
  @useResult
  $Res call(
      {String at,
      String action,
      String? from,
      String? to,
      String? kind,
      String? note,
      String by});
}

/// @nodoc
class _$RelayEntryCopyWithImpl<$Res, $Val extends RelayEntry>
    implements $RelayEntryCopyWith<$Res> {
  _$RelayEntryCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of RelayEntry
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? at = null,
    Object? action = null,
    Object? from = freezed,
    Object? to = freezed,
    Object? kind = freezed,
    Object? note = freezed,
    Object? by = null,
  }) {
    return _then(_value.copyWith(
      at: null == at
          ? _value.at
          : at // ignore: cast_nullable_to_non_nullable
              as String,
      action: null == action
          ? _value.action
          : action // ignore: cast_nullable_to_non_nullable
              as String,
      from: freezed == from
          ? _value.from
          : from // ignore: cast_nullable_to_non_nullable
              as String?,
      to: freezed == to
          ? _value.to
          : to // ignore: cast_nullable_to_non_nullable
              as String?,
      kind: freezed == kind
          ? _value.kind
          : kind // ignore: cast_nullable_to_non_nullable
              as String?,
      note: freezed == note
          ? _value.note
          : note // ignore: cast_nullable_to_non_nullable
              as String?,
      by: null == by
          ? _value.by
          : by // ignore: cast_nullable_to_non_nullable
              as String,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$RelayEntryImplCopyWith<$Res>
    implements $RelayEntryCopyWith<$Res> {
  factory _$$RelayEntryImplCopyWith(
          _$RelayEntryImpl value, $Res Function(_$RelayEntryImpl) then) =
      __$$RelayEntryImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {String at,
      String action,
      String? from,
      String? to,
      String? kind,
      String? note,
      String by});
}

/// @nodoc
class __$$RelayEntryImplCopyWithImpl<$Res>
    extends _$RelayEntryCopyWithImpl<$Res, _$RelayEntryImpl>
    implements _$$RelayEntryImplCopyWith<$Res> {
  __$$RelayEntryImplCopyWithImpl(
      _$RelayEntryImpl _value, $Res Function(_$RelayEntryImpl) _then)
      : super(_value, _then);

  /// Create a copy of RelayEntry
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? at = null,
    Object? action = null,
    Object? from = freezed,
    Object? to = freezed,
    Object? kind = freezed,
    Object? note = freezed,
    Object? by = null,
  }) {
    return _then(_$RelayEntryImpl(
      at: null == at
          ? _value.at
          : at // ignore: cast_nullable_to_non_nullable
              as String,
      action: null == action
          ? _value.action
          : action // ignore: cast_nullable_to_non_nullable
              as String,
      from: freezed == from
          ? _value.from
          : from // ignore: cast_nullable_to_non_nullable
              as String?,
      to: freezed == to
          ? _value.to
          : to // ignore: cast_nullable_to_non_nullable
              as String?,
      kind: freezed == kind
          ? _value.kind
          : kind // ignore: cast_nullable_to_non_nullable
              as String?,
      note: freezed == note
          ? _value.note
          : note // ignore: cast_nullable_to_non_nullable
              as String?,
      by: null == by
          ? _value.by
          : by // ignore: cast_nullable_to_non_nullable
              as String,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$RelayEntryImpl implements _RelayEntry {
  const _$RelayEntryImpl(
      {required this.at,
      required this.action,
      this.from,
      this.to,
      this.kind,
      this.note,
      required this.by});

  factory _$RelayEntryImpl.fromJson(Map<String, dynamic> json) =>
      _$$RelayEntryImplFromJson(json);

  @override
  final String at;
  @override
  final String action;
  @override
  final String? from;
  @override
  final String? to;
  @override
  final String? kind;
  @override
  final String? note;
  @override
  final String by;

  @override
  String toString() {
    return 'RelayEntry(at: $at, action: $action, from: $from, to: $to, kind: $kind, note: $note, by: $by)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$RelayEntryImpl &&
            (identical(other.at, at) || other.at == at) &&
            (identical(other.action, action) || other.action == action) &&
            (identical(other.from, from) || other.from == from) &&
            (identical(other.to, to) || other.to == to) &&
            (identical(other.kind, kind) || other.kind == kind) &&
            (identical(other.note, note) || other.note == note) &&
            (identical(other.by, by) || other.by == by));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode =>
      Object.hash(runtimeType, at, action, from, to, kind, note, by);

  /// Create a copy of RelayEntry
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$RelayEntryImplCopyWith<_$RelayEntryImpl> get copyWith =>
      __$$RelayEntryImplCopyWithImpl<_$RelayEntryImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$RelayEntryImplToJson(
      this,
    );
  }
}

abstract class _RelayEntry implements RelayEntry {
  const factory _RelayEntry(
      {required final String at,
      required final String action,
      final String? from,
      final String? to,
      final String? kind,
      final String? note,
      required final String by}) = _$RelayEntryImpl;

  factory _RelayEntry.fromJson(Map<String, dynamic> json) =
      _$RelayEntryImpl.fromJson;

  @override
  String get at;
  @override
  String get action;
  @override
  String? get from;
  @override
  String? get to;
  @override
  String? get kind;
  @override
  String? get note;
  @override
  String get by;

  /// Create a copy of RelayEntry
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$RelayEntryImplCopyWith<_$RelayEntryImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

InboxItem _$InboxItemFromJson(Map<String, dynamic> json) {
  return _InboxItem.fromJson(json);
}

/// @nodoc
mixin _$InboxItem {
  String get slug => throw _privateConstructorUsedError;
  String get name => throw _privateConstructorUsedError;
  Baton? get baton => throw _privateConstructorUsedError;
  bool get expired => throw _privateConstructorUsedError;

  /// Serializes this InboxItem to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of InboxItem
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $InboxItemCopyWith<InboxItem> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $InboxItemCopyWith<$Res> {
  factory $InboxItemCopyWith(InboxItem value, $Res Function(InboxItem) then) =
      _$InboxItemCopyWithImpl<$Res, InboxItem>;
  @useResult
  $Res call({String slug, String name, Baton? baton, bool expired});

  $BatonCopyWith<$Res>? get baton;
}

/// @nodoc
class _$InboxItemCopyWithImpl<$Res, $Val extends InboxItem>
    implements $InboxItemCopyWith<$Res> {
  _$InboxItemCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of InboxItem
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? slug = null,
    Object? name = null,
    Object? baton = freezed,
    Object? expired = null,
  }) {
    return _then(_value.copyWith(
      slug: null == slug
          ? _value.slug
          : slug // ignore: cast_nullable_to_non_nullable
              as String,
      name: null == name
          ? _value.name
          : name // ignore: cast_nullable_to_non_nullable
              as String,
      baton: freezed == baton
          ? _value.baton
          : baton // ignore: cast_nullable_to_non_nullable
              as Baton?,
      expired: null == expired
          ? _value.expired
          : expired // ignore: cast_nullable_to_non_nullable
              as bool,
    ) as $Val);
  }

  /// Create a copy of InboxItem
  /// with the given fields replaced by the non-null parameter values.
  @override
  @pragma('vm:prefer-inline')
  $BatonCopyWith<$Res>? get baton {
    if (_value.baton == null) {
      return null;
    }

    return $BatonCopyWith<$Res>(_value.baton!, (value) {
      return _then(_value.copyWith(baton: value) as $Val);
    });
  }
}

/// @nodoc
abstract class _$$InboxItemImplCopyWith<$Res>
    implements $InboxItemCopyWith<$Res> {
  factory _$$InboxItemImplCopyWith(
          _$InboxItemImpl value, $Res Function(_$InboxItemImpl) then) =
      __$$InboxItemImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({String slug, String name, Baton? baton, bool expired});

  @override
  $BatonCopyWith<$Res>? get baton;
}

/// @nodoc
class __$$InboxItemImplCopyWithImpl<$Res>
    extends _$InboxItemCopyWithImpl<$Res, _$InboxItemImpl>
    implements _$$InboxItemImplCopyWith<$Res> {
  __$$InboxItemImplCopyWithImpl(
      _$InboxItemImpl _value, $Res Function(_$InboxItemImpl) _then)
      : super(_value, _then);

  /// Create a copy of InboxItem
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? slug = null,
    Object? name = null,
    Object? baton = freezed,
    Object? expired = null,
  }) {
    return _then(_$InboxItemImpl(
      slug: null == slug
          ? _value.slug
          : slug // ignore: cast_nullable_to_non_nullable
              as String,
      name: null == name
          ? _value.name
          : name // ignore: cast_nullable_to_non_nullable
              as String,
      baton: freezed == baton
          ? _value.baton
          : baton // ignore: cast_nullable_to_non_nullable
              as Baton?,
      expired: null == expired
          ? _value.expired
          : expired // ignore: cast_nullable_to_non_nullable
              as bool,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$InboxItemImpl implements _InboxItem {
  const _$InboxItemImpl(
      {required this.slug,
      required this.name,
      this.baton,
      this.expired = false});

  factory _$InboxItemImpl.fromJson(Map<String, dynamic> json) =>
      _$$InboxItemImplFromJson(json);

  @override
  final String slug;
  @override
  final String name;
  @override
  final Baton? baton;
  @override
  @JsonKey()
  final bool expired;

  @override
  String toString() {
    return 'InboxItem(slug: $slug, name: $name, baton: $baton, expired: $expired)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$InboxItemImpl &&
            (identical(other.slug, slug) || other.slug == slug) &&
            (identical(other.name, name) || other.name == name) &&
            (identical(other.baton, baton) || other.baton == baton) &&
            (identical(other.expired, expired) || other.expired == expired));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(runtimeType, slug, name, baton, expired);

  /// Create a copy of InboxItem
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$InboxItemImplCopyWith<_$InboxItemImpl> get copyWith =>
      __$$InboxItemImplCopyWithImpl<_$InboxItemImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$InboxItemImplToJson(
      this,
    );
  }
}

abstract class _InboxItem implements InboxItem {
  const factory _InboxItem(
      {required final String slug,
      required final String name,
      final Baton? baton,
      final bool expired}) = _$InboxItemImpl;

  factory _InboxItem.fromJson(Map<String, dynamic> json) =
      _$InboxItemImpl.fromJson;

  @override
  String get slug;
  @override
  String get name;
  @override
  Baton? get baton;
  @override
  bool get expired;

  /// Create a copy of InboxItem
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$InboxItemImplCopyWith<_$InboxItemImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

Inbox _$InboxFromJson(Map<String, dynamic> json) {
  return _Inbox.fromJson(json);
}

/// @nodoc
mixin _$Inbox {
  List<InboxItem> get mine => throw _privateConstructorUsedError;
  List<InboxItem> get unclaimed => throw _privateConstructorUsedError;

  /// Serializes this Inbox to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of Inbox
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $InboxCopyWith<Inbox> get copyWith => throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $InboxCopyWith<$Res> {
  factory $InboxCopyWith(Inbox value, $Res Function(Inbox) then) =
      _$InboxCopyWithImpl<$Res, Inbox>;
  @useResult
  $Res call({List<InboxItem> mine, List<InboxItem> unclaimed});
}

/// @nodoc
class _$InboxCopyWithImpl<$Res, $Val extends Inbox>
    implements $InboxCopyWith<$Res> {
  _$InboxCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of Inbox
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? mine = null,
    Object? unclaimed = null,
  }) {
    return _then(_value.copyWith(
      mine: null == mine
          ? _value.mine
          : mine // ignore: cast_nullable_to_non_nullable
              as List<InboxItem>,
      unclaimed: null == unclaimed
          ? _value.unclaimed
          : unclaimed // ignore: cast_nullable_to_non_nullable
              as List<InboxItem>,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$InboxImplCopyWith<$Res> implements $InboxCopyWith<$Res> {
  factory _$$InboxImplCopyWith(
          _$InboxImpl value, $Res Function(_$InboxImpl) then) =
      __$$InboxImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({List<InboxItem> mine, List<InboxItem> unclaimed});
}

/// @nodoc
class __$$InboxImplCopyWithImpl<$Res>
    extends _$InboxCopyWithImpl<$Res, _$InboxImpl>
    implements _$$InboxImplCopyWith<$Res> {
  __$$InboxImplCopyWithImpl(
      _$InboxImpl _value, $Res Function(_$InboxImpl) _then)
      : super(_value, _then);

  /// Create a copy of Inbox
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? mine = null,
    Object? unclaimed = null,
  }) {
    return _then(_$InboxImpl(
      mine: null == mine
          ? _value._mine
          : mine // ignore: cast_nullable_to_non_nullable
              as List<InboxItem>,
      unclaimed: null == unclaimed
          ? _value._unclaimed
          : unclaimed // ignore: cast_nullable_to_non_nullable
              as List<InboxItem>,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$InboxImpl implements _Inbox {
  const _$InboxImpl(
      {final List<InboxItem> mine = const <InboxItem>[],
      final List<InboxItem> unclaimed = const <InboxItem>[]})
      : _mine = mine,
        _unclaimed = unclaimed;

  factory _$InboxImpl.fromJson(Map<String, dynamic> json) =>
      _$$InboxImplFromJson(json);

  final List<InboxItem> _mine;
  @override
  @JsonKey()
  List<InboxItem> get mine {
    if (_mine is EqualUnmodifiableListView) return _mine;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_mine);
  }

  final List<InboxItem> _unclaimed;
  @override
  @JsonKey()
  List<InboxItem> get unclaimed {
    if (_unclaimed is EqualUnmodifiableListView) return _unclaimed;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_unclaimed);
  }

  @override
  String toString() {
    return 'Inbox(mine: $mine, unclaimed: $unclaimed)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$InboxImpl &&
            const DeepCollectionEquality().equals(other._mine, _mine) &&
            const DeepCollectionEquality()
                .equals(other._unclaimed, _unclaimed));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(
      runtimeType,
      const DeepCollectionEquality().hash(_mine),
      const DeepCollectionEquality().hash(_unclaimed));

  /// Create a copy of Inbox
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$InboxImplCopyWith<_$InboxImpl> get copyWith =>
      __$$InboxImplCopyWithImpl<_$InboxImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$InboxImplToJson(
      this,
    );
  }
}

abstract class _Inbox implements Inbox {
  const factory _Inbox(
      {final List<InboxItem> mine,
      final List<InboxItem> unclaimed}) = _$InboxImpl;

  factory _Inbox.fromJson(Map<String, dynamic> json) = _$InboxImpl.fromJson;

  @override
  List<InboxItem> get mine;
  @override
  List<InboxItem> get unclaimed;

  /// Create a copy of Inbox
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$InboxImplCopyWith<_$InboxImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
