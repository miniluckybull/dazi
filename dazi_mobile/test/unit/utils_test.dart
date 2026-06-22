import 'package:flutter_test/flutter_test.dart';

import 'package:dazi_mobile/utils/ansi_keys.dart';
import 'package:dazi_mobile/websocket/reconnect_policy.dart';

void main() {
  group('ReconnectPolicy', () {
    test('starts at 1s and doubles up to max', () {
      final policy = ReconnectPolicy();
      expect(policy.nextDelay(), const Duration(seconds: 1));
      expect(policy.nextDelay(), const Duration(seconds: 2));
      expect(policy.nextDelay(), const Duration(seconds: 4));
      expect(policy.nextDelay(), const Duration(seconds: 8));
      expect(policy.nextDelay(), const Duration(seconds: 16));
      expect(policy.nextDelay(), const Duration(seconds: 30));
      expect(policy.nextDelay(), const Duration(seconds: 30));
    });

    test('reset returns to initial delay', () {
      final policy = ReconnectPolicy();
      policy.nextDelay();
      policy.nextDelay();
      policy.reset();
      expect(policy.nextDelay(), const Duration(seconds: 1));
    });
  });

  group('AnsiKeys', () {
    test('control characters', () {
      expect(AnsiKeys.control('c'), '\x03');
      expect(AnsiKeys.control('d'), '\x04');
      expect(AnsiKeys.control('z'), '\x1a');
    });

    test('invalid control returns empty', () {
      expect(AnsiKeys.control('1'), '');
      expect(AnsiKeys.control(''), '');
    });
  });
}
