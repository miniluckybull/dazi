// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'project_meta.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
    'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models');

ProjectMeta _$ProjectMetaFromJson(Map<String, dynamic> json) {
  return _ProjectMeta.fromJson(json);
}

/// @nodoc
mixin _$ProjectMeta {
  String get slug => throw _privateConstructorUsedError;
  String get name => throw _privateConstructorUsedError;
  String get status => throw _privateConstructorUsedError;
  String get priority => throw _privateConstructorUsedError;
  bool get archived => throw _privateConstructorUsedError;
  bool get requiresReferences => throw _privateConstructorUsedError;
  String get taskType => throw _privateConstructorUsedError;
  List<String>? get tags => throw _privateConstructorUsedError;
  @JsonKey(name: 'start_date')
  String? get startDate => throw _privateConstructorUsedError;
  @JsonKey(name: 'due_date')
  String? get dueDate => throw _privateConstructorUsedError;
  @JsonKey(name: 'handed_off_at')
  String? get handedOffAt => throw _privateConstructorUsedError;
  Schedule? get schedule => throw _privateConstructorUsedError;
  @JsonKey(name: 'next_run_at')
  String? get nextRunAt => throw _privateConstructorUsedError;
  @JsonKey(name: 'last_run_at')
  String? get lastRunAt => throw _privateConstructorUsedError;
  @JsonKey(name: 'last_run_ok')
  bool? get lastRunOk => throw _privateConstructorUsedError;
  @JsonKey(name: 'runs')
  List<RunRecord>? get runs => throw _privateConstructorUsedError;

  /// Serializes this ProjectMeta to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of ProjectMeta
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $ProjectMetaCopyWith<ProjectMeta> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $ProjectMetaCopyWith<$Res> {
  factory $ProjectMetaCopyWith(
          ProjectMeta value, $Res Function(ProjectMeta) then) =
      _$ProjectMetaCopyWithImpl<$Res, ProjectMeta>;
  @useResult
  $Res call(
      {String slug,
      String name,
      String status,
      String priority,
      bool archived,
      bool requiresReferences,
      String taskType,
      List<String>? tags,
      @JsonKey(name: 'start_date') String? startDate,
      @JsonKey(name: 'due_date') String? dueDate,
      @JsonKey(name: 'handed_off_at') String? handedOffAt,
      Schedule? schedule,
      @JsonKey(name: 'next_run_at') String? nextRunAt,
      @JsonKey(name: 'last_run_at') String? lastRunAt,
      @JsonKey(name: 'last_run_ok') bool? lastRunOk,
      @JsonKey(name: 'runs') List<RunRecord>? runs});

  $ScheduleCopyWith<$Res>? get schedule;
}

/// @nodoc
class _$ProjectMetaCopyWithImpl<$Res, $Val extends ProjectMeta>
    implements $ProjectMetaCopyWith<$Res> {
  _$ProjectMetaCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of ProjectMeta
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
    Object? taskType = null,
    Object? tags = freezed,
    Object? startDate = freezed,
    Object? dueDate = freezed,
    Object? handedOffAt = freezed,
    Object? schedule = freezed,
    Object? nextRunAt = freezed,
    Object? lastRunAt = freezed,
    Object? lastRunOk = freezed,
    Object? runs = freezed,
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
      taskType: null == taskType
          ? _value.taskType
          : taskType // ignore: cast_nullable_to_non_nullable
              as String,
      tags: freezed == tags
          ? _value.tags
          : tags // ignore: cast_nullable_to_non_nullable
              as List<String>?,
      startDate: freezed == startDate
          ? _value.startDate
          : startDate // ignore: cast_nullable_to_non_nullable
              as String?,
      dueDate: freezed == dueDate
          ? _value.dueDate
          : dueDate // ignore: cast_nullable_to_non_nullable
              as String?,
      handedOffAt: freezed == handedOffAt
          ? _value.handedOffAt
          : handedOffAt // ignore: cast_nullable_to_non_nullable
              as String?,
      schedule: freezed == schedule
          ? _value.schedule
          : schedule // ignore: cast_nullable_to_non_nullable
              as Schedule?,
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
      runs: freezed == runs
          ? _value.runs
          : runs // ignore: cast_nullable_to_non_nullable
              as List<RunRecord>?,
    ) as $Val);
  }

  /// Create a copy of ProjectMeta
  /// with the given fields replaced by the non-null parameter values.
  @override
  @pragma('vm:prefer-inline')
  $ScheduleCopyWith<$Res>? get schedule {
    if (_value.schedule == null) {
      return null;
    }

    return $ScheduleCopyWith<$Res>(_value.schedule!, (value) {
      return _then(_value.copyWith(schedule: value) as $Val);
    });
  }
}

