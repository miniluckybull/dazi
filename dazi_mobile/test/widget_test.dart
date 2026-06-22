import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:dazi_mobile/app.dart';
import 'package:dazi_mobile/providers/auth_provider.dart';

void main() {
  testWidgets('App renders projects list when paired', (WidgetTester tester) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          authProvider.overrideWith((ref) => AuthNotifier(ref.read(secureStorageProvider))
            ..state = const AuthState(token: 'test', baseUrl: 'http://localhost:7878', isLoading: false)),
        ],
        child: const DaziApp(),
      ),
    );
    await tester.pumpAndSettle();
    expect(find.text('项目列表'), findsOneWidget);
  });
}
