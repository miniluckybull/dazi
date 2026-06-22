import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:xterm/xterm.dart';

import '../api/dazi_api.dart';
import '../constants.dart';
import '../providers/auth_provider.dart';
import '../websocket/terminal_ws.dart';

class TerminalSession {
  TerminalSession({
    required this.terminal,
    required this.controller,
    required this.webSocket,
  });

  final Terminal terminal;
  final TerminalController controller;
  final TerminalWebSocket webSocket;
}

class TerminalNotifier extends StateNotifier<AsyncValue<TerminalSession?>> {
  TerminalNotifier({
    required this.slug,
    required this.auth,
    required this.api,
  }) : super(const AsyncValue.loading()) {
    _init();
  }

  final String slug;
  final AuthState auth;
  final DaziApi api;

  TerminalSession? _session;

  Future<void> _init() async {
    if (!auth.isPaired || auth.baseUrl == null) {
      state = const AsyncValue.data(null);
      return;
    }

    final terminal = Terminal(maxLines: 10000);
    final controller = TerminalController();

    terminal.onOutput = (data) {
      _session?.webSocket.sendInput(data);
    };

    final wsUrl = Uri.parse(auth.baseUrl!).replace(
      scheme: Uri.parse(auth.baseUrl!).scheme == 'https' ? 'wss' : 'ws',
      path: WsPaths.terminalPath(slug),
      queryParameters: {
        'token': auth.token!,
        'launch': 'handoff',
        'cols': '80',
        'rows': '24',
      },
    );

    final ws = TerminalWebSocket(
      wsUrl: wsUrl,
      onOutput: terminal.write,
      onExit: () {
        terminal.write('\r\n[会话已结束]\r\n');
      },
    );

    _session = TerminalSession(
      terminal: terminal,
      controller: controller,
      webSocket: ws,
    );

    state = AsyncValue.data(_session);
    ws.connect();
  }

  void resize(int cols, int rows) {
    _session?.webSocket.resize(cols, rows);
  }

  Future<void> killSession() async {
    try {
      await api.killTerminal(slug);
    } catch (_) {
      // Ignore.
    }
    disposeSession();
  }

  void disposeSession() {
    final session = _session;
    _session = null;
    session?.webSocket.dispose();
    session?.controller.dispose();
    if (mounted) state = const AsyncValue.data(null);
  }

  @override
  void dispose() {
    disposeSession();
    super.dispose();
  }
}

final terminalProvider = StateNotifierProvider.family<
    TerminalNotifier,
    AsyncValue<TerminalSession?>,
    String>((ref, slug) {
  final auth = ref.watch(authProvider);
  final api = ref.watch(daziApiProvider);

  final notifier = TerminalNotifier(
    slug: slug,
    auth: auth,
    api: api,
  );

  ref.onDispose(notifier.dispose);
  return notifier;
});
