// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'project_summary.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
    'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models');

ProjectSummary _$ProjectSummaryFromJson(Map<String, dynamic> json) {
  return _ProjectSummary.fromJson(json);
}

/// @nodoc
mixin _$ProjectSummary {
  String get slug => throw _privateConstructorUsedError;
  String get name => throw _privateConstructorUsedError;
  String get status => throw _privateConstructorUsedError;
  String get priority => throw _privateConstructorUsedError;
  bool get archived => throw _privateConstructorUsedError;
  bool get requiresReferences => throw _privateConstructorUsedError;
  bool get hasReferences => throw _privateConstructorUsedError;
  String get taskType => throw _privateConstructorUsedError;
  @JsonKey(name: 'handed_off_at')
  String? get handedOffAt => throw _privateConstructorUsedError;
  @JsonKey(name: 'next_run_at')
  String? get nextRunAt => throw _privateConstructorUsedError;
  @JsonKey(name: 'last_run_at')
  String? get lastRunAt => throw _privateConstructorUsedError;
  @JsonKey(name: 'last_run_ok')
  bool? get lastRunOk => throw _privateConstructorUsedError;
  List<String>? get tags => throw _privateConstructorUsedError;

  /// Serializes this ProjectSummary to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of ProjectSummary
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $ProjectSummaryCopyWith<ProjectSummary> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $ProjectSummaryCopyWith<$Res> {
  factory $ProjectSummaryCopyWith(
          ProjectSummary value, $Res Function(ProjectSummary) then) =
      _$ProjectSummaryCopyWithImpl<$Res, ProjectSummary>;
  @useResult
  $Res call(
      {String slug,
      String name,
      String status,
      String priority,
      bool archived,
      bool requiresReferences,
      bool hasReferences,
      String taskType,
      @JsonKey(name: 'handed_off_at') String? handedOffAt,
      @JsonKey(name: 'next_run_at') String? nextRunAt,
      @JsonKey(name: 'last_run_at') String? lastRunAt,
      @JsonKey(name: 'last_run_ok') bool? lastRunOk,
      List<String>? tags});
}

/// @nodoc
class _$ProjectSummaryCopyWithImpl<$Res, $Val extends ProjectSummary>
    implements $ProjectSummaryCopyWith<$Res> {
  _$ProjectSummaryCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of ProjectSummary
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? slug = null,
    Object? name = null,
    Object? status = null,
    Object? priority = null,
    Object? archived = null,
    Object? requiresReferences = null,
    Object? hasReferences = null,
    Object? taskType = null,
    Object? handedOffAt = freezed,
    Object? nextRunAt = freezed,
    Object? lastRunAt = freezed,
    Object? lastRunOk = freezed,
    Object? tags = freezed,
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
      status: null == status
          ? _value.status
          : status // ignore: cast_nullable_to_non_nullable
              as String,
      priority: null == priority
          ? _value.priority
          : priority // ignore: cast_nullable_to_non_nullable
              as String,
      archived: null == archived
          ? _value.archived
          : archived // ignore: cast_nullable_to_non_nullable
              as bool,
      requiresReferences: null == requiresReferences
          ? _value.requiresReferences
          : requiresReferences // ignore: cast_nullable_to_non_nullable
              as bool,
      hasReferences: null == hasReferences
          ? _value.hasReferences
          : hasReferences // ignore: cast_nullable_to_non_nullable
              as bool,
      taskType: null == taskType
          ? _value.taskType
          : taskType // ignore: cast_nullable_to_non_nullable
              as String,
      handedOffAt: freezed == handedOffAt
          ? _value.handedOffAt
          : handedOffAt // ignore: cast_nullable_to_non_nullable
              as String?,
      nextRunAt: freezed == nextRunAt
          ? _value.nextRunAt
          : nextRunAt // ignore: cast_nullable_to_non_nullable
              as String?,
      lastRunAt: freezed == lastRunAt
          ? _value.lastRunAt
          : lastRunAt // ignore: cast_nullable_to_non_nullable
              as String?,
      lastRunOk: freezed == lastRunOk
          ? _value.lastRunOk
          : lastRunOk // ignore: cast_nullable_to_non_nullable
              as bool?,
      tags: freezed == tags
          ? _value.tags
          : tags // ignore: cast_nullable_to_non_nullable
              as List<String>?,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$ProjectSummaryImplCopyWith<$Res>
    implements $ProjectSummaryCopyWith<$Res> {
  factory _$$ProjectSummaryImplCopyWith(_$ProjectSummaryImpl value,
          $Res Function(_$ProjectSummaryImpl) then) =
      __$$ProjectSummaryImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {String slug,
      String name,
      String status,
      String priority,
      bool archived,
      bool requiresReferences,
      bool hasReferences,
      String taskType,
      @JsonKey(name: 'handed_off_at') String? handedOffAt,
      @JsonKey(name: 'next_run_at') String? nextRunAt,
      @JsonKey(name: 'last_run_at') String? lastRunAt,
      @JsonKey(name: 'last_run_ok') bool? lastRunOk,
      List<String>? tags});
}

/// @nodoc
class __$$ProjectSummaryImplCopyWithImpl<$Res>
    extends _$ProjectSummaryCopyWithImpl<$Res, _$ProjectSummaryImpl>
    implements _$$ProjectSummaryImplCopyWith<$Res> {
  __$$ProjectSummaryImplCopyWithImpl(
      _$ProjectSummaryImpl _value, $Res Function(_$ProjectSummaryImpl) _then)
      : super(_value, _then);

  /// Create a copy of ProjectSummary
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? slug = null,
    Object? name = null,
    Object? status = null,
    Object? priority = null,
    Object? archived = null,
    Object? requiresReferences = null,
    Object? hasReferences = null,
    Object? taskType = null,
    Object? handedOffAt = freezed,
    Object? nextRunAt = freezed,
    Object? lastRunAt = freezed,
    Object? lastRunOk = freezed,
    Object? tags = freezed,
  }) {
    return _then(_$ProjectSummaryImpl(
      slug: null == slug
          ? _value.slug
          : slug // ignore: cast_nullable_to_non_nullable
              as String,
      name: null == name
          ? _value.name
          : name // ignore: cast_nullable_to_non_nullable
              as String,
      status: null == status
          ? _value.status
          : status // ignore: cast_nullable_to_non_nullable
              as String,
      priority: null == priority
          ? _value.priority
          : priority // ignore: cast_nullable_to_non_nullable
              as String,
      archived: null == archived
          ? _value.archived
          : archived // ignore: cast_nullable_to_non_nullable
              as bool,
      requiresReferences: null == requiresReferences
          ? _value.requiresReferences
          : requiresReferences // ignore: cast_nullable_to_non_nullable
              as bool,
      hasReferences: null == hasReferences
          ? _value.hasReferences
          : hasReferences // ignore: cast_nullable_to_non_nullable
              as bool,
      taskType: null == taskType
          ? _value.taskType
          : taskType // ignore: cast_nullable_to_non_nullable
              as String,
      handedOffAt: freezed == handedOffAt
          ? _value.handedOffAt
          : handedOffAt // ignore: cast_nullable_to_non_nullable
              as String?,
      nextRunAt: freezed == nextRunAt
          ? _value.nextRunAt
          : nextRunAt // ignore: cast_nullable_to_non_nullable
              as String?,
      lastRunAt: freezed == lastRunAt
          ? _value.lastRunAt
          : lastRunAt // ignore: cast_nullable_to_non_nullable
              as String?,
      lastRunOk: freezed == lastRunOk
          ? _value.lastRunOk
          : lastRunOk // ignore: cast_nullable_to_non_nullable
              as bool?,
      tags: freezed == tags
          ? _value._tags
          : tags // ignore: cast_nullable_to_non_nullable
              as List<String>?,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$ProjectSummaryImpl implements _ProjectSummary {
  const _$ProjectSummaryImpl(
      {required this.slug,
      required this.name,
      required this.status,
      required this.priority,
      required this.archived,
      required this.requiresReferences,
      required this.hasReferences,
      required this.taskType,
      @JsonKey(name: 'handed_off_at') this.handedOffAt,
      @JsonKey(name: 'next_run_at') this.nextRunAt,
      @JsonKey(name: 'last_run_at') this.lastRunAt,
      @JsonKey(name: 'last_run_ok') this.lastRunOk,
      final List<String>? tags})
      : _tags = tags;

  factory _$ProjectSummaryImpl.fromJson(Map<String, dynamic> json) =>
      _$$ProjectSummaryImplFromJson(json);

  @override
  final String slug;
  @override
  final String name;
  @override
  final String status;
  @override
  final String priority;
  @override
  final bool archived;
  @override
  final bool requiresReferences;
  @override
  final bool hasReferences;
  @override
  final String taskType;
  @override
  @JsonKey(name: 'handed_off_at')
  final String? handedOffAt;
  @override
  @JsonKey(name: 'next_run_at')
  final String? nextRunAt;
  @override
  @JsonKey(name: 'last_run_at')
  final String? lastRunAt;
  @override
  @JsonKey(name: 'last_run_ok')
  final bool? lastRunOk;
  final List<String>? _tags;
  @override
  List<String>? get tags {
    final value = _tags;
    if (value == null) return null;
    if (_tags is EqualUnmodifiableListView) return _tags;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(value);
  }

  @override
  String toString() {
    return 'ProjectSummary(slug: $slug, name: $name, status: $status, priority: $priority, archived: $archived, requiresReferences: $requiresReferences, hasReferences: $hasReferences, taskType: $taskType, handedOffAt: $handedOffAt, nextRunAt: $nextRunAt, lastRunAt: $lastRunAt, lastRunOk: $lastRunOk, tags: $tags)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$ProjectSummaryImpl &&
            (identical(other.slug, slug) || other.slug == slug) &&
            (identical(other.name, name) || other.name == name) &&
            (identical(other.status, status) || other.status == status) &&
            (identical(other.priority, priority) ||
                other.priority == priority) &&
            (identical(other.archived, archived) ||
                other.archived == archived) &&
            (identical(other.requiresReferences, requiresReferences) ||
                other.requiresReferences == requiresReferences) &&
            (identical(other.hasReferences, hasReferences) ||
                other.hasReferences == hasReferences) &&
            (identical(other.taskType, taskType) ||
                other.taskType == taskType) &&
            (identical(other.handedOffAt, handedOffAt) ||
                other.handedOffAt == handedOffAt) &&
            (identical(other.nextRunAt, nextRunAt) ||
                other.nextRunAt == nextRunAt) &&
            (identical(other.lastRunAt, lastRunAt) ||
                other.lastRunAt == lastRunAt) &&
            (identical(other.lastRunOk, lastRunOk) ||
                other.lastRunOk == lastRunOk) &&
            const DeepCollectionEquality().equals(other._tags, _tags));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(
      runtimeType,
      slug,
      name,
      status,
      priority,
      archived,
      requiresReferences,
      hasReferences,
      taskType,
      handedOffAt,
      nextRunAt,
      lastRunAt,
      lastRunOk,
      const DeepCollectionEquality().hash(_tags));

  /// Create a copy of ProjectSummary
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$ProjectSummaryImplCopyWith<_$ProjectSummaryImpl> get copyWith =>
      __$$ProjectSummaryImplCopyWithImpl<_$ProjectSummaryImpl>(
          this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$ProjectSummaryImplToJson(
      this,
    );
  }
}

abstract class _ProjectSummary implements ProjectSummary {
  const factory _ProjectSummary(
      {required final String slug,
      required final String name,
      required final String status,
      required final String priority,
      required final bool archived,
      required final bool requiresReferences,
      required final bool hasReferences,
      required final String taskType,
      @JsonKey(name: 'handed_off_at') final String? handedOffAt,
      @JsonKey(name: 'next_run_at') final String? nextRunAt,
      @JsonKey(name: 'last_run_at') final String? lastRunAt,
      @JsonKey(name: 'last_run_ok') final bool? lastRunOk,
      final List<String>? tags}) = _$ProjectSummaryImpl;

  factory _ProjectSummary.fromJson(Map<String, dynamic> json) =
      _$ProjectSummaryImpl.fromJson;

  @override
  String get slug;
  @override
  String get name;
  @override
  String get status;
  @override
  String get priority;
  @override
  bool get archived;
  @override
  bool get requiresReferences;
  @override
  bool get hasReferences;
  @override
  String get taskType;
  @override
  @JsonKey(name: 'handed_off_at')
  String? get handedOffAt;
  @override
  @JsonKey(name: 'next_run_at')
  String? get nextRunAt;
  @override
  @JsonKey(name: 'last_run_at')
  String? get lastRunAt;
  @override
  @JsonKey(name: 'last_run_ok')
  bool? get lastRunOk;
  @override
  List<String>? get tags;

  /// Create a copy of ProjectSummary
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$ProjectSummaryImplCopyWith<_$ProjectSummaryImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
