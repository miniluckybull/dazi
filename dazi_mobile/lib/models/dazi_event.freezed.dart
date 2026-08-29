// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'dazi_event.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
    'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models');

DaziEvent _$DaziEventFromJson(Map<String, dynamic> json) {
  switch (json['type']) {
    case 'task-triggered':
      return TaskTriggered.fromJson(json);
    case 'task-completed':
      return TaskCompleted.fromJson(json);
    case 'approval-requested':
      return ApprovalRequested.fromJson(json);
    case 'approval-resolved':
      return ApprovalResolved.fromJson(json);
    case 'task-assigned':
      return TaskAssigned.fromJson(json);
    case 'mentioned':
      return Mentioned.fromJson(json);

    default:
      throw CheckedFromJsonException(
          json, 'type', 'DaziEvent', 'Invalid union type "${json['type']}"!');
  }
}

/// @nodoc
mixin _$DaziEvent {
  String get slug => throw _privateConstructorUsedError;
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function(String slug, String name) taskTriggered,
    required TResult Function(String slug, String name, bool ok, String summary,
            @JsonKey(name: 'run_id') String runId, List<String> artifacts)
        taskCompleted,
    required TResult Function(
            String slug,
            String name,
            @JsonKey(name: 'approval_id') String approvalId,
            String plan,
            UsageEstimate? estimate)
        approvalRequested,
    required TResult Function(String slug,
            @JsonKey(name: 'approval_id') String approvalId, bool approved)
        approvalResolved,
    required TResult Function(
            String slug, String name, String? assignee, String by)
        taskAssigned,
    required TResult Function(String slug, String name, List<String> mentions,
            String by, String text)
        mentioned,
  }) =>
      throw _privateConstructorUsedError;
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function(String slug, String name)? taskTriggered,
    TResult? Function(String slug, String name, bool ok, String summary,
            @JsonKey(name: 'run_id') String runId, List<String> artifacts)?
        taskCompleted,
    TResult? Function(
            String slug,
            String name,
            @JsonKey(name: 'approval_id') String approvalId,
            String plan,
            UsageEstimate? estimate)?
        approvalRequested,
    TResult? Function(String slug,
            @JsonKey(name: 'approval_id') String approvalId, bool approved)?
        approvalResolved,
    TResult? Function(String slug, String name, String? assignee, String by)?
        taskAssigned,
    TResult? Function(String slug, String name, List<String> mentions,
            String by, String text)?
        mentioned,
  }) =>
      throw _privateConstructorUsedError;
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function(String slug, String name)? taskTriggered,
    TResult Function(String slug, String name, bool ok, String summary,
            @JsonKey(name: 'run_id') String runId, List<String> artifacts)?
        taskCompleted,
    TResult Function(
            String slug,
            String name,
            @JsonKey(name: 'approval_id') String approvalId,
            String plan,
            UsageEstimate? estimate)?
        approvalRequested,
    TResult Function(String slug,
            @JsonKey(name: 'approval_id') String approvalId, bool approved)?
        approvalResolved,
    TResult Function(String slug, String name, String? assignee, String by)?
        taskAssigned,
    TResult Function(String slug, String name, List<String> mentions, String by,
            String text)?
        mentioned,
    required TResult orElse(),
  }) =>
      throw _privateConstructorUsedError;
  @optionalTypeArgs
  TResult map<TResult extends Object?>({
    required TResult Function(TaskTriggered value) taskTriggered,
    required TResult Function(TaskCompleted value) taskCompleted,
    required TResult Function(ApprovalRequested value) approvalRequested,
    required TResult Function(ApprovalResolved value) approvalResolved,
    required TResult Function(TaskAssigned value) taskAssigned,
    required TResult Function(Mentioned value) mentioned,
  }) =>
      throw _privateConstructorUsedError;
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(TaskTriggered value)? taskTriggered,
    TResult? Function(TaskCompleted value)? taskCompleted,
    TResult? Function(ApprovalRequested value)? approvalRequested,
    TResult? Function(ApprovalResolved value)? approvalResolved,
    TResult? Function(TaskAssigned value)? taskAssigned,
    TResult? Function(Mentioned value)? mentioned,
  }) =>
      throw _privateConstructorUsedError;
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(TaskTriggered value)? taskTriggered,
    TResult Function(TaskCompleted value)? taskCompleted,
    TResult Function(ApprovalRequested value)? approvalRequested,
    TResult Function(ApprovalResolved value)? approvalResolved,
    TResult Function(TaskAssigned value)? taskAssigned,
    TResult Function(Mentioned value)? mentioned,
    required TResult orElse(),
  }) =>
      throw _privateConstructorUsedError;

  /// Serializes this DaziEvent to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of DaziEvent
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $DaziEventCopyWith<DaziEvent> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $DaziEventCopyWith<$Res> {
  factory $DaziEventCopyWith(DaziEvent value, $Res Function(DaziEvent) then) =
      _$DaziEventCopyWithImpl<$Res, DaziEvent>;
  @useResult
  $Res call({String slug});
}

