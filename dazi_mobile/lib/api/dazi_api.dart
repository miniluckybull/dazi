import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../constants.dart';
import '../models/models.dart';
import 'dio_client.dart';

final daziApiProvider = Provider<DaziApi>((ref) => DaziApi(ref.watch(dioClientProvider)));

class DaziApi {
  DaziApi(this._dio);

  final Dio _dio;

  Future<PairingResult> pair({required String baseUrl, required String pin, required String deviceName}) async {
    final dio = Dio(BaseOptions(
      baseUrl: baseUrl,
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 30),
      headers: {'Content-Type': 'application/json'},
    ));
    try {
      final response = await dio.post(ApiPaths.pair, data: {
        'pin': pin,
        'device_name': deviceName,
      });
      return PairingResult.fromJson(response.data as Map<String, dynamic>);
    } finally {
      dio.close();
    }
  }

  Future<List<ProjectSummary>> getProjects() async {
    final response = await _dio.get(ApiPaths.projects);
    final list = response.data as List<dynamic>;
    return list.map((e) => ProjectSummary.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<ProjectMeta> getProjectMeta(String slug) async {
    final response = await _dio.get(ApiPaths.projectPath(slug));
    return ProjectMeta.fromJson(response.data as Map<String, dynamic>);
  }

  Future<String> getReadme(String slug) async {
    final response = await _dio.get(ApiPaths.readmePath(slug));
    return _contentOf(response.data);
  }

  Future<void> putReadme(String slug, String content) async {
    await _dio.put(ApiPaths.readmePath(slug), data: {'content': content});
  }

  Future<String> getJournal(String slug) async {
    final response = await _dio.get(ApiPaths.journalPath(slug));
    return _contentOf(response.data);
  }

  Future<String> getContext(String slug) async {
    final response = await _dio.get(ApiPaths.contextPath(slug));
    return _contentOf(response.data);
  }

  /// 服务端期望 SchedulePatch { task_type, schedule, on_trigger }。
  /// 触发动作（notify/autopilot）在 on_trigger.action，不在 schedule 里。
  Future<void> putSchedule(
    String slug, {
    required String taskType,
    Schedule? schedule,
    String? action,
  }) async {
    await _dio.put(ApiPaths.schedulePath(slug), data: {
      'task_type': taskType,
      'schedule': schedule?.toJson(),
      'on_trigger': {'action': action ?? 'notify'},
    });
  }

  Future<List<Approval>> getApprovals() async {
    final response = await _dio.get(ApiPaths.approvals);
    final list = response.data as List<dynamic>;
    return list.map((e) => Approval.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<void> resolveApproval(String slug, String id, bool approved) async {
    await _dio.post(ApiPaths.resolveApprovalPath(slug, id), data: {'approved': approved});
  }

  Future<String> getMemory(String name) async {
    final response = await _dio.get(ApiPaths.memoryPath(name));
    return _contentOf(response.data);
  }

  Future<void> putMemory(String name, String content) async {
    await _dio.put(ApiPaths.memoryPath(name), data: {'content': content});
  }

  Future<void> killTerminal(String slug) async {
    await _dio.delete(ApiPaths.terminalPath(slug));
  }

  /// 服务端文本端点统一返回 {"content": "..."}。
  String _contentOf(dynamic data) =>
      (data as Map<String, dynamic>)['content'] as String;
}
