import { useEffect, useMemo, useState } from "react";
import { open, ask } from "@tauri-apps/plugin-dialog";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { listen } from "@tauri-apps/api/event";
import { Trash2, Folder, FolderOpen, Clock, Repeat } from "lucide-react";
import { useApp, ProjectSummary, ProjectInit } from "./store";
import { ProjectDetail } from "./ProjectDetail";
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

function isToday(iso: string): boolean {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return false;
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const end = start + 24 * 3600 * 1000;
  const t = d.getTime();
  return t < end; // 包含逾期未触发的
}

function leftBorderColor(p: ProjectSummary): string {
  if (p.archived) return "border-l-emerald-300/80";
  if (p.handed_off_at) return "border-l-amber-400/90";
  return "border-l-sky-400/80";
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
      <div className="max-w-md rounded-2xl border border-white/50 bg-white/55 px-8 py-10 text-center shadow-glass-lg backdrop-blur-xl">
        <h1 className="mb-2 text-2xl font-semibold text-gray-900">欢迎使用 Dazi</h1>
        <p className="mb-6 text-sm text-gray-600">
          选择一个文件夹作为工作区，所有任务都会以子目录形式保存在其中。
          建议放在 iCloud Drive 中以便多设备同步。
        </p>
        <button
          onClick={pick}
          className="rounded-lg bg-indigo-600/90 px-4 py-2 text-sm font-medium text-white shadow-md shadow-indigo-500/20 transition hover:bg-indigo-600"
        >
          选择工作区文件夹
        </button>
        {error && <p className="mt-4 text-sm text-red-500">{error}</p>}
      </div>
    </div>
  );
}

function NewTaskForm({ onCancel }: { onCancel: () => void }) {
  const createProject = useApp((s) => s.createProject);
  const [name, setName] = useState("");
  const [requiresRefs, setRequiresRefs] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const init: ProjectInit = {
      requires_references: requiresRefs,
    };
    await createProject(name.trim(), init);
    onCancel();
  }

  return (
    <form
      onSubmit={submit}
      className="space-y-2 border-b border-white/40 bg-white/40 p-3 text-xs backdrop-blur"
    >
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="任务名称"
        className="w-full rounded-md border border-white/60 bg-white/80 px-2 py-1.5 text-sm outline-none transition focus:border-indigo-300 focus:bg-white"
      />
      <label className="flex items-center gap-2 text-gray-700">
        <input
          type="checkbox"
          checked={requiresRefs}
          onChange={(e) => setRequiresRefs(e.target.checked)}
        />
        <span>需要参考资料才能启动 dazi</span>
      </label>
      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          className="flex-1 rounded-md bg-indigo-600/90 py-1.5 text-xs font-medium text-white shadow-sm shadow-indigo-500/20 transition hover:bg-indigo-600"
        >
          创建
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-white/60 bg-white/70 px-3 py-1.5 text-xs text-gray-700 transition hover:bg-white"
        >
          取消
        </button>
      </div>
    </form>
  );
}

function ProjectList({ items }: { items: ProjectSummary[] }) {
  const selectedSlug = useApp((s) => s.selectedSlug);
  const selectProject = useApp((s) => s.selectProject);
  const showArchived = useApp((s) => s.showArchived);
  const setShowArchived = useApp((s) => s.setShowArchived);
  const deleteProject = useApp((s) => s.deleteProject);
  const revealReferences = useApp((s) => s.revealReferences);
  const refreshProjects = useApp((s) => s.refreshProjects);
  const [creating, setCreating] = useState(false);
  const [todayOnly, setTodayOnly] = useState(false);

  const filtered = useMemo(() => {
    if (!todayOnly || showArchived) return items;
    return items.filter((p) => p.next_run_at && isToday(p.next_run_at));
  }, [items, todayOnly, showArchived]);
  const todayCount = useMemo(
    () =>
      showArchived
        ? 0
        : items.filter((p) => p.next_run_at && isToday(p.next_run_at)).length,
    [items, showArchived]
  );

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

  return (
    <aside className="flex h-full w-72 flex-col border-r border-white/40 bg-white/55 backdrop-blur-xl">
      <div className="flex items-center justify-between border-b border-white/40 px-4 py-3">
        <h2 className="text-sm font-semibold text-gray-700">
          {showArchived ? "已归档" : "工作任务"}
        </h2>
        {!showArchived && (
          <button
            onClick={() => setCreating((v) => !v)}
            className="rounded-md bg-indigo-600/90 px-2 py-1 text-xs font-medium text-white shadow-sm shadow-indigo-500/20 transition hover:bg-indigo-600"
          >
            {creating ? "取消" : "+ 新建"}
          </button>
        )}
      </div>
      <div className="flex border-b border-white/40 text-[11px]">
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
      {!showArchived && (
        <div className="flex items-center justify-between border-b border-white/40 px-4 py-1.5 text-[11px]">
          <button
            onClick={() => setTodayOnly((v) => !v)}
            className={`rounded-md px-2 py-0.5 transition ${
              todayOnly
                ? "bg-indigo-600/90 text-white"
                : "bg-white/60 text-gray-600 hover:bg-white"
            }`}
          >
            今日待办{todayCount > 0 ? ` · ${todayCount}` : ""}
          </button>
        </div>
      )}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-gray-400">
            {showArchived
              ? "还没有归档的任务"
              : todayOnly
                ? "今天没有待办的定时/循环任务"
                : "还没有任务，点击右上角 + 新建一个"}
          </p>
        )}
        {filtered.map((p) => (
          <div
            key={p.slug}
            onClick={() => selectProject(p.slug)}
            className={`group relative block w-full cursor-pointer border-b border-white/40 border-l-4 ${leftBorderColor(
              p
            )} px-4 py-3 text-left transition ${
              selectedSlug === p.slug
                ? "bg-indigo-50/70 shadow-sm"
                : "hover:bg-white/50"
            }`}
          >
            <div className="flex items-center gap-1.5 truncate pr-7 text-sm font-medium text-gray-800">
              {p.task_type === "scheduled" && (
                <Clock size={12} className="shrink-0 text-sky-600" />
              )}
              {p.task_type === "recurring" && (
                <Repeat size={12} className="shrink-0 text-emerald-600" />
              )}
              <span className="truncate">{p.name}</span>
            </div>
            {p.next_run_at && (
              <div className="mt-0.5 truncate pr-7 text-[11px] text-indigo-500">
                下次：{formatNext(p.next_run_at)}
              </div>
            )}
            <div className="mt-1 flex items-center justify-between gap-2 pr-7">
              <span className="text-[11px] text-gray-400">
                创建于 {new Date(p.created_at).toLocaleDateString()}
              </span>
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
              <button
                onClick={(e) => remove(p, e)}
                title="移入回收站"
                className="absolute right-2 top-2 rounded-md p-1 text-gray-400 opacity-0 transition hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        ))}
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

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  useEffect(() => {
    let unlisten: (() => void) | undefined;
    let cancelled = false;
    listen("task-triggered", () => {
      refreshProjects();
    }).then((un) => {
      if (cancelled) un();
      else unlisten = un;
    });
    return () => {
      cancelled = true;
      unlisten?.();
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
      <ProjectList items={items} />
      <ProjectDetail project={selected} />
    </div>
  );
}
