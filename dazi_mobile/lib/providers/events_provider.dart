import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/dazi_event.dart';
import '../providers/auth_provider.dart';
import '../websocket/events_ws.dart';

final eventsProvider = StreamProvider<DaziEvent>((ref) {
  final auth = ref.watch(authProvider);
  if (!auth.isPaired || auth.baseUrl == null) {
    return const Stream.empty();
  }

  final ws = EventsWebSocket(baseUrl: auth.baseUrl!, token: auth.token!);
  ws.connect();

  ref.onDispose(ws.dispose);
  return ws.events;
});
