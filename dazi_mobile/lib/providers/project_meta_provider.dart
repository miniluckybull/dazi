import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../api/dazi_api.dart';
import '../models/project_meta.dart';

final projectMetaProvider = FutureProvider.family<ProjectMeta, String>((ref, slug) async {
  final api = ref.watch(daziApiProvider);
  return api.getProjectMeta(slug);
});
