import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../services/local_cache.dart';

final localCacheProvider = Provider<LocalCacheService>((ref) => LocalCacheService());
