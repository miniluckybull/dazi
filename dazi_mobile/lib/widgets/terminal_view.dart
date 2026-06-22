import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:xterm/xterm.dart';

import '../providers/terminal_provider.dart';
import 'virtual_key_bar.dart';

class DaziTerminalView extends ConsumerWidget {
  const DaziTerminalView({super.key, required this.slug});

  final String slug;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final asyncSession = ref.watch(terminalProvider(slug));

    return asyncSession.when(
      data: (session) {
        if (session == null) {
          return const Center(child: Text('终端未连接'));
        }
        return Column(
          children: [
            Expanded(
              child: TerminalView(
                session.terminal,
                controller: session.controller,
                autofocus: true,
              ),
            ),
            VirtualKeyBar(terminal: session.terminal),
          ],
        );
      },
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, _) => Center(child: Text('终端连接失败: $e')),
    );
  }
}
