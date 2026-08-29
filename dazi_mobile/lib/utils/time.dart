import 'package:intl/intl.dart';

final _runTimeFormat = DateFormat('yyyy-MM-dd HH:mm');

/// 运行记录时间（ISO 字符串，UTC）转本地可读格式；解析失败原样返回。
String formatRunTime(String iso) {
  final dt = DateTime.tryParse(iso);
  if (dt == null) return iso;
  return _runTimeFormat.format(dt.toLocal());
}

/// 距 [iso] 还剩多久的人话描述，已过则返回「已过期」。
///
/// 棒的 TTL 是 2 小时，故只到分钟粒度；解析失败按已过期处理——
/// 与服务端 is_expired 对坏数据的判断一致（坏数据不该让任务永久锁死）。
String formatRemaining(String iso) {
  final dt = DateTime.tryParse(iso);
  if (dt == null) return '已过期';
  final left = dt.difference(DateTime.now());
  if (left.isNegative) return '已过期';
  final hours = left.inHours;
  final minutes = left.inMinutes % 60;
  if (hours > 0) return '剩 $hours 小时 $minutes 分';
  if (left.inMinutes > 0) return '剩 $minutes 分';
  return '剩不到 1 分钟';
}