/// @nodoc
class _$DaziEventCopyWithImpl<$Res, $Val extends DaziEvent>
    implements $DaziEventCopyWith<$Res> {
  _$DaziEventCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of DaziEvent
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? slug = null,
  }) {
    return _then(_value.copyWith(
      slug: null == slug
          ? _value.slug
          : slug // ignore: cast_nullable_to_non_nullable
              as String,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$TaskTriggeredImplCopyWith<$Res>
    implements $DaziEventCopyWith<$Res> {
  factory _$$TaskTriggeredImplCopyWith(
          _$TaskTriggeredImpl value, $Res Function(_$TaskTriggeredImpl) then) =
      __$$TaskTriggeredImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({String slug, String name});
}

/// @nodoc
class __$$TaskTriggeredImplCopyWithImpl<$Res>
    extends _$DaziEventCopyWithImpl<$Res, _$TaskTriggeredImpl>
    implements _$$TaskTriggeredImplCopyWith<$Res> {
  __$$TaskTriggeredImplCopyWithImpl(
      _$TaskTriggeredImpl _value, $Res Function(_$TaskTriggeredImpl) _then)
      : super(_value, _then);

  /// Create a copy of DaziEvent
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? slug = null,
    Object? name = null,
  }) {
    return _then(_$TaskTriggeredImpl(
      slug: null == slug
          ? _value.slug
          : slug // ignore: cast_nullable_to_non_nullable
              as String,
      name: null == name
          ? _value.name
          : name // ignore: cast_nullable_to_non_nullable
              as String,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$TaskTriggeredImpl implements TaskTriggered {
  const _$TaskTriggeredImpl(
      {required this.slug, required this.name, final String? $type})
      : $type = $type ?? 'task-triggered';

  factory _$TaskTriggeredImpl.fromJson(Map<String, dynamic> json) =>
      _$$TaskTriggeredImplFromJson(json);

  @override
  final String slug;
  @override
  final String name;

  @JsonKey(name: 'type')
  final String $type;

  @override
  String toString() {
    return 'DaziEvent.taskTriggered(slug: $slug, name: $name)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$TaskTriggeredImpl &&
            (identical(other.slug, slug) || other.slug == slug) &&
            (identical(other.name, name) || other.name == name));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(runtimeType, slug, name);

  /// Create a copy of DaziEvent
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$TaskTriggeredImplCopyWith<_$TaskTriggeredImpl> get copyWith =>
      __$$TaskTriggeredImplCopyWithImpl<_$TaskTriggeredImpl>(this, _$identity);

  @override
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function(String slug, String name) taskTriggered,
    required TResult Function(String slug, String name, bool ok, String summary,
            @JsonKey(name: 'run_id') String runId, List<String> artifacts)
        taskCompleted,
    required TResult Function(
            String slug,
            String name,
            @JsonKey(name: 'approval_id') String approvalId,
            String plan,
            UsageEstimate? estimate)
        approvalRequested,
    required TResult Function(String slug,
            @JsonKey(name: 'approval_id') String approvalId, bool approved)
        approvalResolved,
    required TResult Function(
            String slug, String name, String? assignee, String by)
        taskAssigned,
    required TResult Function(String slug, String name, List<String> mentions,
            String by, String text)
        mentioned,
  }) {
    return taskTriggered(slug, name);
  }

  @override
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function(String slug, String name)? taskTriggered,
    TResult? Function(String slug, String name, bool ok, String summary,
            @JsonKey(name: 'run_id') String runId, List<String> artifacts)?
        taskCompleted,
    TResult? Function(
            String slug,
            String name,
            @JsonKey(name: 'approval_id') String approvalId,
            String plan,
            UsageEstimate? estimate)?
        approvalRequested,
    TResult? Function(String slug,
            @JsonKey(name: 'approval_id') String approvalId, bool approved)?
        approvalResolved,
    TResult? Function(String slug, String name, String? assignee, String by)?
        taskAssigned,
    TResult? Function(String slug, String name, List<String> mentions,
            String by, String text)?
        mentioned,
  }) {
    return taskTriggered?.call(slug, name);
  }

  @override
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function(String slug, String name)? taskTriggered,
    TResult Function(String slug, String name, bool ok, String summary,
            @JsonKey(name: 'run_id') String runId, List<String> artifacts)?
        taskCompleted,
    TResult Function(
            String slug,
            String name,
            @JsonKey(name: 'approval_id') String approvalId,
            String plan,
            UsageEstimate? estimate)?
        approvalRequested,
    TResult Function(String slug,
            @JsonKey(name: 'approval_id') String approvalId, bool approved)?
        approvalResolved,
    TResult Function(String slug, String name, String? assignee, String by)?
        taskAssigned,
    TResult Function(String slug, String name, List<String> mentions, String by,
            String text)?
        mentioned,
    required TResult orElse(),
  }) {
    if (taskTriggered != null) {
      return taskTriggered(slug, name);
    }
    return orElse();
  }

  @override
  @optionalTypeArgs
  TResult map<TResult extends Object?>({
    required TResult Function(TaskTriggered value) taskTriggered,
    required TResult Function(TaskCompleted value) taskCompleted,
    required TResult Function(ApprovalRequested value) approvalRequested,
    required TResult Function(ApprovalResolved value) approvalResolved,
    required TResult Function(TaskAssigned value) taskAssigned,
    required TResult Function(Mentioned value) mentioned,
  }) {
    return taskTriggered(this);
  }

  @override
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(TaskTriggered value)? taskTriggered,
    TResult? Function(TaskCompleted value)? taskCompleted,
    TResult? Function(ApprovalRequested value)? approvalRequested,
    TResult? Function(ApprovalResolved value)? approvalResolved,
    TResult? Function(TaskAssigned value)? taskAssigned,
    TResult? Function(Mentioned value)? mentioned,
  }) {
    return taskTriggered?.call(this);
  }

  @override
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(TaskTriggered value)? taskTriggered,
    TResult Function(TaskCompleted value)? taskCompleted,
    TResult Function(ApprovalRequested value)? approvalRequested,
    TResult Function(ApprovalResolved value)? approvalResolved,
    TResult Function(TaskAssigned value)? taskAssigned,
    TResult Function(Mentioned value)? mentioned,
    required TResult orElse(),
  }) {
    if (taskTriggered != null) {
      return taskTriggered(this);
    }
    return orElse();
  }

  @override
  Map<String, dynamic> toJson() {
    return _$$TaskTriggeredImplToJson(
      this,
    );
  }
}

abstract class TaskTriggered implements DaziEvent {
  const factory TaskTriggered(
      {required final String slug,
      required final String name}) = _$TaskTriggeredImpl;

  factory TaskTriggered.fromJson(Map<String, dynamic> json) =
      _$TaskTriggeredImpl.fromJson;

  @override
  String get slug;
  String get name;

  /// Create a copy of DaziEvent
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$TaskTriggeredImplCopyWith<_$TaskTriggeredImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class _$$TaskCompletedImplCopyWith<$Res>
    implements $DaziEventCopyWith<$Res> {
  factory _$$TaskCompletedImplCopyWith(
          _$TaskCompletedImpl value, $Res Function(_$TaskCompletedImpl) then) =
      __$$TaskCompletedImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {String slug,
      String name,
      bool ok,
      String summary,
      @JsonKey(name: 'run_id') String runId,
      List<String> artifacts});
}

