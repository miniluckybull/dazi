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

  /// 新建任务：POST /projects {name}，返回建好的 ProjectSummary（含 slug）。
  Future<ProjectSummary> createProject(String name) async {
    final response = await _dio.post(ApiPaths.projects, data: {'name': name});
    return ProjectSummary.fromJson(response.data as Map<String, dynamic>);
  }

  /// 以 plan 模式产出执行计划并登记待批，返回 Approval（含 plan 文本与 estimate）。
  /// claude 调用耗时长，单独放宽接收超时。
  Future<Approval> createPlan(String slug) async {
    final response = await _dio.post(
      ApiPaths.planPath(slug),
      options: Options(receiveTimeout: const Duration(minutes: 10)),
    );
    return Approval.fromJson(response.data as Map<String, dynamic>);
  }

  /// 跨项目最近运行历史（服务端上限 100 条）。
  Future<List<RunEntry>> getRuns() async {
    final response = await _dio.get(ApiPaths.runs);
    final list = response.data as List<dynamic>;
    return list.map((e) => RunEntry.fromJson(e as Map<String, dynamic>)).toList();
  }

  /// 探活：返回 claude 可用性；网络错误由调用方按未知处理。
  Future<HealthInfo> getHealth() async {
    final response = await _dio.get(ApiPaths.health);
    final data = response.data as Map<String, dynamic>;
    final claude = data['claude'] as Map<String, dynamic>?;
    return HealthInfo(
      claudeOk: claude?['ok'] as bool?,
      claudeError: claude?['error'] as String?,
    );
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

  Future<BatonState> getBaton(String slug) async {
    final response = await _dio.get(ApiPaths.batonPath(slug));
    return BatonState.fromJson(response.data as Map<String, dynamic>);
  }

  /// 认领棒。持棒人恒为当前设备所属成员，服务端不接受代认领。
  /// 他人持棒且未过期时服务端回 409。
  Future<Baton> claimBaton(String slug, {String? note}) async {
    final response = await _dio.post(
      ApiPaths.batonPath(slug),
      data: {if (note != null) 'note': note},
    );
    return Baton.fromJson(response.data as Map<String, dynamic>);
  }

  /// 递棒。kind 省略即 human；递给已停用成员服务端回 400。
  Future<Baton> handoffBaton(
    String slug, {
    required String to,
    String? kind,
    String? note,
  }) async {
    final response = await _dio.post(
      ApiPaths.batonHandoffPath(slug),
      data: {
        'to': to,
        if (kind != null) 'kind': kind,
        if (note != null) 'note': note,
      },
    );
    return Baton.fromJson(response.data as Map<String, dynamic>);
  }

  /// 放棒。force 为管理员强收他人的棒，需 manage_members 权限。
  Future<void> releaseBaton(String slug, {String? note, bool force = false}) async {
    await _dio.delete(
      ApiPaths.batonPath(slug),
      data: {if (note != null) 'note': note, 'force': force},
    );
  }

  Future<List<RelayEntry>> getRelayChain(String slug, {int? limit}) async {
    final response = await _dio.get(
      ApiPaths.relayPath(slug),
      queryParameters: {if (limit != null) 'limit': limit},
    );
    final list = response.data as List<dynamic>;
    return list.map((e) => RelayEntry.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<Inbox> getInbox() async {
    final response = await _dio.get(ApiPaths.inbox);
    return Inbox.fromJson(response.data as Map<String, dynamic>);
  }

  /// 成员列表。递棒时要选人，故手机也需要它。
  Future<List<Member>> getMembers() async {
    final response = await _dio.get(ApiPaths.members);
    final list = (response.data as Map<String, dynamic>)['members'] as List<dynamic>;
    return list.map((e) => Member.fromJson(e as Map<String, dynamic>)).toList();
  }

  /// 当前身份。界面据此决定显示哪些操作（例如 viewer 不显示「接手」）。
  Future<Me> getMe() async {
    final response = await _dio.get(ApiPaths.me);
    return Me.fromJson(response.data as Map<String, dynamic>);
  }

  /// 服务端文本端点统一返回 {"content": "..."}。
  String _contentOf(dynamic data) =>
      (data as Map<String, dynamic>)['content'] as String;
}
