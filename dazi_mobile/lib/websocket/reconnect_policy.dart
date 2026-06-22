import 'dart:math';

class ReconnectPolicy {
  static const _maxDelay = Duration(seconds: 30);
  static const _initialDelay = Duration(seconds: 1);

  Duration _delay = _initialDelay;

  Duration nextDelay() {
    final current = _delay;
    _delay = Duration(
      milliseconds: min(_delay.inMilliseconds * 2, _maxDelay.inMilliseconds),
    );
    return current;
  }

  void reset() => _delay = _initialDelay;
}
