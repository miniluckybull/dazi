import 'dart:io';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:hive_flutter/hive_flutter.dart';

import 'package:dazi_mobile/api/dazi_api.dart';
import 'package:dazi_mobile/app.dart';
import 'package:dazi_mobile/providers/auth_provider.dart';
import 'package:dazi_mobile/providers/core_providers.dart';
import 'package:dazi_mobile/providers/projects_provider.dart';

void main() {
  setUpAll(() async {
    final tempDir = Directory.systemTemp.createTempSync('dazi_test_hive');
    Hive.init(tempDir.path);
  });

  testWidgets('App renders projects tab when paired', (WidgetTester tester) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          authProvider.overrideWith((ref) => AuthNotifier(ref.read(secureStorageProvider))
            ..state = const AuthState(token: 'test', baseUrl: 'http://localhost:7878', isLoading: false)),
          projectsProvider.overrideWith((ref) => ProjectsNotifier(ref.read(daziApiProvider), ref.read(localCacheProvider))
            ..state = const AsyncValue.data([])),
        ],
        child: const DaziApp(),
      ),
    );
    await tester.pumpAndSettle();
    expect(find.text('暂无项目'), findsOneWidget);
  });
}