/// @nodoc
abstract class _$$ProjectMetaImplCopyWith<$Res>
    implements $ProjectMetaCopyWith<$Res> {
  factory _$$ProjectMetaImplCopyWith(
          _$ProjectMetaImpl value, $Res Function(_$ProjectMetaImpl) then) =
      __$$ProjectMetaImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {String slug,
      String name,
      String status,
      String priority,
      bool archived,
      bool requiresReferences,
      String taskType,
      List<String>? tags,
      @JsonKey(name: 'start_date') String? startDate,
      @JsonKey(name: 'due_date') String? dueDate,
      @JsonKey(name: 'handed_off_at') String? handedOffAt,
      Schedule? schedule,
      @JsonKey(name: 'next_run_at') String? nextRunAt,
      @JsonKey(name: 'last_run_at') String? lastRunAt,
      @JsonKey(name: 'last_run_ok') bool? lastRunOk,
      @JsonKey(name: 'runs') List<RunRecord>? runs});

  @override
  $ScheduleCopyWith<$Res>? get schedule;
}

/// @nodoc
class __$$ProjectMetaImplCopyWithImpl<$Res>
    extends _$ProjectMetaCopyWithImpl<$Res, _$ProjectMetaImpl>
    implements _$$ProjectMetaImplCopyWith<$Res> {
  __$$ProjectMetaImplCopyWithImpl(
      _$ProjectMetaImpl _value, $Res Function(_$ProjectMetaImpl) _then)
      : super(_value, _then);

  /// Create a copy of ProjectMeta
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
    Object? taskType = null,
    Object? tags = freezed,
    Object? startDate = freezed,
    Object? dueDate = freezed,
    Object? handedOffAt = freezed,
    Object? schedule = freezed,
    Object? nextRunAt = freezed,
    Object? lastRunAt = freezed,
    Object? lastRunOk = freezed,
    Object? runs = freezed,
  }) {
    return _then(_$ProjectMetaImpl(
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
      taskType: null == taskType
          ? _value.taskType
          : taskType // ignore: cast_nullable_to_non_nullable
              as String,
      tags: freezed == tags
          ? _value._tags
          : tags // ignore: cast_nullable_to_non_nullable
              as List<String>?,
      startDate: freezed == startDate
          ? _value.startDate
          : startDate // ignore: cast_nullable_to_non_nullable
              as String?,
      dueDate: freezed == dueDate
          ? _value.dueDate
          : dueDate // ignore: cast_nullable_to_non_nullable
              as String?,
      handedOffAt: freezed == handedOffAt
          ? _value.handedOffAt
          : handedOffAt // ignore: cast_nullable_to_non_nullable
              as String?,
      schedule: freezed == schedule
          ? _value.schedule
          : schedule // ignore: cast_nullable_to_non_nullable
              as Schedule?,
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
      runs: freezed == runs
          ? _value._runs
          : runs // ignore: cast_nullable_to_non_nullable
              as List<RunRecord>?,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$ProjectMetaImpl implements _ProjectMeta {
  const _$ProjectMetaImpl(
      {required this.slug,
      required this.name,
      required this.status,
      required this.priority,
      required this.archived,
      required this.requiresReferences,
      required this.taskType,
      final List<String>? tags,
      @JsonKey(name: 'start_date') this.startDate,
      @JsonKey(name: 'due_date') this.dueDate,
      @JsonKey(name: 'handed_off_at') this.handedOffAt,
      this.schedule,
      @JsonKey(name: 'next_run_at') this.nextRunAt,
      @JsonKey(name: 'last_run_at') this.lastRunAt,
      @JsonKey(name: 'last_run_ok') this.lastRunOk,
      @JsonKey(name: 'runs') final List<RunRecord>? runs})
      : _tags = tags,
        _runs = runs;

  factory _$ProjectMetaImpl.fromJson(Map<String, dynamic> json) =>
      _$$ProjectMetaImplFromJson(json);

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
  final String taskType;
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
  @JsonKey(name: 'start_date')
  final String? startDate;
  @override
  @JsonKey(name: 'due_date')
  final String? dueDate;
  @override
  @JsonKey(name: 'handed_off_at')
  final String? handedOffAt;
  @override
  final Schedule? schedule;
  @override
  @JsonKey(name: 'next_run_at')
  final String? nextRunAt;
  @override
  @JsonKey(name: 'last_run_at')
  final String? lastRunAt;
  @override
  @JsonKey(name: 'last_run_ok')
  final bool? lastRunOk;
  final List<RunRecord>? _runs;
  @override
  @JsonKey(name: 'runs')
  List<RunRecord>? get runs {
    final value = _runs;
    if (value == null) return null;
    if (_runs is EqualUnmodifiableListView) return _runs;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(value);
  }

  @override
  String toString() {
    return 'ProjectMeta(slug: $slug, name: $name, status: $status, priority: $priority, archived: $archived, requiresReferences: $requiresReferences, taskType: $taskType, tags: $tags, startDate: $startDate, dueDate: $dueDate, handedOffAt: $handedOffAt, schedule: $schedule, nextRunAt: $nextRunAt, lastRunAt: $lastRunAt, lastRunOk: $lastRunOk, runs: $runs)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$ProjectMetaImpl &&
            (identical(other.slug, slug) || other.slug == slug) &&
            (identical(other.name, name) || other.name == name) &&
            (identical(other.status, status) || other.status == status) &&
            (identical(other.priority, priority) ||
                other.priority == priority) &&
            (identical(other.archived, archived) ||
                other.archived == archived) &&
            (identical(other.requiresReferences, requiresReferences) ||
                other.requiresReferences == requiresReferences) &&
            (identical(other.taskType, taskType) ||
                other.taskType == taskType) &&
            const DeepCollectionEquality().equals(other._tags, _tags) &&
            (identical(other.startDate, startDate) ||
                other.startDate == startDate) &&
            (identical(other.dueDate, dueDate) || other.dueDate == dueDate) &&
            (identical(other.handedOffAt, handedOffAt) ||
                other.handedOffAt == handedOffAt) &&
            (identical(other.schedule, schedule) ||
                other.schedule == schedule) &&
            (identical(other.nextRunAt, nextRunAt) ||
                other.nextRunAt == nextRunAt) &&
            (identical(other.lastRunAt, lastRunAt) ||
                other.lastRunAt == lastRunAt) &&
            (identical(other.lastRunOk, lastRunOk) ||
                other.lastRunOk == lastRunOk) &&
            const DeepCollectionEquality().equals(other._runs, _runs));
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
      taskType,
      const DeepCollectionEquality().hash(_tags),
      startDate,
      dueDate,
      handedOffAt,
      schedule,
      nextRunAt,
      lastRunAt,
      lastRunOk,
      const DeepCollectionEquality().hash(_runs));

  /// Create a copy of ProjectMeta
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$ProjectMetaImplCopyWith<_$ProjectMetaImpl> get copyWith =>
      __$$ProjectMetaImplCopyWithImpl<_$ProjectMetaImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$ProjectMetaImplToJson(
      this,
    );
  }
}

abstract class _ProjectMeta implements ProjectMeta {
  const factory _ProjectMeta(
      {required final String slug,
      required final String name,
      required final String status,
      required final String priority,
      required final bool archived,
      required final bool requiresReferences,
      required final String taskType,
      final List<String>? tags,
      @JsonKey(name: 'start_date') final String? startDate,
      @JsonKey(name: 'due_date') final String? dueDate,
      @JsonKey(name: 'handed_off_at') final String? handedOffAt,
      final Schedule? schedule,
      @JsonKey(name: 'next_run_at') final String? nextRunAt,
      @JsonKey(name: 'last_run_at') final String? lastRunAt,
      @JsonKey(name: 'last_run_ok') final bool? lastRunOk,
      @JsonKey(name: 'runs') final List<RunRecord>? runs}) = _$ProjectMetaImpl;

  factory _ProjectMeta.fromJson(Map<String, dynamic> json) =
      _$ProjectMetaImpl.fromJson;

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
  String get taskType;
  @override
  List<String>? get tags;
  @override
  @JsonKey(name: 'start_date')
  String? get startDate;
  @override
  @JsonKey(name: 'due_date')
  String? get dueDate;
  @override
  @JsonKey(name: 'handed_off_at')
  String? get handedOffAt;
  @override
  Schedule? get schedule;
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
  @JsonKey(name: 'runs')
  List<RunRecord>? get runs;

  /// Create a copy of ProjectMeta
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$ProjectMetaImplCopyWith<_$ProjectMetaImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
