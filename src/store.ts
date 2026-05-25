import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";

export interface AppConfig {
  workspace: string | null;
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
}

export interface MetaPatch {
  status?: string;
  priority?: string;
  tags?: string[];
  start_date?: string | null;
  due_date?: string | null;
  requires_references?: boolean;
  name?: string;
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

interface AppState {
  config: AppConfig | null;
  projects: ProjectSummary[];
  archived: ProjectSummary[];
  showArchived: boolean;
  selectedSlug: string | null;
  loading: boolean;
  error: string | null;
  loadConfig: () => Promise<void>;
  setWorkspace: (path: string) => Promise<void>;
  refreshProjects: () => Promise<void>;
  refreshArchived: () => Promise<void>;
  setShowArchived: (v: boolean) => void;
  createProject: (name: string, init?: ProjectInit) => Promise<void>;
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
  archiveProject: (projectPath: string) => Promise<void>;
}

export const useApp = create<AppState>((set, get) => ({
  config: null,
  projects: [],
  archived: [],
  showArchived: false,
  selectedSlug: null,
  loading: false,
  error: null,

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
    set({ showArchived: v, selectedSlug: null });
    if (v) get().refreshArchived();
  },

  createProject: async (name, init) => {
    const { config } = get();
    if (!config?.workspace) {
      set({ error: "请先选择工作区" });
      return;
    }
    try {
      const summary = await invoke<ProjectSummary>("create_project", {
        workspace: config.workspace,
        name,
        init: init ?? null,
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
}));
