import { useEffect, useRef, useState } from "react";
import { open, ask } from "@tauri-apps/plugin-dialog";
import { getCurrentWindow, LogicalSize } from "@tauri-apps/api/window";
import { listen } from "@tauri-apps/api/event";
import {
  Trash2,
  Folder,
  FolderOpen,
  Clock,
  Repeat,
  Zap,
  Brain,
  Settings,
  ChevronsLeft,
  ChevronsRight,
  Sun,
  Moon,
  SunMoon,
} from "lucide-react";
import { useApp, ProjectSummary, ProjectInit, TaskType } from "./store";
import { ProjectDetail } from "./ProjectDetail";
import { SettingsPanel } from "./SettingsPanel";
import { PreferencesPanel } from "./PreferencesPanel";
import { ThemePref, cycleTheme, getThemePref, initTheme, onThemeChange } from "./theme";
import "./App.css";

function formatNext(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  const pad = (n: number) => String(n).padStart(2, "0");
  const time = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  if (sameDay) return `今天 ${time}`;
  return `${d.getMonth() + 1}/${d.getDate()} ${time}`;
}

/** 左侧色条只表达任务整体是否已开展（不承载智能体执行状态）。 */
function leftBorderColor(p: ProjectSummary): string {
  if (p.archived) return "border-l-gray-300/90";
  return p.handed_off_at ? "border-l-accent/80" : "border-l-gray-300/70";
}

/** 智能体执行状态 → 图标配色/闪烁，融入右上角任务类型图标（反馈 #2）。 */
function executionIconClass(p: ProjectSummary, attention: boolean): string {
  if (attention) return "text-red-500 animate-pulse";
  if (p.last_run_ok === false) return "text-red-500";
  if (p.handed_off_at && p.last_run_ok !== true) return "text-amber-500";
  if (p.last_run_ok === true) return "text-emerald-500";
  return "text-gray-400";
}

function executionStateTitle(p: ProjectSummary, attention: boolean): string {
  if (attention) return "待确认";
  if (p.last_run_ok === false) return "已中断";
  if (p.handed_off_at && p.last_run_ok !== true) return "进行中";
  if (p.last_run_ok === true) return "已完成";
  return "未启动";
}

function taskTypeBadgeIcon(t: TaskType, archived: boolean, iconCls: string) {
  if (archived) return null;
  if (t === "scheduled")
    return <Clock size={11} className={iconCls} />;
  if (t === "recurring")
    return <Repeat size={11} className={iconCls} />;
  return <Zap size={11} className={iconCls} />;
}

function taskTypeBadgeTitle(t: TaskType): string {
  if (t === "scheduled") return "定时任务";
  if (t === "recurring") return "循环任务";
  return "一次性任务";
}

function ThemeToggle() {
  const [pref, setPref] = useState<ThemePref>(getThemePref);
  useEffect(() => onThemeChange(setPref), []);
  const title =
    pref === "light"
      ? "外观：浅色（点击切深色）"
      : pref === "dark"
        ? "外观：深色（点击切跟随系统）"
        : "外观：跟随系统（点击切浅色）";
  return (
    <button
      onClick={() => cycleTheme()}
      title={title}
      className="flex h-7 w-7 items-center justify-center rounded-md border border-white/60 bg-white/70 text-gray-600 transition hover:bg-white hover:text-gray-900"
    >
      {pref === "light" ? (
        <Sun size={14} />
      ) : pref === "dark" ? (
        <Moon size={14} />
      ) : (
        <SunMoon size={14} />
      )}
    </button>
  );
}

function WorkspacePicker() {
  const setWorkspace = useApp((s) => s.setWorkspace);
  const error = useApp((s) => s.error);

  async function pick() {
    const selected = await open({ directory: true, multiple: false });
    if (typeof selected === "string") {
      await setWorkspace(selected);
    }
  }

  return (
    <div className="flex h-full items-center justify-center px-6">
      <div className="max-w-md rounded-2xl border border-white/70 bg-white/55 px-8 py-10 text-center shadow-glass-lg backdrop-blur-xl">
        <h1 className="mb-2 text-2xl font-semibold text-gray-900">欢迎使用 Dazi</h1>
        <p className="mb-6 text-sm text-gray-600">
          选择一个文件夹作为工作区，所有任务都会以子目录形式保存在其中。
          建议放在 iCloud Drive 中以便多设备同步。
        </p>
        <button
          onClick={pick}
          className="rounded-lg bg-accent/90 px-4 py-2 text-sm font-medium text-on-accent shadow-md shadow-accent/20 transition hover:bg-accent"
        >
          选择工作区文件夹
        </button>
        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      </div>
    </div>
  );
}

