import 'package:flutter/material.dart';
import 'package:xterm/xterm.dart';

import '../utils/ansi_keys.dart';

class VirtualKeyBar extends StatelessWidget {
  const VirtualKeyBar({super.key, required this.terminal});

  final Terminal terminal;

  void _send(String data) {
    if (data.isEmpty) return;
    terminal.onOutput?.call(data);
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final bg = theme.colorScheme.surfaceContainerHighest;

    return Container(
      color: bg,
      padding: EdgeInsets.only(
        left: 6,
        right: 6,
        top: 6,
        bottom: 6 + MediaQuery.of(context).padding.bottom,
      ),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: Row(
          children: [
            _Key(label: 'Esc', onTap: () => _send(AnsiKeys.esc)),
            _Key(label: 'Tab', onTap: () => _send(AnsiKeys.tab)),
            _Key(label: 'Ctrl+C', onTap: () => _send(AnsiKeys.control('c'))),
            _Key(label: 'Ctrl+D', onTap: () => _send(AnsiKeys.control('d'))),
            _Key(label: '↑', onTap: () => _send(AnsiKeys.arrowUp)),
            _Key(label: '↓', onTap: () => _send(AnsiKeys.arrowDown)),
            _Key(label: '←', onTap: () => _send(AnsiKeys.arrowLeft)),
            _Key(label: '→', onTap: () => _send(AnsiKeys.arrowRight)),
            _Key(label: 'PgUp', onTap: () => _send(AnsiKeys.pageUp)),
            _Key(label: 'PgDn', onTap: () => _send(AnsiKeys.pageDown)),
            _Key(label: '⏎', onTap: () => _send(AnsiKeys.enter)),
            _Key(label: '⌫', onTap: () => _send(AnsiKeys.backspace)),
          ],
        ),
      ),
    );
  }
}

class _Key extends StatelessWidget {
  const _Key({required this.label, required this.onTap});

  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 3),
      child: Material(
        color: theme.colorScheme.surface,
        borderRadius: BorderRadius.circular(6),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(6),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            child: Text(
              label,
              style: TextStyle(
                color: theme.colorScheme.onSurface,
                fontSize: 13,
              ),
            ),
          ),
        ),
      ),
    );
  }
}
