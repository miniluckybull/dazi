import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'providers/auth_provider.dart';
import 'screens/approval_detail_screen.dart';
import 'screens/approvals_screen.dart';
import 'screens/memory_screen.dart';
import 'screens/new_project_screen.dart';
import 'screens/pair_screen.dart';
import 'screens/project_detail_screen.dart';
import 'screens/projects_screen.dart';
import 'screens/runs_screen.dart';
import 'screens/schedule_screen.dart';
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
                routes: [
                  GoRoute(
                    path: 'new',
                    builder: (context, state) => const NewProjectScreen(),
                  ),
                  GoRoute(
                    path: ':slug',
                    builder: (context, state) => ProjectDetailScreen(
                      slug: state.pathParameters['slug']!,
                      initialTab: state.uri.queryParameters['tab'],
                    ),
                    routes: [
                      GoRoute(
                        path: 'schedule',
                        builder: (context, state) => ScheduleScreen(
                          slug: state.pathParameters['slug']!,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
              GoRoute(
                path: '/runs',
                builder: (context, state) => const RunsScreen(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/approvals',
                builder: (context, state) => const ApprovalsScreen(),
                routes: [
                  GoRoute(
                    path: ':slug/:id',
                    builder: (context, state) => ApprovalDetailById(
                      slug: state.pathParameters['slug']!,
                      id: state.pathParameters['id']!,
                    ),
                  ),
                ],
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
