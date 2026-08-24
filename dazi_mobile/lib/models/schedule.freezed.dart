// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'schedule.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
    'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models');

Schedule _$ScheduleFromJson(Map<String, dynamic> json) {
  return _Schedule.fromJson(json);
}

/// @nodoc
mixin _$Schedule {
  @JsonKey(name: 'run_at')
  String? get runAt => throw _privateConstructorUsedError;
  Interval? get interval => throw _privateConstructorUsedError;
  @JsonKey(name: 'ends_at')
  String? get endsAt => throw _privateConstructorUsedError;
  @JsonKey(name: 'max_runs')
  int? get maxRuns => throw _privateConstructorUsedError;
  bool? get paused => throw _privateConstructorUsedError;
  String? get action => throw _privateConstructorUsedError;
  String? get model => throw _privateConstructorUsedError;

  /// Serializes this Schedule to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of Schedule
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $ScheduleCopyWith<Schedule> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $ScheduleCopyWith<$Res> {
  factory $ScheduleCopyWith(Schedule value, $Res Function(Schedule) then) =
      _$ScheduleCopyWithImpl<$Res, Schedule>;
  @useResult
  $Res call(
      {@JsonKey(name: 'run_at') String? runAt,
      Interval? interval,
      @JsonKey(name: 'ends_at') String? endsAt,
      @JsonKey(name: 'max_runs') int? maxRuns,
      bool? paused,
      String? action,
      String? model});

  $IntervalCopyWith<$Res>? get interval;
}

/// @nodoc
class _$ScheduleCopyWithImpl<$Res, $Val extends Schedule>
    implements $ScheduleCopyWith<$Res> {
  _$ScheduleCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of Schedule
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? runAt = freezed,
    Object? interval = freezed,
    Object? endsAt = freezed,
    Object? maxRuns = freezed,
    Object? paused = freezed,
    Object? action = freezed,
    Object? model = freezed,
  }) {
    return _then(_value.copyWith(
      runAt: freezed == runAt
          ? _value.runAt
          : runAt // ignore: cast_nullable_to_non_nullable
              as String?,
      interval: freezed == interval
          ? _value.interval
          : interval // ignore: cast_nullable_to_non_nullable
              as Interval?,
      endsAt: freezed == endsAt
          ? _value.endsAt
          : endsAt // ignore: cast_nullable_to_non_nullable
              as String?,
      maxRuns: freezed == maxRuns
          ? _value.maxRuns
          : maxRuns // ignore: cast_nullable_to_non_nullable
              as int?,
      paused: freezed == paused
          ? _value.paused
          : paused // ignore: cast_nullable_to_non_nullable
              as bool?,
      action: freezed == action
          ? _value.action
          : action // ignore: cast_nullable_to_non_nullable
              as String?,
      model: freezed == model
          ? _value.model
          : model // ignore: cast_nullable_to_non_nullable
              as String?,
    ) as $Val);
  }

  /// Create a copy of Schedule
  /// with the given fields replaced by the non-null parameter values.
  @override
  @pragma('vm:prefer-inline')
  $IntervalCopyWith<$Res>? get interval {
    if (_value.interval == null) {
      return null;
    }

    return $IntervalCopyWith<$Res>(_value.interval!, (value) {
      return _then(_value.copyWith(interval: value) as $Val);
    });
  }
}

/// @nodoc
abstract class _$$ScheduleImplCopyWith<$Res>
    implements $ScheduleCopyWith<$Res> {
  factory _$$ScheduleImplCopyWith(
          _$ScheduleImpl value, $Res Function(_$ScheduleImpl) then) =
      __$$ScheduleImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {@JsonKey(name: 'run_at') String? runAt,
      Interval? interval,
      @JsonKey(name: 'ends_at') String? endsAt,
      @JsonKey(name: 'max_runs') int? maxRuns,
      bool? paused,
      String? action,
      String? model});

  @override
  $IntervalCopyWith<$Res>? get interval;
}

