import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";

export interface AppConfig {
  workspace: string | null;
}

export type TaskType = "oneoff" | "scheduled" | "recurring";
export type IntervalUnit = "minute" | "hour" | "day" | "week" | "month";

export interface Interval {
  every: number;
  unit: IntervalUnit;
}

export interface Schedule {
  run_at?: string | null;
  interval?: Interval | null;
  ends_at?: string | null;
  max_runs?: number | null;
  paused?: boolean;
}

export interface OnTrigger {
  action: "notify" | "handoff" | "autopilot";
  model?: string | null;
}

export interface SchedulePatch {
  task_type: TaskType;
  schedule?: Schedule | null;
  on_trigger?: OnTrigger | null;
}

export interface RunRecord {
  at: string;
  action: string;
  ok: boolean;
  message?: string | null;
}

export interface DueProject {
  slug: string;
  name: string;
  path: string;
  action: string;
  model?: string | null;
  due_at: string;
}

export interface ProjectSummary {
  slug: string;
  name: string;
  status: string;
  priority: string;
  path: string;
  created_at: string;
  updated_at: string;
  requires_references: boolean;
  has_references: boolean;
  handed_off_at: string | null;
  archived: boolean;
  task_type: TaskType;
  next_run_at: string | null;
  last_run_ok: boolean | null;
  last_run_at: string | null;
}

export interface ProjectMeta {
  slug: string;
  name: string;
  status: string;
  priority: string;
  tags: string[];
  start_date: string | null;
  due_date: string | null;
  requires_references: boolean;
  handed_off_at: string | null;
  created_at: string;
  updated_at: string;
  task_type: TaskType;
  schedule: Schedule | null;
  on_trigger: OnTrigger | null;
  runs: RunRecord[];
  next_run_at: string | null;
  /** 任务级指定注入的个人 skill（~/.claude/skills/ 下的 slug） */
  skills: string[];
}

export interface MetaPatch {
  status?: string;
  priority?: string;
  tags?: string[];
  start_date?: string | null;
  due_date?: string | null;
  requires_references?: boolean;
  name?: string;
  skills?: string[];
}

export interface ProjectInit {
  status?: string;
  priority?: string;
  tags?: string[];
  start_date?: string | null;
  due_date?: string | null;
  requires_references?: boolean;
}

export interface ReferenceEntry {
  name: string;
  path: string;
  size: number;
  modified_at: string;
  is_dir: boolean;
}

/** 团队成员。与 dazi_core::team::Member 对齐。 */
export interface TeamMember {
  id: string;
  name: string;
  role: "viewer" | "member" | "admin" | "owner";
  status: "active" | "suspended";
  created_at?: string;
}

/** 接力棒。holder 在 kind=human 时是 member_id，agent 时是 agent 名。 */
export interface Baton {
  holder: string;
  kind: "human" | "agent";
  since: string;
  expires_at: string;
}

/** expired 区分「从没人碰过」（baton=null）与「有人拿了但超时」——后者可直接接管。 */
export interface BatonState {
  baton: Baton | null;
  expired: boolean;
}

/** relay.jsonl 的一条。by 是实际写入者，管理员强收时不等于 from。 */
export interface RelayEntry {
  at: string;
  action: "claim" | "handoff" | "release" | "expire";
  from?: string | null;
  to?: string | null;
  kind?: "human" | "agent" | null;
  note?: string | null;
  by: string;
}

