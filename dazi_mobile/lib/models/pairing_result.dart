import 'package:freezed_annotation/freezed_annotation.dart';

part 'pairing_result.freezed.dart';
part 'pairing_result.g.dart';

@freezed
class PairingResult with _$PairingResult {
  const factory PairingResult({
    @JsonKey(name: 'device_token') required String deviceToken,
  }) = _PairingResult;

  factory PairingResult.fromJson(Map<String, dynamic> json) =>
      _$PairingResultFromJson(json);
}