/// @nodoc
class __$$TaskCompletedImplCopyWithImpl<$Res>
    extends _$DaziEventCopyWithImpl<$Res, _$TaskCompletedImpl>
    implements _$$TaskCompletedImplCopyWith<$Res> {
  __$$TaskCompletedImplCopyWithImpl(
      _$TaskCompletedImpl _value, $Res Function(_$TaskCompletedImpl) _then)
      : super(_value, _then);

  /// Create a copy of DaziEvent
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? slug = null,
    Object? name = null,
    Object? ok = null,
    Object? summary = null,
    Object? runId = null,
    Object? artifacts = null,
  }) {
    return _then(_$TaskCompletedImpl(
      slug: null == slug
          ? _value.slug
          : slug // ignore: cast_nullable_to_non_nullable
              as String,
      name: null == name
          ? _value.name
          : name // ignore: cast_nullable_to_non_nullable
              as String,
      ok: null == ok
          ? _value.ok
          : ok // ignore: cast_nullable_to_non_nullable
              as bool,
      summary: null == summary
          ? _value.summary
          : summary // ignore: cast_nullable_to_non_nullable
              as String,
      runId: null == runId
          ? _value.runId
          : runId // ignore: cast_nullable_to_non_nullable
              as String,
      artifacts: null == artifacts
          ? _value._artifacts
          : artifacts // ignore: cast_nullable_to_non_nullable
              as List<String>,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$TaskCompletedImpl implements TaskCompleted {
  const _$TaskCompletedImpl(
      {required this.slug,
      required this.name,
      required this.ok,
      required this.summary,
      @JsonKey(name: 'run_id') this.runId = '',
      final List<String> artifacts = const [],
      final String? $type})
      : _artifacts = artifacts,
        $type = $type ?? 'task-completed';

  factory _$TaskCompletedImpl.fromJson(Map<String, dynamic> json) =>
      _$$TaskCompletedImplFromJson(json);

  @override
  final String slug;
  @override
  final String name;
  @override
  final bool ok;
  @override
  final String summary;
// 运行记录 id 与产物清单；旧 daemon 没有这两个字段，向后兼容默认空。
  @override
  @JsonKey(name: 'run_id')
  final String runId;
  final List<String> _artifacts;
  @override
  @JsonKey()
  List<String> get artifacts {
    if (_artifacts is EqualUnmodifiableListView) return _artifacts;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_artifacts);
  }

  @JsonKey(name: 'type')
  final String $type;

  @override
  String toString() {
    return 'DaziEvent.taskCompleted(slug: $slug, name: $name, ok: $ok, summary: $summary, runId: $runId, artifacts: $artifacts)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$TaskCompletedImpl &&
            (identical(other.slug, slug) || other.slug == slug) &&
            (identical(other.name, name) || other.name == name) &&
            (identical(other.ok, ok) || other.ok == ok) &&
            (identical(other.summary, summary) || other.summary == summary) &&
            (identical(other.runId, runId) || other.runId == runId) &&
            const DeepCollectionEquality()
                .equals(other._artifacts, _artifacts));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(runtimeType, slug, name, ok, summary, runId,
      const DeepCollectionEquality().hash(_artifacts));

  /// Create a copy of DaziEvent
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$TaskCompletedImplCopyWith<_$TaskCompletedImpl> get copyWith =>
      __$$TaskCompletedImplCopyWithImpl<_$TaskCompletedImpl>(this, _$identity);

  @override
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function(String slug, String name) taskTriggered,
    required TResult Function(String slug, String name, bool ok, String summary,
            @JsonKey(name: 'run_id') String runId, List<String> artifacts)
        taskCompleted,
    required TResult Function(
            String slug,
            String name,
            @JsonKey(name: 'approval_id') String approvalId,
            String plan,
            UsageEstimate? estimate)
        approvalRequested,
    required TResult Function(String slug,
            @JsonKey(name: 'approval_id') String approvalId, bool approved)
        approvalResolved,
    required TResult Function(
            String slug, String name, String? assignee, String by)
        taskAssigned,
    required TResult Function(String slug, String name, List<String> mentions,
            String by, String text)
        mentioned,
  }) {
    return taskCompleted(slug, name, ok, summary, runId, artifacts);
  }

  @override
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function(String slug, String name)? taskTriggered,
    TResult? Function(String slug, String name, bool ok, String summary,
            @JsonKey(name: 'run_id') String runId, List<String> artifacts)?
        taskCompleted,
    TResult? Function(
            String slug,
            String name,
            @JsonKey(name: 'approval_id') String approvalId,
            String plan,
            UsageEstimate? estimate)?
        approvalRequested,
    TResult? Function(String slug,
            @JsonKey(name: 'approval_id') String approvalId, bool approved)?
        approvalResolved,
    TResult? Function(String slug, String name, String? assignee, String by)?
        taskAssigned,
    TResult? Function(String slug, String name, List<String> mentions,
            String by, String text)?
        mentioned,
  }) {
    return taskCompleted?.call(slug, name, ok, summary, runId, artifacts);
  }

  @override
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function(String slug, String name)? taskTriggered,
    TResult Function(String slug, String name, bool ok, String summary,
            @JsonKey(name: 'run_id') String runId, List<String> artifacts)?
        taskCompleted,
    TResult Function(
            String slug,
            String name,
            @JsonKey(name: 'approval_id') String approvalId,
            String plan,
            UsageEstimate? estimate)?
        approvalRequested,
    TResult Function(String slug,
            @JsonKey(name: 'approval_id') String approvalId, bool approved)?
        approvalResolved,
    TResult Function(String slug, String name, String? assignee, String by)?
        taskAssigned,
    TResult Function(String slug, String name, List<String> mentions, String by,
            String text)?
        mentioned,
    required TResult orElse(),
  }) {
    if (taskCompleted != null) {
      return taskCompleted(slug, name, ok, summary, runId, artifacts);
    }
    return orElse();
  }

  @override
  @optionalTypeArgs
  TResult map<TResult extends Object?>({
    required TResult Function(TaskTriggered value) taskTriggered,
    required TResult Function(TaskCompleted value) taskCompleted,
    required TResult Function(ApprovalRequested value) approvalRequested,
    required TResult Function(ApprovalResolved value) approvalResolved,
    required TResult Function(TaskAssigned value) taskAssigned,
    required TResult Function(Mentioned value) mentioned,
  }) {
    return taskCompleted(this);
  }

  @override
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(TaskTriggered value)? taskTriggered,
    TResult? Function(TaskCompleted value)? taskCompleted,
    TResult? Function(ApprovalRequested value)? approvalRequested,
    TResult? Function(ApprovalResolved value)? approvalResolved,
    TResult? Function(TaskAssigned value)? taskAssigned,
    TResult? Function(Mentioned value)? mentioned,
  }) {
    return taskCompleted?.call(this);
  }

  @override
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(TaskTriggered value)? taskTriggered,
    TResult Function(TaskCompleted value)? taskCompleted,
    TResult Function(ApprovalRequested value)? approvalRequested,
    TResult Function(ApprovalResolved value)? approvalResolved,
    TResult Function(TaskAssigned value)? taskAssigned,
    TResult Function(Mentioned value)? mentioned,
    required TResult orElse(),
  }) {
    if (taskCompleted != null) {
      return taskCompleted(this);
    }
    return orElse();
  }

  @override
  Map<String, dynamic> toJson() {
    return _$$TaskCompletedImplToJson(
      this,
    );
  }
}

