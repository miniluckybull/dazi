import 'dart:async';
import 'dart:convert';

import 'package:web_socket_channel/web_socket_channel.dart';

import 'reconnect_policy.dart';

class TerminalWebSocket {
  TerminalWebSocket({
    required this.wsUrl,
    required this.onOutput,
    required this.onExit,
  });

  final Uri wsUrl;
  final void Function(String data) onOutput;
  final void Function() onExit;

  WebSocketChannel? _channel;
  final _reconnectPolicy = ReconnectPolicy();
  Timer? _reconnectTimer;
  bool _disposed = false;

  void connect() {
    if (_disposed) return;
    _reconnectTimer?.cancel();

    try {
      _channel = WebSocketChannel.connect(wsUrl);
      _channel!.stream.listen(
        _onMessage,
        onError: _onError,
        onDone: _onDone,
      );
      _reconnectPolicy.reset();
    } catch (e) {
      _scheduleReconnect();
    }
  }

  void _onMessage(dynamic message) {
    try {
      final json = jsonDecode(message as String) as Map<String, dynamic>;
      final type = json['type'] as String?;
      final data = json['data'] as String?;
      if (type == 'output' && data != null) {
        onOutput(data);
      } else if (type == 'exit') {
        onExit();
      }
    } catch (_) {
      // Ignore malformed messages.
    }
  }

  void _onError(Object error) => _scheduleReconnect();
  void _onDone() => _scheduleReconnect();

  void _scheduleReconnect() {
    if (_disposed) return;
    _reconnectTimer?.cancel();
    final delay = _reconnectPolicy.nextDelay();
    _reconnectTimer = Timer(delay, connect);
  }

  void sendInput(String data) {
    _channel?.sink.add(jsonEncode({'type': 'input', 'data': data}));
  }

  void resize(int cols, int rows) {
    _channel?.sink.add(jsonEncode({'type': 'resize', 'cols': cols, 'rows': rows}));
  }

  void dispose() {
    _disposed = true;
    _reconnectTimer?.cancel();
    _channel?.sink.close();
  }
}
