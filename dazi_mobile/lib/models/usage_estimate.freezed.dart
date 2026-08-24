// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'usage_estimate.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
    'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models');

UsageEstimate _$UsageEstimateFromJson(Map<String, dynamic> json) {
  return _UsageEstimate.fromJson(json);
}

/// @nodoc
mixin _$UsageEstimate {
  /// 估算依据："project"（该项目历史均值）或 "global"（全部项目历史均值）。
  String get scope => throw _privateConstructorUsedError;
  @JsonKey(name: 'sample_size')
  int get sampleSize => throw _privateConstructorUsedError;
  @JsonKey(name: 'avg_input_tokens')
  double get avgInputTokens => throw _privateConstructorUsedError;
  @JsonKey(name: 'avg_output_tokens')
  double get avgOutputTokens => throw _privateConstructorUsedError;
  @JsonKey(name: 'avg_cost_usd')
  double get avgCostUsd => throw _privateConstructorUsedError;

  /// Serializes this UsageEstimate to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of UsageEstimate
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $UsageEstimateCopyWith<UsageEstimate> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $UsageEstimateCopyWith<$Res> {
  factory $UsageEstimateCopyWith(
          UsageEstimate value, $Res Function(UsageEstimate) then) =
      _$UsageEstimateCopyWithImpl<$Res, UsageEstimate>;
  @useResult
  $Res call(
      {String scope,
      @JsonKey(name: 'sample_size') int sampleSize,
      @JsonKey(name: 'avg_input_tokens') double avgInputTokens,
      @JsonKey(name: 'avg_output_tokens') double avgOutputTokens,
      @JsonKey(name: 'avg_cost_usd') double avgCostUsd});
}

/// @nodoc
class _$UsageEstimateCopyWithImpl<$Res, $Val extends UsageEstimate>
    implements $UsageEstimateCopyWith<$Res> {
  _$UsageEstimateCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of UsageEstimate
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? scope = null,
    Object? sampleSize = null,
    Object? avgInputTokens = null,
    Object? avgOutputTokens = null,
    Object? avgCostUsd = null,
  }) {
    return _then(_value.copyWith(
      scope: null == scope
          ? _value.scope
          : scope // ignore: cast_nullable_to_non_nullable
              as String,
      sampleSize: null == sampleSize
          ? _value.sampleSize
          : sampleSize // ignore: cast_nullable_to_non_nullable
              as int,
      avgInputTokens: null == avgInputTokens
          ? _value.avgInputTokens
          : avgInputTokens // ignore: cast_nullable_to_non_nullable
              as double,
      avgOutputTokens: null == avgOutputTokens
          ? _value.avgOutputTokens
          : avgOutputTokens // ignore: cast_nullable_to_non_nullable
              as double,
      avgCostUsd: null == avgCostUsd
          ? _value.avgCostUsd
          : avgCostUsd // ignore: cast_nullable_to_non_nullable
              as double,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$UsageEstimateImplCopyWith<$Res>
    implements $UsageEstimateCopyWith<$Res> {
  factory _$$UsageEstimateImplCopyWith(
          _$UsageEstimateImpl value, $Res Function(_$UsageEstimateImpl) then) =
      __$$UsageEstimateImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {String scope,
      @JsonKey(name: 'sample_size') int sampleSize,
      @JsonKey(name: 'avg_input_tokens') double avgInputTokens,
      @JsonKey(name: 'avg_output_tokens') double avgOutputTokens,
      @JsonKey(name: 'avg_cost_usd') double avgCostUsd});
}

/// @nodoc
class __$$UsageEstimateImplCopyWithImpl<$Res>
    extends _$UsageEstimateCopyWithImpl<$Res, _$UsageEstimateImpl>
    implements _$$UsageEstimateImplCopyWith<$Res> {
  __$$UsageEstimateImplCopyWithImpl(
      _$UsageEstimateImpl _value, $Res Function(_$UsageEstimateImpl) _then)
      : super(_value, _then);

  /// Create a copy of UsageEstimate
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? scope = null,
    Object? sampleSize = null,
    Object? avgInputTokens = null,
    Object? avgOutputTokens = null,
    Object? avgCostUsd = null,
  }) {
    return _then(_$UsageEstimateImpl(
      scope: null == scope
          ? _value.scope
          : scope // ignore: cast_nullable_to_non_nullable
              as String,
      sampleSize: null == sampleSize
          ? _value.sampleSize
          : sampleSize // ignore: cast_nullable_to_non_nullable
              as int,
      avgInputTokens: null == avgInputTokens
          ? _value.avgInputTokens
          : avgInputTokens // ignore: cast_nullable_to_non_nullable
              as double,
      avgOutputTokens: null == avgOutputTokens
          ? _value.avgOutputTokens
          : avgOutputTokens // ignore: cast_nullable_to_non_nullable
              as double,
      avgCostUsd: null == avgCostUsd
          ? _value.avgCostUsd
          : avgCostUsd // ignore: cast_nullable_to_non_nullable
              as double,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$UsageEstimateImpl implements _UsageEstimate {
  const _$UsageEstimateImpl(
      {required this.scope,
      @JsonKey(name: 'sample_size') required this.sampleSize,
      @JsonKey(name: 'avg_input_tokens') required this.avgInputTokens,
      @JsonKey(name: 'avg_output_tokens') required this.avgOutputTokens,
      @JsonKey(name: 'avg_cost_usd') required this.avgCostUsd});

  factory _$UsageEstimateImpl.fromJson(Map<String, dynamic> json) =>
      _$$UsageEstimateImplFromJson(json);

  /// 估算依据："project"（该项目历史均值）或 "global"（全部项目历史均值）。
  @override
  final String scope;
  @override
  @JsonKey(name: 'sample_size')
  final int sampleSize;
  @override
  @JsonKey(name: 'avg_input_tokens')
  final double avgInputTokens;
  @override
  @JsonKey(name: 'avg_output_tokens')
  final double avgOutputTokens;
  @override
  @JsonKey(name: 'avg_cost_usd')
  final double avgCostUsd;

  @override
  String toString() {
    return 'UsageEstimate(scope: $scope, sampleSize: $sampleSize, avgInputTokens: $avgInputTokens, avgOutputTokens: $avgOutputTokens, avgCostUsd: $avgCostUsd)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$UsageEstimateImpl &&
            (identical(other.scope, scope) || other.scope == scope) &&
            (identical(other.sampleSize, sampleSize) ||
                other.sampleSize == sampleSize) &&
            (identical(other.avgInputTokens, avgInputTokens) ||
                other.avgInputTokens == avgInputTokens) &&
            (identical(other.avgOutputTokens, avgOutputTokens) ||
                other.avgOutputTokens == avgOutputTokens) &&
            (identical(other.avgCostUsd, avgCostUsd) ||
                other.avgCostUsd == avgCostUsd));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(runtimeType, scope, sampleSize,
      avgInputTokens, avgOutputTokens, avgCostUsd);

  /// Create a copy of UsageEstimate
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$UsageEstimateImplCopyWith<_$UsageEstimateImpl> get copyWith =>
      __$$UsageEstimateImplCopyWithImpl<_$UsageEstimateImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$UsageEstimateImplToJson(
      this,
    );
  }
}

abstract class _UsageEstimate implements UsageEstimate {
  const factory _UsageEstimate(
      {required final String scope,
      @JsonKey(name: 'sample_size') required final int sampleSize,
      @JsonKey(name: 'avg_input_tokens') required final double avgInputTokens,
      @JsonKey(name: 'avg_output_tokens') required final double avgOutputTokens,
      @JsonKey(name: 'avg_cost_usd')
      required final double avgCostUsd}) = _$UsageEstimateImpl;

  factory _UsageEstimate.fromJson(Map<String, dynamic> json) =
      _$UsageEstimateImpl.fromJson;

  /// 估算依据："project"（该项目历史均值）或 "global"（全部项目历史均值）。
  @override
  String get scope;
  @override
  @JsonKey(name: 'sample_size')
  int get sampleSize;
  @override
  @JsonKey(name: 'avg_input_tokens')
  double get avgInputTokens;
  @override
  @JsonKey(name: 'avg_output_tokens')
  double get avgOutputTokens;
  @override
  @JsonKey(name: 'avg_cost_usd')
  double get avgCostUsd;

  /// Create a copy of UsageEstimate
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$UsageEstimateImplCopyWith<_$UsageEstimateImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