abstract class TaskCompleted implements DaziEvent {
  const factory TaskCompleted(
      {required final String slug,
      required final String name,
      required final bool ok,
      required final String summary,
      @JsonKey(name: 'run_id') final String runId,
      final List<String> artifacts}) = _$TaskCompletedImpl;

  factory TaskCompleted.fromJson(Map<String, dynamic> json) =
      _$TaskCompletedImpl.fromJson;

  @override
  String get slug;
  String get name;
  bool get ok;
  String get summary; // 运行记录 id 与产物清单；旧 daemon 没有这两个字段，向后兼容默认空。
  @JsonKey(name: 'run_id')
  String get runId;
  List<String> get artifacts;

  /// Create a copy of DaziEvent
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$TaskCompletedImplCopyWith<_$TaskCompletedImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class _$$ApprovalRequestedImplCopyWith<$Res>
    implements $DaziEventCopyWith<$Res> {
  factory _$$ApprovalRequestedImplCopyWith(_$ApprovalRequestedImpl value,
          $Res Function(_$ApprovalRequestedImpl) then) =
      __$$ApprovalRequestedImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {String slug,
      String name,
      @JsonKey(name: 'approval_id') String approvalId,
      String plan,
      UsageEstimate? estimate});

  $UsageEstimateCopyWith<$Res>? get estimate;
}

/// @nodoc
class __$$ApprovalRequestedImplCopyWithImpl<$Res>
    extends _$DaziEventCopyWithImpl<$Res, _$ApprovalRequestedImpl>
    implements _$$ApprovalRequestedImplCopyWith<$Res> {
  __$$ApprovalRequestedImplCopyWithImpl(_$ApprovalRequestedImpl _value,
      $Res Function(_$ApprovalRequestedImpl) _then)
      : super(_value, _then);

  /// Create a copy of DaziEvent
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? slug = null,
    Object? name = null,
    Object? approvalId = null,
    Object? plan = null,
    Object? estimate = freezed,
  }) {
    return _then(_$ApprovalRequestedImpl(
      slug: null == slug
          ? _value.slug
          : slug // ignore: cast_nullable_to_non_nullable
              as String,
      name: null == name
          ? _value.name
          : name // ignore: cast_nullable_to_non_nullable
              as String,
      approvalId: null == approvalId
          ? _value.approvalId
          : approvalId // ignore: cast_nullable_to_non_nullable
              as String,
      plan: null == plan
          ? _value.plan
          : plan // ignore: cast_nullable_to_non_nullable
              as String,
      estimate: freezed == estimate
          ? _value.estimate
          : estimate // ignore: cast_nullable_to_non_nullable
              as UsageEstimate?,
    ));
  }

  /// Create a copy of DaziEvent
  /// with the given fields replaced by the non-null parameter values.
  @override
  @pragma('vm:prefer-inline')
  $UsageEstimateCopyWith<$Res>? get estimate {
    if (_value.estimate == null) {
      return null;
    }

    return $UsageEstimateCopyWith<$Res>(_value.estimate!, (value) {
      return _then(_value.copyWith(estimate: value));
    });
  }
}

/// @nodoc
@JsonSerializable()
class _$ApprovalRequestedImpl implements ApprovalRequested {
  const _$ApprovalRequestedImpl(
      {required this.slug,
      required this.name,
      @JsonKey(name: 'approval_id') required this.approvalId,
      required this.plan,
      this.estimate,
      final String? $type})
      : $type = $type ?? 'approval-requested';

  factory _$ApprovalRequestedImpl.fromJson(Map<String, dynamic> json) =>
      _$$ApprovalRequestedImplFromJson(json);

  @override
  final String slug;
  @override
  final String name;
  @override
  @JsonKey(name: 'approval_id')
  final String approvalId;
  @override
  final String plan;
// 用量/费用预估；无历史时为 null。
  @override
  final UsageEstimate? estimate;

  @JsonKey(name: 'type')
  final String $type;

  @override
  String toString() {
    return 'DaziEvent.approvalRequested(slug: $slug, name: $name, approvalId: $approvalId, plan: $plan, estimate: $estimate)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$ApprovalRequestedImpl &&
            (identical(other.slug, slug) || other.slug == slug) &&
            (identical(other.name, name) || other.name == name) &&
            (identical(other.approvalId, approvalId) ||
                other.approvalId == approvalId) &&
            (identical(other.plan, plan) || other.plan == plan) &&
            (identical(other.estimate, estimate) ||
                other.estimate == estimate));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode =>
      Object.hash(runtimeType, slug, name, approvalId, plan, estimate);

  /// Create a copy of DaziEvent
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$ApprovalRequestedImplCopyWith<_$ApprovalRequestedImpl> get copyWith =>
      __$$ApprovalRequestedImplCopyWithImpl<_$ApprovalRequestedImpl>(
          this, _$identity);

