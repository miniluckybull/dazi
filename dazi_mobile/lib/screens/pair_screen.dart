import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_scanner/mobile_scanner.dart';

import '../providers/auth_provider.dart';

class PairScreen extends ConsumerStatefulWidget {
  const PairScreen({super.key});

  @override
  ConsumerState<PairScreen> createState() => _PairScreenState();
}

class _PairScreenState extends ConsumerState<PairScreen> {
  final _urlController = TextEditingController();
  final _pinController = TextEditingController();
  bool _showScanner = true;

  @override
  void dispose() {
    _urlController.dispose();
    _pinController.dispose();
    super.dispose();
  }

  void _onQRDetect(BarcodeCapture capture) {
    final barcode = capture.barcodes.firstOrNull;
    final value = barcode?.rawValue;
    if (value == null) return;

    final uri = Uri.tryParse(value);
    if (uri == null) return;

    final url = uri.queryParameters['url'];
    final pin = uri.queryParameters['pin'];
    if (url != null && pin != null) {
      setState(() {
        _urlController.text = url;
        _pinController.text = pin;
        _showScanner = false;
      });
      _pair();
    }
  }

  Future<void> _pair() async {
    final url = _urlController.text.trim();
    final pin = _pinController.text.trim();
    if (url.isEmpty || pin.isEmpty) return;

    await ref.read(authProvider.notifier).pair(baseUrl: url, pin: pin);
  }

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authProvider);
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(title: const Text('配对 Dazi')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              '在电脑上启动 dazi-daemon，扫描终端显示的二维码，或手动输入地址和 PIN。',
              style: theme.textTheme.bodyMedium,
            ),
            const SizedBox(height: 16),
            if (_showScanner)
              AspectRatio(
                aspectRatio: 1,
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(12),
                  child: MobileScanner(onDetect: _onQRDetect),
                ),
              )
            else
              TextButton.icon(
                onPressed: () => setState(() => _showScanner = true),
                icon: const Icon(Icons.qr_code_scanner),
                label: const Text('重新扫描'),
              ),
            const SizedBox(height: 16),
            TextField(
              controller: _urlController,
              decoration: const InputDecoration(labelText: 'Daemon 地址'),
              keyboardType: TextInputType.url,
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _pinController,
              decoration: const InputDecoration(labelText: '配对码 PIN'),
              keyboardType: TextInputType.number,
            ),
            if (auth.error != null) ...[
              const SizedBox(height: 12),
              Text(auth.error!, style: TextStyle(color: theme.colorScheme.error)),
            ],
            const SizedBox(height: 20),
            FilledButton(
              onPressed: auth.isLoading ? null : _pair,
              child: auth.isLoading
                  ? const SizedBox(
                      height: 18,
                      width: 18,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Text('配对'),
            ),
          ],
        ),
      ),
    );
  }
}
