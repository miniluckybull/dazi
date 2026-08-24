const kDefaultDaemonPort = 7878;
const kPairTimeoutSeconds = 30;
const kMaxReconnectDelaySeconds = 30;

class StorageKeys {
  StorageKeys._();
  static const deviceToken = 'device_token';
  static const baseUrl = 'base_url';
  static const biometricLock = 'biometric_lock_enabled';
}

class ApiPaths {
  ApiPaths._();
  static const pair = '/api/v1/pair';
  static const health = '/health';
  static const config = '/api/v1/config';
  static const projects = '/api/v1/projects';
  static const project = '/api/v1/projects/{slug}';
  static const readme = '/api/v1/projects/{slug}/readme';
  static const journal = '/api/v1/projects/{slug}/journal';
  static const context = '/api/v1/projects/{slug}/context';
  static const schedule = '/api/v1/projects/{slug}/schedule';
  static const terminal = '/api/v1/projects/{slug}/terminal';
  static const memory = '/api/v1/memory/{name}';
  static const due = '/api/v1/due';
  static const runs = '/api/v1/runs';
  static const approvals = '/api/v1/approvals';
  static const plan = '/api/v1/projects/{slug}/plan';
  static const resolveApproval = '/api/v1/projects/{slug}/approvals/{id}';

  static String projectPath(String slug) => project.replaceFirst('{slug}', Uri.encodeComponent(slug));
  static String readmePath(String slug) => readme.replaceFirst('{slug}', Uri.encodeComponent(slug));
  static String journalPath(String slug) => journal.replaceFirst('{slug}', Uri.encodeComponent(slug));
  static String contextPath(String slug) => context.replaceFirst('{slug}', Uri.encodeComponent(slug));
  static String schedulePath(String slug) => schedule.replaceFirst('{slug}', Uri.encodeComponent(slug));
  static String terminalPath(String slug) => terminal.replaceFirst('{slug}', Uri.encodeComponent(slug));
  static String memoryPath(String name) => memory.replaceFirst('{name}', Uri.encodeComponent(name));
  static String planPath(String slug) => plan.replaceFirst('{slug}', Uri.encodeComponent(slug));
  static String resolveApprovalPath(String slug, String id) => resolveApproval
      .replaceFirst('{slug}', Uri.encodeComponent(slug))
      .replaceFirst('{id}', Uri.encodeComponent(id));
}

class WsPaths {
  WsPaths._();
  static const events = '/api/v1/events';
  static const terminal = '/api/v1/projects/{slug}/terminal';

  static String terminalPath(String slug) => terminal.replaceFirst('{slug}', Uri.encodeComponent(slug));
}