  @override
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function(String slug, String name) taskTriggered,
    required TResult Function(String slug, String name, bool ok, String summary,
            @JsonKey(name: 'run_id') String runId, List<String> artifacts)
        taskCompleted,
    required TResult Function(
            String slug,
            String name,
            @JsonKey(name: 'approval_id') String approvalId,
            String plan,
            UsageEstimate? estimate)
        approvalRequested,
    required TResult Function(String slug,
            @JsonKey(name: 'approval_id') String approvalId, bool approved)
        approvalResolved,
    required TResult Function(
            String slug, String name, String? assignee, String by)
        taskAssigned,
    required TResult Function(String slug, String name, List<String> mentions,
            String by, String text)
        mentioned,
  }) {
    return approvalRequested(slug, name, approvalId, plan, estimate);
  }

  @override
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function(String slug, String name)? taskTriggered,
    TResult? Function(String slug, String name, bool ok, String summary,
            @JsonKey(name: 'run_id') String runId, List<String> artifacts)?
        taskCompleted,
    TResult? Function(
            String slug,
            String name,
            @JsonKey(name: 'approval_id') String approvalId,
            String plan,
            UsageEstimate? estimate)?
        approvalRequested,
    TResult? Function(String slug,
            @JsonKey(name: 'approval_id') String approvalId, bool approved)?
        approvalResolved,
    TResult? Function(String slug, String name, String? assignee, String by)?
        taskAssigned,
    TResult? Function(String slug, String name, List<String> mentions,
            String by, String text)?
        mentioned,
  }) {
    return approvalRequested?.call(slug, name, approvalId, plan, estimate);
  }

  @override
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function(String slug, String name)? taskTriggered,
    TResult Function(String slug, String name, bool ok, String summary,
            @JsonKey(name: 'run_id') String runId, List<String> artifacts)?
        taskCompleted,
    TResult Function(
            String slug,
            String name,
            @JsonKey(name: 'approval_id') String approvalId,
            String plan,
            UsageEstimate? estimate)?
        approvalRequested,
    TResult Function(String slug,
            @JsonKey(name: 'approval_id') String approvalId, bool approved)?
        approvalResolved,
    TResult Function(String slug, String name, String? assignee, String by)?
        taskAssigned,
    TResult Function(String slug, String name, List<String> mentions, String by,
            String text)?
        mentioned,
    required TResult orElse(),
  }) {
    if (approvalRequested != null) {
      return approvalRequested(slug, name, approvalId, plan, estimate);
    }
    return orElse();
  }

  @override
  @optionalTypeArgs
  TResult map<TResult extends Object?>({
    required TResult Function(TaskTriggered value) taskTriggered,
    required TResult Function(TaskCompleted value) taskCompleted,
    required TResult Function(ApprovalRequested value) approvalRequested,
    required TResult Function(ApprovalResolved value) approvalResolved,
    required TResult Function(TaskAssigned value) taskAssigned,
    required TResult Function(Mentioned value) mentioned,
  }) {
    return approvalRequested(this);
  }

  @override
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(TaskTriggered value)? taskTriggered,
    TResult? Function(TaskCompleted value)? taskCompleted,
    TResult? Function(ApprovalRequested value)? approvalRequested,
    TResult? Function(ApprovalResolved value)? approvalResolved,
    TResult? Function(TaskAssigned value)? taskAssigned,
    TResult? Function(Mentioned value)? mentioned,
  }) {
    return approvalRequested?.call(this);
  }

  @override
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(TaskTriggered value)? taskTriggered,
    TResult Function(TaskCompleted value)? taskCompleted,
    TResult Function(ApprovalRequested value)? approvalRequested,
    TResult Function(ApprovalResolved value)? approvalResolved,
    TResult Function(TaskAssigned value)? taskAssigned,
    TResult Function(Mentioned value)? mentioned,
    required TResult orElse(),
  }) {
    if (approvalRequested != null) {
      return approvalRequested(this);
    }
    return orElse();
  }

  @override
  Map<String, dynamic> toJson() {
    return _$$ApprovalRequestedImplToJson(
      this,
    );
  }
}

abstract class ApprovalRequested implements DaziEvent {
  const factory ApprovalRequested(
      {required final String slug,
      required final String name,
      @JsonKey(name: 'approval_id') required final String approvalId,
      required final String plan,
      final UsageEstimate? estimate}) = _$ApprovalRequestedImpl;

  factory ApprovalRequested.fromJson(Map<String, dynamic> json) =
      _$ApprovalRequestedImpl.fromJson;

  @override
  String get slug;
  String get name;
  @JsonKey(name: 'approval_id')
  String get approvalId;
  String get plan; // 用量/费用预估；无历史时为 null。
  UsageEstimate? get estimate;

  /// Create a copy of DaziEvent
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$ApprovalRequestedImplCopyWith<_$ApprovalRequestedImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class _$$ApprovalResolvedImplCopyWith<$Res>
    implements $DaziEventCopyWith<$Res> {
  factory _$$ApprovalResolvedImplCopyWith(_$ApprovalResolvedImpl value,
          $Res Function(_$ApprovalResolvedImpl) then) =
      __$$ApprovalResolvedImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {String slug,
      @JsonKey(name: 'approval_id') String approvalId,
      bool approved});
}

