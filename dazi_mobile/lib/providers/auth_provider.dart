import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../api/dazi_api.dart';
import '../constants.dart';
import '../services/secure_storage.dart';

final secureStorageProvider = Provider<SecureStorageService>((ref) => SecureStorageService());

class AuthState {
  const AuthState({
    this.token,
    this.baseUrl,
    this.isLoading = true,
    this.error,
  });

  final String? token;
  final String? baseUrl;
  final bool isLoading;
  final String? error;

  bool get isPaired => token != null && token!.isNotEmpty;

  AuthState copyWith({
    String? token,
    String? baseUrl,
    bool? isLoading,
    String? error,
  }) => AuthState(
        token: token ?? this.token,
        baseUrl: baseUrl ?? this.baseUrl,
        isLoading: isLoading ?? this.isLoading,
        error: error,
      );
}

class AuthNotifier extends StateNotifier<AuthState> {
  AuthNotifier(this._storage) : super(const AuthState());

  final SecureStorageService _storage;

  Future<void> load() async {
    final token = await _storage.read(StorageKeys.deviceToken);
    final baseUrl = await _storage.read(StorageKeys.baseUrl);
    state = AuthState(
      token: token,
      baseUrl: baseUrl,
      isLoading: false,
    );
  }

  Future<void> pair({required String baseUrl, required String pin}) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final result = await DaziApi(
        Dio(), // temporary unauthenticated dio
      ).pair(baseUrl: baseUrl, pin: pin, deviceName: 'Dazi Mobile');
      await _storage.write(StorageKeys.baseUrl, baseUrl);
      await _storage.write(StorageKeys.deviceToken, result.deviceToken);
      state = AuthState(
        token: result.deviceToken,
        baseUrl: baseUrl,
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  Future<void> logout() async {
    await _storage.delete(StorageKeys.deviceToken);
    await _storage.delete(StorageKeys.baseUrl);
    state = const AuthState(isLoading: false);
  }
}

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  final notifier = AuthNotifier(ref.watch(secureStorageProvider));
  notifier.load();
  return notifier;
});
