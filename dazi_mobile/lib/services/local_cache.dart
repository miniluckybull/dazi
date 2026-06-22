import 'dart:convert';

import 'package:hive_flutter/hive_flutter.dart';

class LocalCacheService {
  late Box<String> _box;

  Future<void> init() async {
    await Hive.initFlutter();
    _box = await Hive.openBox<String>('dazi_cache');
  }

  Future<void> setJson(String key, dynamic value) async {
    await _box.put(key, jsonEncode(value));
  }

  dynamic getJson(String key) {
    final raw = _box.get(key);
    if (raw == null) return null;
    try {
      return jsonDecode(raw);
    } catch (_) {
      return null;
    }
  }

  Future<void> delete(String key) => _box.delete(key);

  Future<void> clear() => _box.clear();
}
