import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../providers/auth_provider.dart';

class PairScreen extends ConsumerWidget {
  const PairScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(title: const Text('配对 Dazi')),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Text('请扫描二维码或手动输入地址和 PIN'),
            const SizedBox(height: 16),
            FilledButton(
              onPressed: () async {
                // TODO: 实现真实配对流程
                await ref.read(authProvider.notifier).savePairing(
                      baseUrl: 'http://localhost:7878',
                      token: 'dummy',
                    );
              },
              child: const Text('模拟配对'),
            ),
          ],
        ),
      ),
    );
  }
}
