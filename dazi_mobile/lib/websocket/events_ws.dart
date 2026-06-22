import 'dart:async';
import 'dart:convert';

import 'package:web_socket_channel/web_socket_channel.dart';

import '../models/dazi_event.dart';
import 'reconnect_policy.dart';

class EventsWebSocket {
  EventsWebSocket({required this.baseUrl, required this.token});

  final String baseUrl;
  final String token;

  WebSocketChannel? _channel;
  final _controller = StreamController<DaziEvent>.broadcast();
  final _reconnectPolicy = ReconnectPolicy();
  Timer? _reconnectTimer;
  bool _disposed = false;

  Stream<DaziEvent> get events => _controller.stream;

  void connect() {
    if (_disposed) return;
    _reconnectTimer?.cancel();

    final uri = Uri.parse(baseUrl)
        .replace(
          scheme: Uri.parse(baseUrl).scheme == 'https' ? 'wss' : 'ws',
          path: '/api/v1/events',
          queryParameters: {'token': token},
        );

    try {
      _channel = WebSocketChannel.connect(uri);
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
      final event = DaziEvent.fromJson(json);
      _controller.add(event);
    } catch (_) {
      // Ignore malformed events.
    }
  }

  void _onError(Object error) {
    _scheduleReconnect();
  }

  void _onDone() {
    _scheduleReconnect();
  }

  void _scheduleReconnect() {
    if (_disposed) return;
    _reconnectTimer?.cancel();
    final delay = _reconnectPolicy.nextDelay();
    _reconnectTimer = Timer(delay, connect);
  }

  void dispose() {
    _disposed = true;
    _reconnectTimer?.cancel();
    _channel?.sink.close();
    _controller.close();
  }
}
