import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../api/dazi_api.dart';

final readmeProvider = FutureProvider.family<String, String>((ref, slug) async {
  final api = ref.watch(daziApiProvider);
  return api.getReadme(slug);
});

final journalProvider = FutureProvider.family<String, String>((ref, slug) async {
  final api = ref.watch(daziApiProvider);
  return api.getJournal(slug);
});

final contextProvider = FutureProvider.family<String, String>((ref, slug) async {
  final api = ref.watch(daziApiProvider);
  return api.getContext(slug);
});