function NewTaskForm({ onCancel }: { onCancel: () => void }) {
  const createProject = useApp((s) => s.createProject);
  const linkExistingFolder = useApp((s) => s.linkExistingFolder);
  const [name, setName] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const init: ProjectInit = {
      requires_references: true,
    };
    await createProject(name.trim(), init);
    onCancel();
  }

  async function linkFolder() {
    const dir = await open({ directory: true, title: "选择要关联的项目文件夹" });
    if (!dir) return;
    await linkExistingFolder(dir as string);
    onCancel();
  }

  return (
    <form
      onSubmit={submit}
      className="space-y-2 border-b border-white/60 bg-white/40 p-3 text-xs backdrop-blur"
    >
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="任务名称"
        className="w-full rounded-md border border-white/70 bg-white/80 px-2 py-1.5 text-sm outline-none transition focus:border-accent-border focus:bg-white"
      />
      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          className="flex-1 rounded-md bg-accent/90 py-1.5 text-xs font-medium text-on-accent shadow-sm shadow-accent/20 transition hover:bg-accent"
        >
          创建
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-white/70 bg-white/70 px-3 py-1.5 text-xs text-gray-700 transition hover:bg-white"
        >
          取消
        </button>
      </div>
      <button
        type="button"
        onClick={linkFolder}
        className="w-full rounded-md border border-dashed border-accent-border/70 bg-white/50 py-1.5 text-xs text-accent-text transition hover:bg-accent-soft/70"
      >
        关联已有文件夹…
      </button>
    </form>
  );
}

