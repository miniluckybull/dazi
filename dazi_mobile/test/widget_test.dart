import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:dazi_mobile/app.dart';

void main() {
  testWidgets('App renders Dazi Mobile text', (WidgetTester tester) async {
    await tester.pumpWidget(const ProviderScope(child: DaziApp()));
    expect(find.text('Dazi Mobile'), findsOneWidget);
  });
}
