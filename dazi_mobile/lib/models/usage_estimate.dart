import 'package:freezed_annotation/freezed_annotation.dart';

part 'usage_estimate.freezed.dart';
part 'usage_estimate.g.dart';

/// 服务端 UsageEstimate：基于历史 usage 的一次执行用量/费用预估。
@freezed
class UsageEstimate with _$UsageEstimate {
  const factory UsageEstimate({
    /// 估算依据："project"（该项目历史均值）或 "global"（全部项目历史均值）。
    required String scope,
    @JsonKey(name: 'sample_size') required int sampleSize,
    @JsonKey(name: 'avg_input_tokens') required double avgInputTokens,
    @JsonKey(name: 'avg_output_tokens') required double avgOutputTokens,
    @JsonKey(name: 'avg_cost_usd') required double avgCostUsd,
  }) = _UsageEstimate;

  factory UsageEstimate.fromJson(Map<String, dynamic> json) =>
      _$UsageEstimateFromJson(json);
}