interface AppState {
  config: AppConfig | null;
  projects: ProjectSummary[];
  archived: ProjectSummary[];
  showArchived: boolean;
  /** 左侧栏「技能」视图：列出 ~/.claude/skills/ 个人 skill */
  showSkills: boolean;
  skills: Skill[];
  selectedSkillSlug: string | null;
  selectedSlug: string | null;
  loading: boolean;
  error: string | null;
  /** 终端会话等待用户确认的任务（slug → true），由 terminal/manager 维护 */
  attention: Record<string, boolean>;
  setAttention: (slug: string, v: boolean) => void;
  /** 代理模式：handoff 时走非交互 bypassPermissions，跳过逐条确认（反馈 #1）。
   *  设备级偏好，持久化 localStorage。 */
  agentMode: boolean;
  setAgentMode: (v: boolean) => void;
  loadConfig: () => Promise<void>;
  setWorkspace: (path: string) => Promise<void>;
  refreshProjects: () => Promise<void>;
  refreshArchived: () => Promise<void>;
  setShowArchived: (v: boolean) => void;
  setShowSkills: (v: boolean) => void;
  refreshSkills: () => Promise<void>;
  selectSkill: (slug: string | null) => void;
  createProject: (name: string, init?: ProjectInit) => Promise<ProjectSummary | null>;
  linkExistingFolder: (path: string) => Promise<void>;
  deleteProject: (projectPath: string) => Promise<void>;
  selectProject: (slug: string | null) => void;
  readReadme: (projectPath: string) => Promise<string>;
  writeReadme: (projectPath: string, content: string) => Promise<void>;
  readMeta: (projectPath: string) => Promise<ProjectMeta>;
  updateMeta: (projectPath: string, patch: MetaPatch) => Promise<ProjectMeta>;
  listReferences: (projectPath: string) => Promise<ReferenceEntry[]>;
  importReferences: (
    projectPath: string,
    sources: string[]
  ) => Promise<ReferenceEntry[]>;
  revealInFinder: (path: string) => Promise<void>;
  revealReferences: (projectPath: string) => Promise<void>;
  openTerminal: (path: string) => Promise<void>;
  handOffToClaude: (projectPath: string) => Promise<ProjectMeta>;
  planWithClaude: (projectPath: string) => Promise<ProjectMeta>;
  continueWithClaude: (projectPath: string) => Promise<void>;
  archiveProject: (projectPath: string) => Promise<void>;
  unarchiveProject: (projectPath: string) => Promise<void>;
  extractSkill: (projectPath: string) => Promise<string>;
  runAutopilotNow: (projectPath: string) => Promise<boolean>;
  setSchedule: (projectPath: string, patch: SchedulePatch) => Promise<ProjectMeta>;
  listDue: () => Promise<DueProject[]>;
  recordRun: (
    projectPath: string,
    action: string,
    ok: boolean,
    message?: string
  ) => Promise<ProjectMeta>;
  readProfile: () => Promise<string>;
  writeProfile: (content: string) => Promise<void>;
  readPatterns: () => Promise<string>;
  writePatterns: (content: string) => Promise<void>;
  readFacts: () => Promise<string>;
  writeFacts: (content: string) => Promise<void>;
  readProjectJournal: (projectPath: string) => Promise<string>;
  readProjectContext: (projectPath: string) => Promise<string>;
  synthesizePatterns: () => Promise<void>;
  /** CLI 后端选择（反馈 #14）：持久化到 ~/.dazi/config.json */
  backend: string;
  backendList: BackendInfo[];
  loadBackend: () => Promise<void>;
  setBackend: (name: string) => Promise<void>;
  /** 模型可用检测结果（最近一次），常驻健康点指示用；持久化 localStorage。 */
  probeStatus: "unknown" | "ok" | "fail";
  probeAt: number | null;
  setProbeResult: (ok: boolean) => void;
  /** 模型可用检测（反馈 #15：整合 model-test） */
  testModelConfig: (config: ModelTestInput) => Promise<ModelTestResult>;
  /** 用量查询（反馈 #16） */
  getUsage: (month: string) => Promise<UsageMonth>;
  listUsageMonths: () => Promise<string[]>;
  /** 个人技能库（~/.claude/skills/，归档任务提炼产物） */
  listSkills: () => Promise<Skill[]>;
  readSkill: (slug: string) => Promise<string>;
  deleteSkill: (slug: string) => Promise<void>;
  skillExists: (slug: string) => Promise<boolean>;
  /** 凭据与环境检测（反馈 #13） */
  getCredentials: () => Promise<Credentials>;
  saveCredential: (slot: string, cred: Credential) => Promise<void>;
  clearCredential: (slot: string) => Promise<void>;
  checkEnvironment: () => Promise<string>;
  /** 远程 daemon 连接（反馈 #12 MVP） */
  getDaemonConfig: () => Promise<DaemonConfig>;
  saveDaemonConfig: (c: DaemonConfig) => Promise<void>;
  daemonPing: (host: string, port: number) => Promise<unknown>;
  /** 接力棒：桌面直读文件系统，与 daemon 共用同一份 baton.json */
  teamMembers: TeamMember[];
  refreshTeamMembers: () => Promise<void>;
  readBaton: (projectPath: string) => Promise<BatonState>;
  readRelayChain: (projectPath: string) => Promise<RelayEntry[]>;
  claimBaton: (projectPath: string, note?: string) => Promise<Baton>;
  handoffBaton: (projectPath: string, to: string, note?: string) => Promise<Baton>;
  releaseBaton: (projectPath: string, note?: string, force?: boolean) => Promise<void>;
}