/// @nodoc
class __$$ApprovalResolvedImplCopyWithImpl<$Res>
    extends _$DaziEventCopyWithImpl<$Res, _$ApprovalResolvedImpl>
    implements _$$ApprovalResolvedImplCopyWith<$Res> {
  __$$ApprovalResolvedImplCopyWithImpl(_$ApprovalResolvedImpl _value,
      $Res Function(_$ApprovalResolvedImpl) _then)
      : super(_value, _then);

  /// Create a copy of DaziEvent
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? slug = null,
    Object? approvalId = null,
    Object? approved = null,
  }) {
    return _then(_$ApprovalResolvedImpl(
      slug: null == slug
          ? _value.slug
          : slug // ignore: cast_nullable_to_non_nullable
              as String,
      approvalId: null == approvalId
          ? _value.approvalId
          : approvalId // ignore: cast_nullable_to_non_nullable
              as String,
      approved: null == approved
          ? _value.approved
          : approved // ignore: cast_nullable_to_non_nullable
              as bool,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$ApprovalResolvedImpl implements ApprovalResolved {
  const _$ApprovalResolvedImpl(
      {required this.slug,
      @JsonKey(name: 'approval_id') required this.approvalId,
      required this.approved,
      final String? $type})
      : $type = $type ?? 'approval-resolved';

  factory _$ApprovalResolvedImpl.fromJson(Map<String, dynamic> json) =>
      _$$ApprovalResolvedImplFromJson(json);

  @override
  final String slug;
  @override
  @JsonKey(name: 'approval_id')
  final String approvalId;
  @override
  final bool approved;

  @JsonKey(name: 'type')
  final String $type;

  @override
  String toString() {
    return 'DaziEvent.approvalResolved(slug: $slug, approvalId: $approvalId, approved: $approved)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$ApprovalResolvedImpl &&
            (identical(other.slug, slug) || other.slug == slug) &&
            (identical(other.approvalId, approvalId) ||
                other.approvalId == approvalId) &&
            (identical(other.approved, approved) ||
                other.approved == approved));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(runtimeType, slug, approvalId, approved);

  /// Create a copy of DaziEvent
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$ApprovalResolvedImplCopyWith<_$ApprovalResolvedImpl> get copyWith =>
      __$$ApprovalResolvedImplCopyWithImpl<_$ApprovalResolvedImpl>(
          this, _$identity);

  @override
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function(String slug, String name) taskTriggered,
    required TResult Function(String slug, String name, bool ok, String summary,
            @JsonKey(name: 'run_id') String runId, List<String> artifacts)
        taskCompleted,
    required TResult Function(
            String slug,
            String name,
            @JsonKey(name: 'approval_id') String approvalId,
            String plan,
            UsageEstimate? estimate)
        approvalRequested,
    required TResult Function(String slug,
            @JsonKey(name: 'approval_id') String approvalId, bool approved)
        approvalResolved,
    required TResult Function(
            String slug, String name, String? assignee, String by)
        taskAssigned,
    required TResult Function(String slug, String name, List<String> mentions,
            String by, String text)
        mentioned,
  }) {
    return approvalResolved(slug, approvalId, approved);
  }

  @override
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function(String slug, String name)? taskTriggered,
    TResult? Function(String slug, String name, bool ok, String summary,
            @JsonKey(name: 'run_id') String runId, List<String> artifacts)?
        taskCompleted,
    TResult? Function(
            String slug,
            String name,
            @JsonKey(name: 'approval_id') String approvalId,
            String plan,
            UsageEstimate? estimate)?
        approvalRequested,
    TResult? Function(String slug,
            @JsonKey(name: 'approval_id') String approvalId, bool approved)?
        approvalResolved,
    TResult? Function(String slug, String name, String? assignee, String by)?
        taskAssigned,
    TResult? Function(String slug, String name, List<String> mentions,
            String by, String text)?
        mentioned,
  }) {
    return approvalResolved?.call(slug, approvalId, approved);
  }

  @override
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function(String slug, String name)? taskTriggered,
    TResult Function(String slug, String name, bool ok, String summary,
            @JsonKey(name: 'run_id') String runId, List<String> artifacts)?
        taskCompleted,
    TResult Function(
            String slug,
            String name,
            @JsonKey(name: 'approval_id') String approvalId,
            String plan,
            UsageEstimate? estimate)?
        approvalRequested,
    TResult Function(String slug,
            @JsonKey(name: 'approval_id') String approvalId, bool approved)?
        approvalResolved,
    TResult Function(String slug, String name, String? assignee, String by)?
        taskAssigned,
    TResult Function(String slug, String name, List<String> mentions, String by,
            String text)?
        mentioned,
    required TResult orElse(),
  }) {
    if (approvalResolved != null) {
      return approvalResolved(slug, approvalId, approved);
    }
    return orElse();
  }

  @override
  @optionalTypeArgs
  TResult map<TResult extends Object?>({
    required TResult Function(TaskTriggered value) taskTriggered,
    required TResult Function(TaskCompleted value) taskCompleted,
    required TResult Function(ApprovalRequested value) approvalRequested,
    required TResult Function(ApprovalResolved value) approvalResolved,
    required TResult Function(TaskAssigned value) taskAssigned,
    required TResult Function(Mentioned value) mentioned,
  }) {
    return approvalResolved(this);
  }

  @override
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(TaskTriggered value)? taskTriggered,
    TResult? Function(TaskCompleted value)? taskCompleted,
    TResult? Function(ApprovalRequested value)? approvalRequested,
    TResult? Function(ApprovalResolved value)? approvalResolved,
    TResult? Function(TaskAssigned value)? taskAssigned,
    TResult? Function(Mentioned value)? mentioned,
  }) {
    return approvalResolved?.call(this);
  }

  @override
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(TaskTriggered value)? taskTriggered,
    TResult Function(TaskCompleted value)? taskCompleted,
    TResult Function(ApprovalRequested value)? approvalRequested,
    TResult Function(ApprovalResolved value)? approvalResolved,
    TResult Function(TaskAssigned value)? taskAssigned,
    TResult Function(Mentioned value)? mentioned,
    required TResult orElse(),
  }) {
    if (approvalResolved != null) {
      return approvalResolved(this);
    }
    return orElse();
  }

  @override
  Map<String, dynamic> toJson() {
    return _$$ApprovalResolvedImplToJson(
      this,
    );
  }
}

abstract class ApprovalResolved implements DaziEvent {
  const factory ApprovalResolved(
      {required final String slug,
      @JsonKey(name: 'approval_id') required final String approvalId,
      required final bool approved}) = _$ApprovalResolvedImpl;

  factory ApprovalResolved.fromJson(Map<String, dynamic> json) =
      _$ApprovalResolvedImpl.fromJson;

  @override
  String get slug;
  @JsonKey(name: 'approval_id')
  String get approvalId;
  bool get approved;

