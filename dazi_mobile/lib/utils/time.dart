import 'package:intl/intl.dart';

final _runTimeFormat = DateFormat('yyyy-MM-dd HH:mm');

/// 运行记录时间（ISO 字符串，UTC）转本地可读格式；解析失败原样返回。
String formatRunTime(String iso) {
  final dt = DateTime.tryParse(iso);
  if (dt == null) return iso;
  return _runTimeFormat.format(dt.toLocal());
}
