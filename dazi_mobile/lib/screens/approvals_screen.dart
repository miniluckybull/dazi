import 'package:flutter/material.dart';

class ApprovalsScreen extends StatelessWidget {
  const ApprovalsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('审批')),
      body: const Center(child: Text('审批列表')),
    );
  }
}
