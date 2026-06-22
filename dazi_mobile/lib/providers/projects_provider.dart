import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../api/dazi_api.dart';
import '../models/models.dart';
import '../services/local_cache.dart';
import 'core_providers.dart';
import 'events_provider.dart';

class ProjectsNotifier extends StateNotifier<AsyncValue<List<ProjectSummary>>> {
  ProjectsNotifier(this._api, this._cache) : super(const AsyncValue.loading());

  final DaziApi _api;
  final LocalCacheService _cache;

  static const _cacheKey = 'projects_list';

  Future<void> load() async {
    final cached = await _cache.getJson(_cacheKey);
    if (cached != null && cached is List) {
      state = AsyncValue.data(
        cached.map((e) => ProjectSummary.fromJson(e as Map<String, dynamic>)).toList(),
      );
    }

    await refresh();
  }

  Future<void> refresh() async {
    try {
      final projects = await _api.getProjects();
      await _cache.setJson(_cacheKey, projects.map((p) => p.toJson()).toList());
      state = AsyncValue.data(projects);
    } catch (e, st) {
      if (state.value == null) {
        state = AsyncValue.error(e, st);
      }
    }
  }

  void updateProject(ProjectSummary updated) {
    state.whenData((projects) {
      final index = projects.indexWhere((p) => p.slug == updated.slug);
      if (index == -1) return;
      final updatedList = [...projects];
      updatedList[index] = updated;
      state = AsyncValue.data(updatedList);
    });
  }
}

final projectsProvider = StateNotifierProvider<ProjectsNotifier, AsyncValue<List<ProjectSummary>>>((ref) {
  final api = ref.watch(daziApiProvider);
  final cache = ref.watch(localCacheProvider);
  final notifier = ProjectsNotifier(api, cache);

  notifier.load();

  ref.listen(eventsProvider, (_, next) {
    next.whenData((event) {
      event.whenOrNull(
        taskCompleted: (slug, name, ok, summary) async {
          try {
            final meta = await api.getProjectMeta(slug);
            notifier.updateProject(
              ProjectSummary(
                slug: meta.slug,
                name: meta.name,
                status: meta.status,
                priority: meta.priority,
                archived: meta.archived,
                requiresReferences: meta.requiresReferences,
                hasReferences: meta.requiresReferences,
                taskType: meta.taskType,
                handedOffAt: meta.handedOffAt,
                nextRunAt: meta.nextRunAt,
                lastRunAt: meta.lastRunAt,
                lastRunOk: meta.lastRunOk,
                tags: meta.tags,
              ),
            );
          } catch (_) {
            // Ignore update failure.
          }
        },
      );
    });
  });

  return notifier;
});
