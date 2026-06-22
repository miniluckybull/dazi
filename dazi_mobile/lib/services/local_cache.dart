import 'dart:convert';

import 'package:hive_flutter/hive_flutter.dart';

class LocalCacheService {
  Box<String>? _box;

  Future<Box<String>> _ensureBox() async {
    if (_box != null) return _box!;
    _box = await Hive.openBox<String>('dazi_cache');
    return _box!;
  }

  Future<void> setJson(String key, dynamic value) async {
    final box = await _ensureBox();
    await box.put(key, jsonEncode(value));
  }

  Future<dynamic> getJson(String key) async {
    final box = await _ensureBox();
    final raw = box.get(key);
    if (raw == null) return null;
    try {
      return jsonDecode(raw);
    } catch (_) {
      return null;
    }
  }

  Future<void> delete(String key) async {
    final box = await _ensureBox();
    await box.delete(key);
  }

  Future<void> clear() async {
    final box = await _ensureBox();
    await box.clear();
  }
}