  /// Create a copy of DaziEvent
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$ApprovalResolvedImplCopyWith<_$ApprovalResolvedImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class _$$TaskAssignedImplCopyWith<$Res>
    implements $DaziEventCopyWith<$Res> {
  factory _$$TaskAssignedImplCopyWith(
          _$TaskAssignedImpl value, $Res Function(_$TaskAssignedImpl) then) =
      __$$TaskAssignedImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({String slug, String name, String? assignee, String by});
}

/// @nodoc
class __$$TaskAssignedImplCopyWithImpl<$Res>
    extends _$DaziEventCopyWithImpl<$Res, _$TaskAssignedImpl>
    implements _$$TaskAssignedImplCopyWith<$Res> {
  __$$TaskAssignedImplCopyWithImpl(
      _$TaskAssignedImpl _value, $Res Function(_$TaskAssignedImpl) _then)
      : super(_value, _then);

  /// Create a copy of DaziEvent
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? slug = null,
    Object? name = null,
    Object? assignee = freezed,
    Object? by = null,
  }) {
    return _then(_$TaskAssignedImpl(
      slug: null == slug
          ? _value.slug
          : slug // ignore: cast_nullable_to_non_nullable
              as String,
      name: null == name
          ? _value.name
          : name // ignore: cast_nullable_to_non_nullable
              as String,
      assignee: freezed == assignee
          ? _value.assignee
          : assignee // ignore: cast_nullable_to_non_nullable
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
class _$TaskAssignedImpl implements TaskAssigned {
  const _$TaskAssignedImpl(
      {required this.slug,
      required this.name,
      this.assignee,
      required this.by,
      final String? $type})
      : $type = $type ?? 'task-assigned';

  factory _$TaskAssignedImpl.fromJson(Map<String, dynamic> json) =>
      _$$TaskAssignedImplFromJson(json);

  @override
  final String slug;
  @override
  final String name;
  @override
  final String? assignee;
  @override
  final String by;

  @JsonKey(name: 'type')
  final String $type;

  @override
  String toString() {
    return 'DaziEvent.taskAssigned(slug: $slug, name: $name, assignee: $assignee, by: $by)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$TaskAssignedImpl &&
            (identical(other.slug, slug) || other.slug == slug) &&
            (identical(other.name, name) || other.name == name) &&
            (identical(other.assignee, assignee) ||
                other.assignee == assignee) &&
            (identical(other.by, by) || other.by == by));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(runtimeType, slug, name, assignee, by);

  /// Create a copy of DaziEvent
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$TaskAssignedImplCopyWith<_$TaskAssignedImpl> get copyWith =>
      __$$TaskAssignedImplCopyWithImpl<_$TaskAssignedImpl>(this, _$identity);

  @override
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function(String slug, String name) taskTriggered,
    required TResult Function(String slug, String name, bool ok, String summary,
            @JsonKey(name: 'run_id') String runId, List<String> artifacts)
        taskCompleted,
    required TResult Function(
            String slug,
            String name,
            @JsonKey(name: 'approval_id') String approvalId,
            String plan,
            UsageEstimate? estimate)
        approvalRequested,
    required TResult Function(String slug,
            @JsonKey(name: 'approval_id') String approvalId, bool approved)
        approvalResolved,
    required TResult Function(
            String slug, String name, String? assignee, String by)
        taskAssigned,
    required TResult Function(String slug, String name, List<String> mentions,
            String by, String text)
        mentioned,
  }) {
    return taskAssigned(slug, name, assignee, by);
  }

  @override
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function(String slug, String name)? taskTriggered,
    TResult? Function(String slug, String name, bool ok, String summary,
            @JsonKey(name: 'run_id') String runId, List<String> artifacts)?
        taskCompleted,
    TResult? Function(
            String slug,
            String name,
            @JsonKey(name: 'approval_id') String approvalId,
            String plan,
            UsageEstimate? estimate)?
        approvalRequested,
    TResult? Function(String slug,
            @JsonKey(name: 'approval_id') String approvalId, bool approved)?
        approvalResolved,
    TResult? Function(String slug, String name, String? assignee, String by)?
        taskAssigned,
    TResult? Function(String slug, String name, List<String> mentions,
            String by, String text)?
        mentioned,
  }) {
    return taskAssigned?.call(slug, name, assignee, by);
  }

  @override
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function(String slug, String name)? taskTriggered,
    TResult Function(String slug, String name, bool ok, String summary,
            @JsonKey(name: 'run_id') String runId, List<String> artifacts)?
        taskCompleted,
    TResult Function(
            String slug,
            String name,
            @JsonKey(name: 'approval_id') String approvalId,
            String plan,
            UsageEstimate? estimate)?
        approvalRequested,
    TResult Function(String slug,
            @JsonKey(name: 'approval_id') String approvalId, bool approved)?
        approvalResolved,
    TResult Function(String slug, String name, String? assignee, String by)?
        taskAssigned,
    TResult Function(String slug, String name, List<String> mentions, String by,
            String text)?
        mentioned,
    required TResult orElse(),
  }) {
    if (taskAssigned != null) {
      return taskAssigned(slug, name, assignee, by);
    }
    return orElse();
  }

  @override
  @optionalTypeArgs
  TResult map<TResult extends Object?>({
    required TResult Function(TaskTriggered value) taskTriggered,
    required TResult Function(TaskCompleted value) taskCompleted,
    required TResult Function(ApprovalRequested value) approvalRequested,
    required TResult Function(ApprovalResolved value) approvalResolved,
    required TResult Function(TaskAssigned value) taskAssigned,
    required TResult Function(Mentioned value) mentioned,
  }) {
    return taskAssigned(this);
  }

  @override
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(TaskTriggered value)? taskTriggered,
    TResult? Function(TaskCompleted value)? taskCompleted,
    TResult? Function(ApprovalRequested value)? approvalRequested,
    TResult? Function(ApprovalResolved value)? approvalResolved,
    TResult? Function(TaskAssigned value)? taskAssigned,
    TResult? Function(Mentioned value)? mentioned,
  }) {
    return taskAssigned?.call(this);
  }

  @override
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(TaskTriggered value)? taskTriggered,
    TResult Function(TaskCompleted value)? taskCompleted,
    TResult Function(ApprovalRequested value)? approvalRequested,
    TResult Function(ApprovalResolved value)? approvalResolved,
    TResult Function(TaskAssigned value)? taskAssigned,
    TResult Function(Mentioned value)? mentioned,
    required TResult orElse(),
  }) {
    if (taskAssigned != null) {
      return taskAssigned(this);
    }
    return orElse();
  }

  @override
  Map<String, dynamic> toJson() {
    return _$$TaskAssignedImplToJson(
      this,
    );
  }
}

abstract class TaskAssigned implements DaziEvent {
  const factory TaskAssigned(
      {required final String slug,
      required final String name,
      final String? assignee,
      required final String by}) = _$TaskAssignedImpl;

  factory TaskAssigned.fromJson(Map<String, dynamic> json) =
      _$TaskAssignedImpl.fromJson;

  @override
  String get slug;
  String get name;
  String? get assignee;
  String get by;

  /// Create a copy of DaziEvent
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$TaskAssignedImplCopyWith<_$TaskAssignedImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class _$$MentionedImplCopyWith<$Res>
    implements $DaziEventCopyWith<$Res> {
  factory _$$MentionedImplCopyWith(
          _$MentionedImpl value, $Res Function(_$MentionedImpl) then) =
      __$$MentionedImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {String slug,
      String name,
      List<String> mentions,
      String by,
      String text});
}