function ProjectList({
  items,
  onOpenSettings,
  onOpenPreferences,
  collapsed,
  onToggleCollapse,
}: {
  items: ProjectSummary[];
  onOpenSettings: () => void;
  onOpenPreferences: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}) {
  const selectedSlug = useApp((s) => s.selectedSlug);
  const selectProject = useApp((s) => s.selectProject);
  const showArchived = useApp((s) => s.showArchived);
  const setShowArchived = useApp((s) => s.setShowArchived);
  const deleteProject = useApp((s) => s.deleteProject);
  const revealReferences = useApp((s) => s.revealReferences);
  const refreshProjects = useApp((s) => s.refreshProjects);
  const attention = useApp((s) => s.attention);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (showArchived) return;
    let unlisten: (() => void) | undefined;
    let cancelled = false;
    getCurrentWindow()
      .onFocusChanged((ev) => {
        if (cancelled) return;
        if (ev.payload) refreshProjects();
      })
      .then((un) => {
        if (cancelled) un();
        else unlisten = un;
      });
    return () => {
      cancelled = true;
      unlisten?.();
    };
  }, [showArchived, refreshProjects]);

  async function remove(p: ProjectSummary, e: React.MouseEvent) {
    e.stopPropagation();
    const ok = await ask(
      `把「${p.name}」移入回收站？\n之后可以从 macOS 废纸篓恢复。`,
      { title: "移入回收站", kind: "warning", okLabel: "移入回收站", cancelLabel: "取消" }
    );
    if (!ok) return;
    await deleteProject(p.path);
  }

  async function openRefs(p: ProjectSummary, e: React.MouseEvent) {
    e.stopPropagation();
    await revealReferences(p.path);
  }

  if (collapsed) {
    return (
      <aside className="flex h-full w-10 flex-col items-center gap-2 border-r border-white/60 bg-white/55 py-2 backdrop-blur-xl">
        <button
          onClick={onToggleCollapse}
          title="展开任务列表"
          className="flex h-7 w-7 items-center justify-center rounded-md border border-white/60 bg-white/70 text-gray-600 transition hover:bg-white hover:text-gray-900"
        >
          <ChevronsRight size={14} />
        </button>
        <ThemeToggle />
      </aside>
    );
  }

  return (
    <aside
      className="flex h-full w-72 flex-col border-r border-white/60 bg-white/55 backdrop-blur-xl"
    >
      <div className="flex items-center justify-between border-b border-white/60 px-4 py-3">
        <h2 className="text-sm font-semibold text-gray-700">
          {showArchived ? "已归档" : "工作任务"}
        </h2>
        <div className="flex items-center gap-1.5">
          <button
            onClick={onToggleCollapse}
            title="折叠任务列表（右侧详情最大化）"
            className="flex h-7 w-7 items-center justify-center rounded-md border border-white/60 bg-white/70 text-gray-600 transition hover:bg-white hover:text-gray-900"
          >
            <ChevronsLeft size={14} />
          </button>
          <ThemeToggle />
          <button
            onClick={onOpenSettings}
            title="我的记忆"
            className="flex h-7 w-7 items-center justify-center rounded-md border border-white/60 bg-white/70 text-gray-600 transition hover:bg-white hover:text-gray-900"
          >
            <Brain size={14} />
          </button>
          <button
            onClick={onOpenPreferences}
            title="设置"
            className="flex h-7 w-7 items-center justify-center rounded-md border border-white/60 bg-white/70 text-gray-600 transition hover:bg-white hover:text-gray-900"
          >
            <Settings size={14} />
          </button>
          {!showArchived && (
            <button
              onClick={() => setCreating((v) => !v)}
              className="rounded-md bg-accent/90 px-2 py-1 text-xs font-medium text-on-accent shadow-sm shadow-accent/20 transition hover:bg-accent"
            >
              {creating ? "取消" : "+ 新建"}
            </button>
          )}
        </div>
      </div>
      <div className="flex border-b border-white/60 text-[11px]">
        <button
          onClick={() => setShowArchived(false)}
          className={`flex-1 py-1.5 transition ${
            !showArchived
              ? "bg-white/60 font-medium text-gray-800"
              : "text-gray-500 hover:bg-white/30"
          }`}
        >
          活动
        </button>
        <button
          onClick={() => setShowArchived(true)}
          className={`flex-1 py-1.5 transition ${
            showArchived
              ? "bg-white/60 font-medium text-gray-800"
              : "text-gray-500 hover:bg-white/30"
          }`}
        >
          归档
        </button>
      </div>
      {creating && !showArchived && (
        <NewTaskForm onCancel={() => setCreating(false)} />
      )}
      <div className="flex-1 overflow-y-auto">
        {items.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-gray-400">
            {showArchived
              ? "还没有归档的任务"
              : "还没有任务，点击右上角 + 新建一个"}
          </p>
        )}
        {items.map((p) => {
          const active = selectedSlug === p.slug;
          const attn = !!attention[p.slug];
          return (
          <div
            key={p.slug}
            onClick={() => selectProject(p.slug)}
            className={`group relative block w-full cursor-pointer border-b border-white/60 border-l-4 ${leftBorderColor(
              p
            )} px-4 py-3 text-left transition ${
              active
                ? "bg-accent-soft/90 shadow-inner ring-1 ring-inset ring-accent-border/70"
                : "hover:bg-white/50"
            }`}
          >
            <div className={`truncate pr-12 text-sm font-medium ${active ? "text-accent-text" : "text-gray-800"}`}>
              {p.name}
            </div>
            {p.next_run_at && (
              <div className="mt-0.5 truncate pr-12 text-[11px] text-accent/80">
                下次：{formatNext(p.next_run_at)}
              </div>
            )}
            <div className="mt-1 flex items-center justify-between gap-2 pr-12">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-gray-400">
                  创建于 {new Date(p.created_at).toLocaleDateString()}
                </span>
              </div>
              {p.requires_references && (
                <button
                  onClick={(e) => openRefs(p, e)}
                  title={
                    p.has_references
                      ? "参考资料已就绪，点击打开 references/"
                      : "需要放入参考资料，点击打开 references/"
                  }
                  className={`flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] transition ${
                    p.has_references
                      ? "bg-amber-100/70 text-amber-700 hover:bg-amber-100"
                      : "bg-white/60 text-gray-500 hover:bg-white/90 hover:text-gray-700"
                  }`}
                >
                  {p.has_references ? (
                    <FolderOpen size={12} />
                  ) : (
                    <Folder size={12} />
                  )}
                  <span>{p.has_references ? "查看参考" : "添加参考"}</span>
                </button>
              )}
            </div>
            {!showArchived && (
              <span
                title={`${taskTypeBadgeTitle(p.task_type)} · ${executionStateTitle(p, attn)}`}
                className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded border border-white/70 bg-white/80 backdrop-blur"
              >
                {taskTypeBadgeIcon(p.task_type, p.archived, executionIconClass(p, attn))}
              </span>
            )}
            {!showArchived && (
              <button
                onClick={(e) => remove(p, e)}
                title="移入回收站"
                className="absolute right-9 top-2 rounded-md p-1 text-gray-400 opacity-0 transition hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
          );
        })}
      </div>
    </aside>
  );
}

