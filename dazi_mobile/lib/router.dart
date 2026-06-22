import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'providers/auth_provider.dart';
import 'screens/approvals_screen.dart';
import 'screens/memory_screen.dart';
import 'screens/pair_screen.dart';
import 'screens/projects_screen.dart';
import 'screens/shell_screen.dart';

final routerProvider = Provider<GoRouter>((ref) {
  final auth = ref.watch(authProvider);

  return GoRouter(
    initialLocation: '/projects',
    redirect: (context, state) {
      if (auth.isLoading) return null;
      final isPairRoute = state.matchedLocation == '/pair';
      if (!auth.isPaired && !isPairRoute) return '/pair';
      if (auth.isPaired && isPairRoute) return '/projects';
      return null;
    },
    routes: [
      GoRoute(
        path: '/pair',
        builder: (context, state) => const PairScreen(),
      ),
      StatefulShellRoute.indexedStack(
        builder: (context, state, navigationShell) => ShellScreen(
          navigationShell: navigationShell,
        ),
        branches: [
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/projects',
                builder: (context, state) => const ProjectsScreen(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/approvals',
                builder: (context, state) => const ApprovalsScreen(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/memory',
                builder: (context, state) => const MemoryScreen(),
              ),
            ],
          ),
        ],
      ),
    ],
  );
});
