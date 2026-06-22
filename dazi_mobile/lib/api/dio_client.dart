import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../providers/auth_provider.dart';
import 'auth_interceptor.dart';

final dioClientProvider = Provider<Dio>((ref) {
  final baseUrl = ref.watch(authProvider).baseUrl;
  final dio = Dio(BaseOptions(
    baseUrl: baseUrl ?? '',
    connectTimeout: const Duration(seconds: 10),
    receiveTimeout: const Duration(seconds: 30),
    headers: {'Content-Type': 'application/json'},
  ));

  dio.interceptors.add(AuthInterceptor(ref.read(secureStorageProvider)));
  dio.interceptors.add(LogInterceptor(requestBody: true, responseBody: true));

  ref.onDispose(() => dio.close());
  return dio;
});