/// @nodoc
class __$$MentionedImplCopyWithImpl<$Res>
    extends _$DaziEventCopyWithImpl<$Res, _$MentionedImpl>
    implements _$$MentionedImplCopyWith<$Res> {
  __$$MentionedImplCopyWithImpl(
      _$MentionedImpl _value, $Res Function(_$MentionedImpl) _then)
      : super(_value, _then);

  /// Create a copy of DaziEvent
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? slug = null,
    Object? name = null,
    Object? mentions = null,
    Object? by = null,
    Object? text = null,
  }) {
    return _then(_$MentionedImpl(
      slug: null == slug
          ? _value.slug
          : slug // ignore: cast_nullable_to_non_nullable
              as String,
      name: null == name
          ? _value.name
          : name // ignore: cast_nullable_to_non_nullable
              as String,
      mentions: null == mentions
          ? _value._mentions
          : mentions // ignore: cast_nullable_to_non_nullable
              as List<String>,
      by: null == by
          ? _value.by
          : by // ignore: cast_nullable_to_non_nullable
              as String,
      text: null == text
          ? _value.text
          : text // ignore: cast_nullable_to_non_nullable
              as String,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$MentionedImpl implements Mentioned {
  const _$MentionedImpl(
      {required this.slug,
      required this.name,
      final List<String> mentions = const <String>[],
      required this.by,
      required this.text,
      final String? $type})
      : _mentions = mentions,
        $type = $type ?? 'mentioned';

  factory _$MentionedImpl.fromJson(Map<String, dynamic> json) =>
      _$$MentionedImplFromJson(json);

  @override
  final String slug;
  @override
  final String name;
  final List<String> _mentions;
  @override
  @JsonKey()
  List<String> get mentions {
    if (_mentions is EqualUnmodifiableListView) return _mentions;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_mentions);
  }

  @override
  final String by;
  @override
  final String text;

  @JsonKey(name: 'type')
  final String $type;

  @override
  String toString() {
    return 'DaziEvent.mentioned(slug: $slug, name: $name, mentions: $mentions, by: $by, text: $text)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$MentionedImpl &&
            (identical(other.slug, slug) || other.slug == slug) &&
            (identical(other.name, name) || other.name == name) &&
            const DeepCollectionEquality().equals(other._mentions, _mentions) &&
            (identical(other.by, by) || other.by == by) &&
            (identical(other.text, text) || other.text == text));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(runtimeType, slug, name,
      const DeepCollectionEquality().hash(_mentions), by, text);

  /// Create a copy of DaziEvent
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$MentionedImplCopyWith<_$MentionedImpl> get copyWith =>
      __$$MentionedImplCopyWithImpl<_$MentionedImpl>(this, _$identity);

  @override
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function(String slug, String name) taskTriggered,
    required TResult Function(String slug, String name, bool ok, String summary,
            @JsonKey(name: 'run_id') String runId, List<String> artifacts)
        taskCompleted,
    required TResult Function(
            String slug,
            String name,
            @JsonKey(name: 'approval_id') String approvalId,
            String plan,
            UsageEstimate? estimate)
        approvalRequested,
    required TResult Function(String slug,
            @JsonKey(name: 'approval_id') String approvalId, bool approved)
        approvalResolved,
    required TResult Function(
            String slug, String name, String? assignee, String by)
        taskAssigned,
    required TResult Function(String slug, String name, List<String> mentions,
            String by, String text)
        mentioned,
  }) {
    return mentioned(slug, name, mentions, by, text);
  }

  @override
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function(String slug, String name)? taskTriggered,
    TResult? Function(String slug, String name, bool ok, String summary,
            @JsonKey(name: 'run_id') String runId, List<String> artifacts)?
        taskCompleted,
    TResult? Function(
            String slug,
            String name,
            @JsonKey(name: 'approval_id') String approvalId,
            String plan,
            UsageEstimate? estimate)?
        approvalRequested,
    TResult? Function(String slug,
            @JsonKey(name: 'approval_id') String approvalId, bool approved)?
        approvalResolved,
    TResult? Function(String slug, String name, String? assignee, String by)?
        taskAssigned,
    TResult? Function(String slug, String name, List<String> mentions,
            String by, String text)?
        mentioned,
  }) {
    return mentioned?.call(slug, name, mentions, by, text);
  }

  @override
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function(String slug, String name)? taskTriggered,
    TResult Function(String slug, String name, bool ok, String summary,
            @JsonKey(name: 'run_id') String runId, List<String> artifacts)?
        taskCompleted,
    TResult Function(
            String slug,
            String name,
            @JsonKey(name: 'approval_id') String approvalId,
            String plan,
            UsageEstimate? estimate)?
        approvalRequested,
    TResult Function(String slug,
            @JsonKey(name: 'approval_id') String approvalId, bool approved)?
        approvalResolved,
    TResult Function(String slug, String name, String? assignee, String by)?
        taskAssigned,
    TResult Function(String slug, String name, List<String> mentions, String by,
            String text)?
        mentioned,
    required TResult orElse(),
  }) {
    if (mentioned != null) {
      return mentioned(slug, name, mentions, by, text);
    }
    return orElse();
  }

  @override
  @optionalTypeArgs
  TResult map<TResult extends Object?>({
    required TResult Function(TaskTriggered value) taskTriggered,
    required TResult Function(TaskCompleted value) taskCompleted,
    required TResult Function(ApprovalRequested value) approvalRequested,
    required TResult Function(ApprovalResolved value) approvalResolved,
    required TResult Function(TaskAssigned value) taskAssigned,
    required TResult Function(Mentioned value) mentioned,
  }) {
    return mentioned(this);
  }

  @override
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(TaskTriggered value)? taskTriggered,
    TResult? Function(TaskCompleted value)? taskCompleted,
    TResult? Function(ApprovalRequested value)? approvalRequested,
    TResult? Function(ApprovalResolved value)? approvalResolved,
    TResult? Function(TaskAssigned value)? taskAssigned,
    TResult? Function(Mentioned value)? mentioned,
  }) {
    return mentioned?.call(this);
  }

  @override
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(TaskTriggered value)? taskTriggered,
    TResult Function(TaskCompleted value)? taskCompleted,
    TResult Function(ApprovalRequested value)? approvalRequested,
    TResult Function(ApprovalResolved value)? approvalResolved,
    TResult Function(TaskAssigned value)? taskAssigned,
    TResult Function(Mentioned value)? mentioned,
    required TResult orElse(),
  }) {
    if (mentioned != null) {
      return mentioned(this);
    }
    return orElse();
  }

  @override
  Map<String, dynamic> toJson() {
    return _$$MentionedImplToJson(
      this,
    );
  }
}

abstract class Mentioned implements DaziEvent {
  const factory Mentioned(
      {required final String slug,
      required final String name,
      final List<String> mentions,
      required final String by,
      required final String text}) = _$MentionedImpl;

  factory Mentioned.fromJson(Map<String, dynamic> json) =
      _$MentionedImpl.fromJson;

  @override
  String get slug;
  String get name;
  List<String> get mentions;
  String get by;
  String get text;

  /// Create a copy of DaziEvent
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$MentionedImplCopyWith<_$MentionedImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
