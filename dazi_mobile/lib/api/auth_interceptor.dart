import 'package:dio/dio.dart';

import '../constants.dart';
import '../services/secure_storage.dart';

class AuthInterceptor extends Interceptor {
  AuthInterceptor(this._storage);

  final SecureStorageService _storage;

  @override
  Future<void> onRequest(RequestOptions options, RequestInterceptorHandler handler) async {
    if (options.path == ApiPaths.pair) {
      handler.next(options);
      return;
    }

    final token = await _storage.read(StorageKeys.deviceToken);
    if (token != null && token.isNotEmpty) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    handler.next(options);
  }
}
