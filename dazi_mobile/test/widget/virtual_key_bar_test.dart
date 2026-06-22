import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:xterm/xterm.dart';

import 'package:dazi_mobile/utils/ansi_keys.dart';
import 'package:dazi_mobile/widgets/virtual_key_bar.dart';

void main() {
  testWidgets('VirtualKeyBar sends escape sequences', (WidgetTester tester) async {
    String? output;
    final terminal = Terminal(maxLines: 100);
    terminal.onOutput = (data) => output = data;

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: VirtualKeyBar(terminal: terminal),
        ),
      ),
    );

    await tester.tap(find.text('Esc'));
    await tester.pump();
    expect(output, AnsiKeys.esc);

    await tester.tap(find.text('↑'));
    await tester.pump();
    expect(output, AnsiKeys.arrowUp);

    await tester.tap(find.text('Ctrl+C'));
    await tester.pump();
    expect(output, AnsiKeys.control('c'));
  });
}