export interface DaemonConfig {
  host: string;
  port: number;
  pin: string;
}

export interface Credential {
  base_url: string;
  api_key: string;
  provider: string;
}

export interface Credentials {
  anthropic: Credential | null;
  openai: Credential | null;
  custom: Credential | null;
}

export interface Skill {
  slug: string;
  path: string;
  description: string | null;
  updated_at: string | null;
}

export interface UsageEntry {
  at: string;
  project_slug: string;
  model: string | null;
  input_tokens: number;
  output_tokens: number;
  cache_creation_input_tokens: number;
  cache_read_input_tokens: number;
  cost_usd: number;
}

export interface UsageMonth {
  entries: UsageEntry[];
}

export interface ModelTestInput {
  id: string;
  name: string;
  provider: string;
  endpoint: string;
  model: string;
  api_key: string;
}

export interface ModelTestResult {
  config_id: string;
  success: boolean;
  latency_ms: number;
  prompt_tokens: number;
  completion_tokens: number;
  error_message: string | null;
  model_response: string | null;
  actual_model: string | null;
}

export interface BackendInfo {
  name: string;
  bin: string;
  version: string | null;
  supports_permission_mode: boolean;
}

export const useApp = create<AppState>((set, get) => ({
  config: null,
  projects: [],
  archived: [],
  showArchived: false,
  showSkills: false,
  skills: [],
  selectedSkillSlug: null,
  selectedSlug: null,
  loading: false,
  error: null,
  attention: {},
  agentMode: localStorage.getItem("dazi_agent_mode") === "1",
  backend: "claude",
  backendList: [],
  probeStatus: (localStorage.getItem("dazi_probe_status") as "ok" | "fail") ?? "unknown",
  probeAt: Number(localStorage.getItem("dazi_probe_at")) || null,

  setProbeResult: (ok) => {
    const at = Date.now();
    localStorage.setItem("dazi_probe_status", ok ? "ok" : "fail");
    localStorage.setItem("dazi_probe_at", String(at));
    set({ probeStatus: ok ? "ok" : "fail", probeAt: at });
  },

  setAttention: (slug, v) =>
    set((st) => {
      if (!!st.attention[slug] === v) return st;
      return { attention: { ...st.attention, [slug]: v } };
    }),

  setAgentMode: (v) => {
    localStorage.setItem("dazi_agent_mode", v ? "1" : "0");
    set({ agentMode: v });
  },

  loadConfig: async () => {
    try {
      const cfg = await invoke<AppConfig>("get_config");
      set({ config: cfg, error: null });
      if (cfg.workspace) await get().refreshProjects();
    } catch (e: any) {
      set({ error: String(e) });
    }
  },

  setWorkspace: async (path) => {
    set({ loading: true });
    try {
      const cfg = await invoke<AppConfig>("set_workspace", { path });
      set({ config: cfg, error: null });
      await get().refreshProjects();
    } catch (e: any) {
      set({ error: String(e) });
    } finally {
      set({ loading: false });
    }
  },

  refreshProjects: async () => {
    const { config } = get();
    if (!config?.workspace) {
      set({ projects: [] });
      return;
    }
    set({ loading: true });
    try {
      const list = await invoke<ProjectSummary[]>("list_projects", {
        workspace: config.workspace,
      });
      set({ projects: list, error: null });
    } catch (e: any) {
      set({ error: String(e) });
    } finally {
      set({ loading: false });
    }
  },

  refreshArchived: async () => {
    const { config } = get();
    if (!config?.workspace) {
      set({ archived: [] });
      return;
    }
    try {
      const list = await invoke<ProjectSummary[]>("list_archived_projects", {
        workspace: config.workspace,
      });
      set({ archived: list, error: null });
    } catch (e: any) {
      set({ error: String(e) });
    }
  },

  setShowArchived: (v) => {
    set({ showArchived: v, showSkills: false, selectedSlug: null });
    if (v) get().refreshArchived();
  },

  setShowSkills: (v) => {
    set({ showSkills: v, selectedSkillSlug: null });
    if (v) get().refreshSkills();
  },

  refreshSkills: async () => {
    try {
      const skills = await get().listSkills();
      set({ skills });
    } catch (e: any) {
      set({ error: String(e) });
    }
  },

  selectSkill: (slug) => set({ selectedSkillSlug: slug }),

  createProject: async (name, init) => {
    const { config } = get();
    if (!config?.workspace) {
      set({ error: "请先选择工作区" });
      return null;
    }
    try {
      const summary = await invoke<ProjectSummary>("create_project", {
        workspace: config.workspace,
        name,
        init: init ?? null,
      });
      set({ error: null, selectedSlug: summary.slug });
      await get().refreshProjects();
      return summary;
    } catch (e: any) {
      set({ error: String(e) });
      return null;
    }
  },

  linkExistingFolder: async (path) => {
    const { config } = get();
    if (!config?.workspace) {
      set({ error: "请先选择工作区" });
      return;
    }
    try {
      const summary = await invoke<ProjectSummary>("create_project_from_path", {
        workspace: config.workspace,
        source: path,
      });
      set({ error: null, selectedSlug: summary.slug });
      await get().refreshProjects();
    } catch (e: any) {
      set({ error: String(e) });
    }
  },

  deleteProject: async (projectPath) => {
    try {
      await invoke("delete_project", { projectPath });
      set({ selectedSlug: null });
      await get().refreshProjects();
      if (get().showArchived) await get().refreshArchived();
    } catch (e: any) {
      set({ error: String(e) });
    }
  },

  selectProject: (slug) => set({ selectedSlug: slug }),

  readReadme: (projectPath) =>
    invoke<string>("read_project_readme", { projectPath }),

  writeReadme: async (projectPath, content) => {
    await invoke("write_project_readme", { projectPath, content });
    await get().refreshProjects();
  },

  readMeta: (projectPath) =>
    invoke<ProjectMeta>("read_project_meta", { projectPath }),

  updateMeta: async (projectPath, patch) => {
    const meta = await invoke<ProjectMeta>("update_project_meta", {
      projectPath,
      patch,
    });
    await get().refreshProjects();
    return meta;
  },

  listReferences: (projectPath) =>
    invoke<ReferenceEntry[]>("list_project_references", { projectPath }),

  importReferences: async (projectPath, sources) => {
    const list = await invoke<ReferenceEntry[]>("import_project_references", {
      projectPath,
      sources,
    });
    await get().refreshProjects();
    return list;
  },

  revealInFinder: (path) => invoke("reveal_in_finder", { path }),

  revealReferences: (projectPath) =>
    invoke("reveal_references", { projectPath }),

  openTerminal: (path) => invoke("open_terminal", { path }),

  handOffToClaude: async (projectPath) => {
    const meta = await invoke<ProjectMeta>("hand_off_to_claude", { projectPath });
    await get().refreshProjects();
    return meta;
  },

  planWithClaude: async (projectPath) => {
    const meta = await invoke<ProjectMeta>("plan_with_claude", { projectPath });
    await get().refreshProjects();
    return meta;
  },

  continueWithClaude: (projectPath) =>
    invoke("continue_with_claude", { projectPath }),

  archiveProject: async (projectPath) => {
    const { config } = get();
    if (!config?.workspace) return;
    await invoke("archive_project", {
      workspace: config.workspace,
      projectPath,
    });
    set({ selectedSlug: null });
    await get().refreshProjects();
    if (get().showArchived) await get().refreshArchived();
  },

  unarchiveProject: async (projectPath) => {
    const { config } = get();
    if (!config?.workspace) return;
    await invoke("unarchive_project", {
      workspace: config.workspace,
      projectPath,
    });
    set({ selectedSlug: null });
    await get().refreshProjects();
    if (get().showArchived) await get().refreshArchived();
  },

  extractSkill: async (projectPath) => {
    // 返回预期的 SKILL.md 路径，前端据此轮询产物是否生成
    return invoke<string>("extract_skill", { projectPath });
  },

  runAutopilotNow: async (projectPath) => {
    const ok = await invoke<boolean>("run_autopilot_now", { projectPath });
    await get().refreshProjects();
    return ok;
  },

  setSchedule: async (projectPath, patch) => {
    const meta = await invoke<ProjectMeta>("set_project_schedule", {
      projectPath,
      patch,
    });
    await get().refreshProjects();
    return meta;
  },

  listDue: async () => {
    const { config } = get();
    if (!config?.workspace) return [];
    return invoke<DueProject[]>("list_due_projects", {
      workspace: config.workspace,
    });
  },

  recordRun: async (projectPath, action, ok, message) =>
    invoke<ProjectMeta>("record_project_run", {
      projectPath,
      action,
      ok,
      message: message ?? null,
    }),

  readProfile: () => invoke<string>("read_profile"),
  writeProfile: (content) => invoke("write_profile", { content }),
  readPatterns: () => invoke<string>("read_patterns"),
  writePatterns: (content) => invoke("write_patterns", { content }),
  readFacts: () => invoke<string>("read_facts"),
  writeFacts: (content) => invoke("write_facts", { content }),
  readProjectJournal: (projectPath) =>
    invoke<string>("read_project_journal", { projectPath }),
  readProjectContext: (projectPath) =>
    invoke<string>("read_project_context", { projectPath }),
  synthesizePatterns: () => invoke("synthesize_patterns"),

  loadBackend: async () => {
    try {
      const [name, list] = await Promise.all([
        invoke<string>("get_backend"),
        invoke<BackendInfo[]>("list_backends"),
      ]);
      set({ backend: name, backendList: list });
    } catch (e: any) {
      set({ error: String(e) });
    }
  },

  setBackend: async (name) => {
    try {
      const confirmed = await invoke<string>("set_backend", { name });
      set({ backend: confirmed });
    } catch (e: any) {
      set({ error: String(e) });
    }
  },

  testModelConfig: async (config) => {
    return invoke<ModelTestResult>("test_model_config", { config });
  },

  getUsage: async (month) => {
    return invoke<UsageMonth>("get_usage", { month });
  },
  listUsageMonths: async () => {
    return invoke<string[]>("list_usage_months");
  },

  listSkills: async () => {
    return invoke<Skill[]>("list_skills");
  },
  readSkill: async (slug) => {
    return invoke<string>("read_skill", { slug });
  },
  deleteSkill: async (slug) => {
    await invoke("delete_skill", { slug });
  },
  skillExists: async (slug) => {
    return invoke<boolean>("skill_exists", { slug });
  },

  getCredentials: async () => {
    return invoke<Credentials>("get_credentials");
  },
  saveCredential: async (slot, cred) => {
    await invoke("save_credential", { slot, cred });
  },
  clearCredential: async (slot) => {
    await invoke("clear_credential", { slot });
  },
  checkEnvironment: async () => {
    return invoke<string>("check_environment");
  },

  getDaemonConfig: async () => {
    return invoke<DaemonConfig>("get_daemon_config");
  },
  saveDaemonConfig: async (c) => {
    await invoke("save_daemon_config", { c });
  },
  daemonPing: async (host, port) => {
    return invoke("daemon_ping", { host, port });
  },

  teamMembers: [],

  refreshTeamMembers: async () => {
    try {
      set({ teamMembers: await invoke<TeamMember[]>("list_team_members") });
    } catch {
      // team.yml 不存在是单机用户的正常状态，不当错误弹给用户。
      set({ teamMembers: [] });
    }
  },

  readBaton: (projectPath) => invoke<BatonState>("read_baton", { projectPath }),

  readRelayChain: (projectPath) =>
    invoke<RelayEntry[]>("read_relay_chain", { projectPath }),

  claimBaton: (projectPath, note) =>
    invoke<Baton>("claim_baton", { projectPath, note: note ?? null }),

  handoffBaton: (projectPath, to, note) =>
    invoke<Baton>("handoff_baton", { projectPath, to, note: note ?? null }),

  releaseBaton: (projectPath, note, force = false) =>
    invoke("release_baton", { projectPath, note: note ?? null, force }),
}));
