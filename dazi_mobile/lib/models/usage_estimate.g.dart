// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'usage_estimate.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$UsageEstimateImpl _$$UsageEstimateImplFromJson(Map<String, dynamic> json) =>
    _$UsageEstimateImpl(
      scope: json['scope'] as String,
      sampleSize: (json['sample_size'] as num).toInt(),
      avgInputTokens: (json['avg_input_tokens'] as num).toDouble(),
      avgOutputTokens: (json['avg_output_tokens'] as num).toDouble(),
      avgCostUsd: (json['avg_cost_usd'] as num).toDouble(),
    );

Map<String, dynamic> _$$UsageEstimateImplToJson(_$UsageEstimateImpl instance) =>
    <String, dynamic>{
      'scope': instance.scope,
      'sample_size': instance.sampleSize,
      'avg_input_tokens': instance.avgInputTokens,
      'avg_output_tokens': instance.avgOutputTokens,
      'avg_cost_usd': instance.avgCostUsd,
    };