/// @nodoc
class __$$ScheduleImplCopyWithImpl<$Res>
    extends _$ScheduleCopyWithImpl<$Res, _$ScheduleImpl>
    implements _$$ScheduleImplCopyWith<$Res> {
  __$$ScheduleImplCopyWithImpl(
      _$ScheduleImpl _value, $Res Function(_$ScheduleImpl) _then)
      : super(_value, _then);

  /// Create a copy of Schedule
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? runAt = freezed,
    Object? interval = freezed,
    Object? endsAt = freezed,
    Object? maxRuns = freezed,
    Object? paused = freezed,
    Object? action = freezed,
    Object? model = freezed,
  }) {
    return _then(_$ScheduleImpl(
      runAt: freezed == runAt
          ? _value.runAt
          : runAt // ignore: cast_nullable_to_non_nullable
              as String?,
      interval: freezed == interval
          ? _value.interval
          : interval // ignore: cast_nullable_to_non_nullable
              as Interval?,
      endsAt: freezed == endsAt
          ? _value.endsAt
          : endsAt // ignore: cast_nullable_to_non_nullable
              as String?,
      maxRuns: freezed == maxRuns
          ? _value.maxRuns
          : maxRuns // ignore: cast_nullable_to_non_nullable
              as int?,
      paused: freezed == paused
          ? _value.paused
          : paused // ignore: cast_nullable_to_non_nullable
              as bool?,
      action: freezed == action
          ? _value.action
          : action // ignore: cast_nullable_to_non_nullable
              as String?,
      model: freezed == model
          ? _value.model
          : model // ignore: cast_nullable_to_non_nullable
              as String?,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$ScheduleImpl implements _Schedule {
  const _$ScheduleImpl(
      {@JsonKey(name: 'run_at') this.runAt,
      this.interval,
      @JsonKey(name: 'ends_at') this.endsAt,
      @JsonKey(name: 'max_runs') this.maxRuns,
      this.paused,
      this.action,
      this.model});

  factory _$ScheduleImpl.fromJson(Map<String, dynamic> json) =>
      _$$ScheduleImplFromJson(json);

  @override
  @JsonKey(name: 'run_at')
  final String? runAt;
  @override
  final Interval? interval;
  @override
  @JsonKey(name: 'ends_at')
  final String? endsAt;
  @override
  @JsonKey(name: 'max_runs')
  final int? maxRuns;
  @override
  final bool? paused;
  @override
  final String? action;
  @override
  final String? model;

  @override
  String toString() {
    return 'Schedule(runAt: $runAt, interval: $interval, endsAt: $endsAt, maxRuns: $maxRuns, paused: $paused, action: $action, model: $model)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$ScheduleImpl &&
            (identical(other.runAt, runAt) || other.runAt == runAt) &&
            (identical(other.interval, interval) ||
                other.interval == interval) &&
            (identical(other.endsAt, endsAt) || other.endsAt == endsAt) &&
            (identical(other.maxRuns, maxRuns) || other.maxRuns == maxRuns) &&
            (identical(other.paused, paused) || other.paused == paused) &&
            (identical(other.action, action) || other.action == action) &&
            (identical(other.model, model) || other.model == model));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(
      runtimeType, runAt, interval, endsAt, maxRuns, paused, action, model);

  /// Create a copy of Schedule
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$ScheduleImplCopyWith<_$ScheduleImpl> get copyWith =>
      __$$ScheduleImplCopyWithImpl<_$ScheduleImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$ScheduleImplToJson(
      this,
    );
  }
}

abstract class _Schedule implements Schedule {
  const factory _Schedule(
      {@JsonKey(name: 'run_at') final String? runAt,
      final Interval? interval,
      @JsonKey(name: 'ends_at') final String? endsAt,
      @JsonKey(name: 'max_runs') final int? maxRuns,
      final bool? paused,
      final String? action,
      final String? model}) = _$ScheduleImpl;

  factory _Schedule.fromJson(Map<String, dynamic> json) =
      _$ScheduleImpl.fromJson;

  @override
  @JsonKey(name: 'run_at')
  String? get runAt;
  @override
  Interval? get interval;
  @override
  @JsonKey(name: 'ends_at')
  String? get endsAt;
  @override
  @JsonKey(name: 'max_runs')
  int? get maxRuns;
  @override
  bool? get paused;
  @override
  String? get action;
  @override
  String? get model;

  /// Create a copy of Schedule
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$ScheduleImplCopyWith<_$ScheduleImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

OnTrigger _$OnTriggerFromJson(Map<String, dynamic> json) {
  return _OnTrigger.fromJson(json);
}

/// @nodoc
mixin _$OnTrigger {
  String? get action => throw _privateConstructorUsedError;
  String? get model => throw _privateConstructorUsedError;

  /// Serializes this OnTrigger to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of OnTrigger
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $OnTriggerCopyWith<OnTrigger> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $OnTriggerCopyWith<$Res> {
  factory $OnTriggerCopyWith(OnTrigger value, $Res Function(OnTrigger) then) =
      _$OnTriggerCopyWithImpl<$Res, OnTrigger>;
  @useResult
  $Res call({String? action, String? model});
}

/// @nodoc
class _$OnTriggerCopyWithImpl<$Res, $Val extends OnTrigger>
    implements $OnTriggerCopyWith<$Res> {
  _$OnTriggerCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of OnTrigger
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? action = freezed,
    Object? model = freezed,
  }) {
    return _then(_value.copyWith(
      action: freezed == action
          ? _value.action
          : action // ignore: cast_nullable_to_non_nullable
              as String?,
      model: freezed == model
          ? _value.model
          : model // ignore: cast_nullable_to_non_nullable
              as String?,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$OnTriggerImplCopyWith<$Res>
    implements $OnTriggerCopyWith<$Res> {
  factory _$$OnTriggerImplCopyWith(
          _$OnTriggerImpl value, $Res Function(_$OnTriggerImpl) then) =
      __$$OnTriggerImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({String? action, String? model});
}

/// @nodoc
class __$$OnTriggerImplCopyWithImpl<$Res>
    extends _$OnTriggerCopyWithImpl<$Res, _$OnTriggerImpl>
    implements _$$OnTriggerImplCopyWith<$Res> {
  __$$OnTriggerImplCopyWithImpl(
      _$OnTriggerImpl _value, $Res Function(_$OnTriggerImpl) _then)
      : super(_value, _then);

  /// Create a copy of OnTrigger
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? action = freezed,
    Object? model = freezed,
  }) {
    return _then(_$OnTriggerImpl(
      action: freezed == action
          ? _value.action
          : action // ignore: cast_nullable_to_non_nullable
              as String?,
      model: freezed == model
          ? _value.model
          : model // ignore: cast_nullable_to_non_nullable
              as String?,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$OnTriggerImpl implements _OnTrigger {
  const _$OnTriggerImpl({this.action, this.model});

  factory _$OnTriggerImpl.fromJson(Map<String, dynamic> json) =>
      _$$OnTriggerImplFromJson(json);

  @override
  final String? action;
  @override
  final String? model;

  @override
  String toString() {
    return 'OnTrigger(action: $action, model: $model)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$OnTriggerImpl &&
            (identical(other.action, action) || other.action == action) &&
            (identical(other.model, model) || other.model == model));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(runtimeType, action, model);

  /// Create a copy of OnTrigger
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$OnTriggerImplCopyWith<_$OnTriggerImpl> get copyWith =>
      __$$OnTriggerImplCopyWithImpl<_$OnTriggerImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$OnTriggerImplToJson(
      this,
    );
  }
}

abstract class _OnTrigger implements OnTrigger {
  const factory _OnTrigger({final String? action, final String? model}) =
      _$OnTriggerImpl;

  factory _OnTrigger.fromJson(Map<String, dynamic> json) =
      _$OnTriggerImpl.fromJson;

  @override
  String? get action;
  @override
  String? get model;

  /// Create a copy of OnTrigger
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$OnTriggerImplCopyWith<_$OnTriggerImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

Interval _$IntervalFromJson(Map<String, dynamic> json) {
  return _Interval.fromJson(json);
}

/// @nodoc
mixin _$Interval {
  int get every => throw _privateConstructorUsedError;
  String get unit => throw _privateConstructorUsedError;

  /// Serializes this Interval to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of Interval
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $IntervalCopyWith<Interval> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $IntervalCopyWith<$Res> {
  factory $IntervalCopyWith(Interval value, $Res Function(Interval) then) =
      _$IntervalCopyWithImpl<$Res, Interval>;
  @useResult
  $Res call({int every, String unit});
}

/// @nodoc
class _$IntervalCopyWithImpl<$Res, $Val extends Interval>
    implements $IntervalCopyWith<$Res> {
  _$IntervalCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of Interval
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? every = null,
    Object? unit = null,
  }) {
    return _then(_value.copyWith(
      every: null == every
          ? _value.every
          : every // ignore: cast_nullable_to_non_nullable
              as int,
      unit: null == unit
          ? _value.unit
          : unit // ignore: cast_nullable_to_non_nullable
              as String,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$IntervalImplCopyWith<$Res>
    implements $IntervalCopyWith<$Res> {
  factory _$$IntervalImplCopyWith(
          _$IntervalImpl value, $Res Function(_$IntervalImpl) then) =
      __$$IntervalImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({int every, String unit});
}

/// @nodoc
class __$$IntervalImplCopyWithImpl<$Res>
    extends _$IntervalCopyWithImpl<$Res, _$IntervalImpl>
    implements _$$IntervalImplCopyWith<$Res> {
  __$$IntervalImplCopyWithImpl(
      _$IntervalImpl _value, $Res Function(_$IntervalImpl) _then)
      : super(_value, _then);

  /// Create a copy of Interval
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? every = null,
    Object? unit = null,
  }) {
    return _then(_$IntervalImpl(
      every: null == every
          ? _value.every
          : every // ignore: cast_nullable_to_non_nullable
              as int,
      unit: null == unit
          ? _value.unit
          : unit // ignore: cast_nullable_to_non_nullable
              as String,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$IntervalImpl implements _Interval {
  const _$IntervalImpl({required this.every, required this.unit});

  factory _$IntervalImpl.fromJson(Map<String, dynamic> json) =>
      _$$IntervalImplFromJson(json);

  @override
  final int every;
  @override
  final String unit;

  @override
  String toString() {
    return 'Interval(every: $every, unit: $unit)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$IntervalImpl &&
            (identical(other.every, every) || other.every == every) &&
            (identical(other.unit, unit) || other.unit == unit));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(runtimeType, every, unit);

  /// Create a copy of Interval
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$IntervalImplCopyWith<_$IntervalImpl> get copyWith =>
      __$$IntervalImplCopyWithImpl<_$IntervalImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$IntervalImplToJson(
      this,
    );
  }
}

abstract class _Interval implements Interval {
  const factory _Interval(
      {required final int every, required final String unit}) = _$IntervalImpl;

  factory _Interval.fromJson(Map<String, dynamic> json) =
      _$IntervalImpl.fromJson;

  @override
  int get every;
  @override
  String get unit;

  /// Create a copy of Interval
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$IntervalImplCopyWith<_$IntervalImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
