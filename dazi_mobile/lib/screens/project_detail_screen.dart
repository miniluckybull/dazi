import 'package:flutter/material.dart';

class ProjectDetailScreen extends StatelessWidget {
  const ProjectDetailScreen({super.key, required this.slug});

  final String slug;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(slug)),
      body: Center(child: Text('项目详情: $slug')),
    );
  }
}
