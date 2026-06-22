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
    required TResult Function(String slug, String name, bool ok, String summary)
        taskCompleted,
    required TResult Function(
            String slug, String name, String approvalId, String plan)
        approvalRequested,
    required TResult Function(String slug, String approvalId, bool approved)
        approvalResolved,
  }) =>
      throw _privateConstructorUsedError;
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function(String slug, String name)? taskTriggered,
    TResult? Function(String slug, String name, bool ok, String summary)?
        taskCompleted,
    TResult? Function(String slug, String name, String approvalId, String plan)?
        approvalRequested,
    TResult? Function(String slug, String approvalId, bool approved)?
        approvalResolved,
  }) =>
      throw _privateConstructorUsedError;
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function(String slug, String name)? taskTriggered,
    TResult Function(String slug, String name, bool ok, String summary)?
        taskCompleted,
    TResult Function(String slug, String name, String approvalId, String plan)?
        approvalRequested,
    TResult Function(String slug, String approvalId, bool approved)?
        approvalResolved,
    required TResult orElse(),
  }) =>
      throw _privateConstructorUsedError;
  @optionalTypeArgs
  TResult map<TResult extends Object?>({
    required TResult Function(TaskTriggered value) taskTriggered,
    required TResult Function(TaskCompleted value) taskCompleted,
    required TResult Function(ApprovalRequested value) approvalRequested,
    required TResult Function(ApprovalResolved value) approvalResolved,
  }) =>
      throw _privateConstructorUsedError;
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(TaskTriggered value)? taskTriggered,
    TResult? Function(TaskCompleted value)? taskCompleted,
    TResult? Function(ApprovalRequested value)? approvalRequested,
    TResult? Function(ApprovalResolved value)? approvalResolved,
  }) =>
      throw _privateConstructorUsedError;
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(TaskTriggered value)? taskTriggered,
    TResult Function(TaskCompleted value)? taskCompleted,
    TResult Function(ApprovalRequested value)? approvalRequested,
    TResult Function(ApprovalResolved value)? approvalResolved,
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
    required TResult Function(String slug, String name, bool ok, String summary)
        taskCompleted,
    required TResult Function(
            String slug, String name, String approvalId, String plan)
        approvalRequested,
    required TResult Function(String slug, String approvalId, bool approved)
        approvalResolved,
  }) {
    return taskTriggered(slug, name);
  }

  @override
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function(String slug, String name)? taskTriggered,
    TResult? Function(String slug, String name, bool ok, String summary)?
        taskCompleted,
    TResult? Function(String slug, String name, String approvalId, String plan)?
        approvalRequested,
    TResult? Function(String slug, String approvalId, bool approved)?
        approvalResolved,
  }) {
    return taskTriggered?.call(slug, name);
  }

  @override
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function(String slug, String name)? taskTriggered,
    TResult Function(String slug, String name, bool ok, String summary)?
        taskCompleted,
    TResult Function(String slug, String name, String approvalId, String plan)?
        approvalRequested,
    TResult Function(String slug, String approvalId, bool approved)?
        approvalResolved,
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
  $Res call({String slug, String name, bool ok, String summary});
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
      final String? $type})
      : $type = $type ?? 'task-completed';

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

  @JsonKey(name: 'type')
  final String $type;

  @override
  String toString() {
    return 'DaziEvent.taskCompleted(slug: $slug, name: $name, ok: $ok, summary: $summary)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$TaskCompletedImpl &&
            (identical(other.slug, slug) || other.slug == slug) &&
            (identical(other.name, name) || other.name == name) &&
            (identical(other.ok, ok) || other.ok == ok) &&
            (identical(other.summary, summary) || other.summary == summary));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(runtimeType, slug, name, ok, summary);

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
    required TResult Function(String slug, String name, bool ok, String summary)
        taskCompleted,
    required TResult Function(
            String slug, String name, String approvalId, String plan)
        approvalRequested,
    required TResult Function(String slug, String approvalId, bool approved)
        approvalResolved,
  }) {
    return taskCompleted(slug, name, ok, summary);
  }

  @override
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function(String slug, String name)? taskTriggered,
    TResult? Function(String slug, String name, bool ok, String summary)?
        taskCompleted,
    TResult? Function(String slug, String name, String approvalId, String plan)?
        approvalRequested,
    TResult? Function(String slug, String approvalId, bool approved)?
        approvalResolved,
  }) {
    return taskCompleted?.call(slug, name, ok, summary);
  }

  @override
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function(String slug, String name)? taskTriggered,
    TResult Function(String slug, String name, bool ok, String summary)?
        taskCompleted,
    TResult Function(String slug, String name, String approvalId, String plan)?
        approvalRequested,
    TResult Function(String slug, String approvalId, bool approved)?
        approvalResolved,
    required TResult orElse(),
  }) {
    if (taskCompleted != null) {
      return taskCompleted(slug, name, ok, summary);
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
      required final String summary}) = _$TaskCompletedImpl;

  factory TaskCompleted.fromJson(Map<String, dynamic> json) =
      _$TaskCompletedImpl.fromJson;

  @override
  String get slug;
  String get name;
  bool get ok;
  String get summary;

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
  $Res call({String slug, String name, String approvalId, String plan});
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
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$ApprovalRequestedImpl implements ApprovalRequested {
  const _$ApprovalRequestedImpl(
      {required this.slug,
      required this.name,
      required this.approvalId,
      required this.plan,
      final String? $type})
      : $type = $type ?? 'approval-requested';

  factory _$ApprovalRequestedImpl.fromJson(Map<String, dynamic> json) =>
      _$$ApprovalRequestedImplFromJson(json);

  @override
  final String slug;
  @override
  final String name;
  @override
  final String approvalId;
  @override
  final String plan;

  @JsonKey(name: 'type')
  final String $type;

  @override
  String toString() {
    return 'DaziEvent.approvalRequested(slug: $slug, name: $name, approvalId: $approvalId, plan: $plan)';
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
            (identical(other.plan, plan) || other.plan == plan));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(runtimeType, slug, name, approvalId, plan);

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
    required TResult Function(String slug, String name, bool ok, String summary)
        taskCompleted,
    required TResult Function(
            String slug, String name, String approvalId, String plan)
        approvalRequested,
    required TResult Function(String slug, String approvalId, bool approved)
        approvalResolved,
  }) {
    return approvalRequested(slug, name, approvalId, plan);
  }

  @override
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function(String slug, String name)? taskTriggered,
    TResult? Function(String slug, String name, bool ok, String summary)?
        taskCompleted,
    TResult? Function(String slug, String name, String approvalId, String plan)?
        approvalRequested,
    TResult? Function(String slug, String approvalId, bool approved)?
        approvalResolved,
  }) {
    return approvalRequested?.call(slug, name, approvalId, plan);
  }

  @override
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function(String slug, String name)? taskTriggered,
    TResult Function(String slug, String name, bool ok, String summary)?
        taskCompleted,
    TResult Function(String slug, String name, String approvalId, String plan)?
        approvalRequested,
    TResult Function(String slug, String approvalId, bool approved)?
        approvalResolved,
    required TResult orElse(),
  }) {
    if (approvalRequested != null) {
      return approvalRequested(slug, name, approvalId, plan);
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
      required final String approvalId,
      required final String plan}) = _$ApprovalRequestedImpl;

  factory ApprovalRequested.fromJson(Map<String, dynamic> json) =
      _$ApprovalRequestedImpl.fromJson;

  @override
  String get slug;
  String get name;
  String get approvalId;
  String get plan;

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
  $Res call({String slug, String approvalId, bool approved});
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
      required this.approvalId,
      required this.approved,
      final String? $type})
      : $type = $type ?? 'approval-resolved';

  factory _$ApprovalResolvedImpl.fromJson(Map<String, dynamic> json) =>
      _$$ApprovalResolvedImplFromJson(json);

  @override
  final String slug;
  @override
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
    required TResult Function(String slug, String name, bool ok, String summary)
        taskCompleted,
    required TResult Function(
            String slug, String name, String approvalId, String plan)
        approvalRequested,
    required TResult Function(String slug, String approvalId, bool approved)
        approvalResolved,
  }) {
    return approvalResolved(slug, approvalId, approved);
  }

  @override
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function(String slug, String name)? taskTriggered,
    TResult? Function(String slug, String name, bool ok, String summary)?
        taskCompleted,
    TResult? Function(String slug, String name, String approvalId, String plan)?
        approvalRequested,
    TResult? Function(String slug, String approvalId, bool approved)?
        approvalResolved,
  }) {
    return approvalResolved?.call(slug, approvalId, approved);
  }

  @override
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function(String slug, String name)? taskTriggered,
    TResult Function(String slug, String name, bool ok, String summary)?
        taskCompleted,
    TResult Function(String slug, String name, String approvalId, String plan)?
        approvalRequested,
    TResult Function(String slug, String approvalId, bool approved)?
        approvalResolved,
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
      required final String approvalId,
      required final bool approved}) = _$ApprovalResolvedImpl;

  factory ApprovalResolved.fromJson(Map<String, dynamic> json) =
      _$ApprovalResolvedImpl.fromJson;

  @override
  String get slug;
  String get approvalId;
  bool get approved;

  /// Create a copy of DaziEvent
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$ApprovalResolvedImplCopyWith<_$ApprovalResolvedImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
