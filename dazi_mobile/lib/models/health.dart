/// GET /health 响应中与本端相关的部分（其余字段忽略）。
class HealthInfo {
  const HealthInfo({this.claudeOk, this.claudeError});

  /// claude 探活结果；null 表示未探测/未知。
  final bool? claudeOk;
  final String? claudeError;
}