export default function App() {
  const config = useApp((s) => s.config);
  const projects = useApp((s) => s.projects);
  const archived = useApp((s) => s.archived);
  const showArchived = useApp((s) => s.showArchived);
  const selectedSlug = useApp((s) => s.selectedSlug);
  const loadConfig = useApp((s) => s.loadConfig);
  const refreshProjects = useApp((s) => s.refreshProjects);
  const loadBackend = useApp((s) => s.loadBackend);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [prefsOpen, setPrefsOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [detailCollapsed, setDetailCollapsed] = useState(false);
  const prevWinSize = useRef<{ w: number; h: number } | null>(null);

  // 折叠右侧详情时把窗口缩到「列表 + 右缘窄条」宽度，展开时恢复原尺寸。
  // tauri.conf.json 有 minWidth 900，需先放宽最小尺寸，恢复时再设回。
  useEffect(() => {
    const win = getCurrentWindow();
    let cancelled = false;
    async function apply() {
      if (detailCollapsed) {
        const [size, scale] = await Promise.all([
          win.innerSize(),
          win.scaleFactor(),
        ]);
        if (cancelled) return;
        if (!prevWinSize.current) {
          prevWinSize.current = { w: size.width / scale, h: size.height / scale };
        }
        const w = (sidebarCollapsed ? 40 : 288) + 40;
        await win.setMinSize(new LogicalSize(w, 400));
        await win.setSize(new LogicalSize(w, prevWinSize.current.h));
      } else if (prevWinSize.current) {
        const { w, h } = prevWinSize.current;
        prevWinSize.current = null;
        await win.setSize(new LogicalSize(w, h));
        await win.setMinSize(new LogicalSize(900, 600));
      }
    }
    apply().catch((e) => console.error("resize window failed:", e));
    return () => {
      cancelled = true;
    };
  }, [detailCollapsed, sidebarCollapsed]);

  useEffect(() => {
    initTheme();
    loadConfig();
    loadBackend();
  }, [loadConfig, loadBackend]);

  useEffect(() => {
    let unlisteners: Array<() => void> = [];
    let cancelled = false;
    const add = (p: Promise<() => void>) =>
      p.then((un) => {
        if (cancelled) un();
        else unlisteners.push(un);
      });
    add(listen("task-triggered", () => refreshProjects()));
    add(listen("task-completed", () => refreshProjects()));
    return () => {
      cancelled = true;
      unlisteners.forEach((un) => un());
    };
  }, [refreshProjects]);

  if (!config) {
    return <div className="h-full" />;
  }
  if (!config.workspace) {
    return <WorkspacePicker />;
  }

  const items = showArchived ? archived : projects;
  const selected = items.find((p) => p.slug === selectedSlug) ?? null;

  return (
    <div className="flex h-full">
      <ProjectList
        items={items}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenPreferences={() => setPrefsOpen(true)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
      />
      {/* 详情折叠时不卸载（保留编辑中状态与自动保存定时器），仅隐藏 */}
      <div className={`flex flex-1 ${detailCollapsed ? "hidden" : ""}`}>
        <ProjectDetail
          project={selected}
          onCollapse={() => setDetailCollapsed(true)}
        />
      </div>
      {detailCollapsed && (
        <aside className="flex h-full w-10 flex-col items-center gap-2 border-l border-white/60 bg-white/55 py-2 backdrop-blur-xl">
          <button
            onClick={() => setDetailCollapsed(false)}
            title="展开任务详情"
            className="flex h-7 w-7 items-center justify-center rounded-md border border-white/60 bg-white/70 text-gray-600 transition hover:bg-white hover:text-gray-900"
          >
            <ChevronsLeft size={14} />
          </button>
        </aside>
      )}
      {settingsOpen && <SettingsPanel onClose={() => setSettingsOpen(false)} />}
      {prefsOpen && <PreferencesPanel onClose={() => setPrefsOpen(false)} />}
    </div>
  );
}
