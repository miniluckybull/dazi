// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'run_entry.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
    'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models');

RunEntry _$RunEntryFromJson(Map<String, dynamic> json) {
  return _RunEntry.fromJson(json);
}

/// @nodoc
mixin _$RunEntry {
  String get slug => throw _privateConstructorUsedError;
  String get name => throw _privateConstructorUsedError;
  String get at => throw _privateConstructorUsedError;
  String get action => throw _privateConstructorUsedError;
  bool get ok => throw _privateConstructorUsedError;
  String? get message => throw _privateConstructorUsedError;
  String? get id => throw _privateConstructorUsedError;
  String? get summary => throw _privateConstructorUsedError;
  List<String> get artifacts => throw _privateConstructorUsedError;

  /// Serializes this RunEntry to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of RunEntry
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $RunEntryCopyWith<RunEntry> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $RunEntryCopyWith<$Res> {
  factory $RunEntryCopyWith(RunEntry value, $Res Function(RunEntry) then) =
      _$RunEntryCopyWithImpl<$Res, RunEntry>;
  @useResult
  $Res call(
      {String slug,
      String name,
      String at,
      String action,
      bool ok,
      String? message,
      String? id,
      String? summary,
      List<String> artifacts});
}

/// @nodoc
class _$RunEntryCopyWithImpl<$Res, $Val extends RunEntry>
    implements $RunEntryCopyWith<$Res> {
  _$RunEntryCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of RunEntry
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? slug = null,
    Object? name = null,
    Object? at = null,
    Object? action = null,
    Object? ok = null,
    Object? message = freezed,
    Object? id = freezed,
    Object? summary = freezed,
    Object? artifacts = null,
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
      at: null == at
          ? _value.at
          : at // ignore: cast_nullable_to_non_nullable
              as String,
      action: null == action
          ? _value.action
          : action // ignore: cast_nullable_to_non_nullable
              as String,
      ok: null == ok
          ? _value.ok
          : ok // ignore: cast_nullable_to_non_nullable
              as bool,
      message: freezed == message
          ? _value.message
          : message // ignore: cast_nullable_to_non_nullable
              as String?,
      id: freezed == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as String?,
      summary: freezed == summary
          ? _value.summary
          : summary // ignore: cast_nullable_to_non_nullable
              as String?,
      artifacts: null == artifacts
          ? _value.artifacts
          : artifacts // ignore: cast_nullable_to_non_nullable
              as List<String>,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$RunEntryImplCopyWith<$Res>
    implements $RunEntryCopyWith<$Res> {
  factory _$$RunEntryImplCopyWith(
          _$RunEntryImpl value, $Res Function(_$RunEntryImpl) then) =
      __$$RunEntryImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {String slug,
      String name,
      String at,
      String action,
      bool ok,
      String? message,
      String? id,
      String? summary,
      List<String> artifacts});
}

/// @nodoc
class __$$RunEntryImplCopyWithImpl<$Res>
    extends _$RunEntryCopyWithImpl<$Res, _$RunEntryImpl>
    implements _$$RunEntryImplCopyWith<$Res> {
  __$$RunEntryImplCopyWithImpl(
      _$RunEntryImpl _value, $Res Function(_$RunEntryImpl) _then)
      : super(_value, _then);

  /// Create a copy of RunEntry
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? slug = null,
    Object? name = null,
    Object? at = null,
    Object? action = null,
    Object? ok = null,
    Object? message = freezed,
    Object? id = freezed,
    Object? summary = freezed,
    Object? artifacts = null,
  }) {
    return _then(_$RunEntryImpl(
      slug: null == slug
          ? _value.slug
          : slug // ignore: cast_nullable_to_non_nullable
              as String,
      name: null == name
          ? _value.name
          : name // ignore: cast_nullable_to_non_nullable
              as String,
      at: null == at
          ? _value.at
          : at // ignore: cast_nullable_to_non_nullable
              as String,
      action: null == action
          ? _value.action
          : action // ignore: cast_nullable_to_non_nullable
              as String,
      ok: null == ok
          ? _value.ok
          : ok // ignore: cast_nullable_to_non_nullable
              as bool,
      message: freezed == message
          ? _value.message
          : message // ignore: cast_nullable_to_non_nullable
              as String?,
      id: freezed == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as String?,
      summary: freezed == summary
          ? _value.summary
          : summary // ignore: cast_nullable_to_non_nullable
              as String?,
      artifacts: null == artifacts
          ? _value._artifacts
          : artifacts // ignore: cast_nullable_to_non_nullable
              as List<String>,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$RunEntryImpl implements _RunEntry {
  const _$RunEntryImpl(
      {required this.slug,
      required this.name,
      required this.at,
      required this.action,
      required this.ok,
      this.message,
      this.id,
      this.summary,
      final List<String> artifacts = const []})
      : _artifacts = artifacts;

  factory _$RunEntryImpl.fromJson(Map<String, dynamic> json) =>
      _$$RunEntryImplFromJson(json);

  @override
  final String slug;
  @override
  final String name;
  @override
  final String at;
  @override
  final String action;
  @override
  final bool ok;
  @override
  final String? message;
  @override
  final String? id;
  @override
  final String? summary;
  final List<String> _artifacts;
  @override
  @JsonKey()
  List<String> get artifacts {
    if (_artifacts is EqualUnmodifiableListView) return _artifacts;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_artifacts);
  }

  @override
  String toString() {
    return 'RunEntry(slug: $slug, name: $name, at: $at, action: $action, ok: $ok, message: $message, id: $id, summary: $summary, artifacts: $artifacts)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$RunEntryImpl &&
            (identical(other.slug, slug) || other.slug == slug) &&
            (identical(other.name, name) || other.name == name) &&
            (identical(other.at, at) || other.at == at) &&
            (identical(other.action, action) || other.action == action) &&
            (identical(other.ok, ok) || other.ok == ok) &&
            (identical(other.message, message) || other.message == message) &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.summary, summary) || other.summary == summary) &&
            const DeepCollectionEquality()
                .equals(other._artifacts, _artifacts));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(runtimeType, slug, name, at, action, ok,
      message, id, summary, const DeepCollectionEquality().hash(_artifacts));

  /// Create a copy of RunEntry
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$RunEntryImplCopyWith<_$RunEntryImpl> get copyWith =>
      __$$RunEntryImplCopyWithImpl<_$RunEntryImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$RunEntryImplToJson(
      this,
    );
  }
}

abstract class _RunEntry implements RunEntry {
  const factory _RunEntry(
      {required final String slug,
      required final String name,
      required final String at,
      required final String action,
      required final bool ok,
      final String? message,
      final String? id,
      final String? summary,
      final List<String> artifacts}) = _$RunEntryImpl;

  factory _RunEntry.fromJson(Map<String, dynamic> json) =
      _$RunEntryImpl.fromJson;

  @override
  String get slug;
  @override
  String get name;
  @override
  String get at;
  @override
  String get action;
  @override
  bool get ok;
  @override
  String? get message;
  @override
  String? get id;
  @override
  String? get summary;
  @override
  List<String> get artifacts;

  /// Create a copy of RunEntry
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$RunEntryImplCopyWith<_$RunEntryImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
