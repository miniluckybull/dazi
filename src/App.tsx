import { useEffect, useState } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { Trash2, Folder, FolderOpen } from "lucide-react";
import { useApp, ProjectSummary, ProjectInit } from "./store";
import { ProjectDetail } from "./ProjectDetail";
import "./App.css";

function leftBorderColor(p: ProjectSummary): string {
  if (p.archived) return "border-l-green-300";
  if (p.handed_off_at) return "border-l-amber-600";
  return "border-l-sky-300";
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
    <div className="flex h-full items-center justify-center">
      <div className="max-w-md text-center">
        <h1 className="mb-2 text-2xl font-semibold">欢迎使用 Dazi</h1>
        <p className="mb-6 text-sm text-gray-500">
          选择一个文件夹作为工作区，所有任务都会以子目录形式保存在其中。
          建议放在 iCloud Drive 中以便多设备同步。
        </p>
        <button
          onClick={pick}
          className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
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
      className="space-y-2 border-b border-gray-200 bg-gray-50 p-3 text-xs"
    >
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="任务名称"
        className="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-sm outline-none focus:border-gray-500"
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
          className="flex-1 rounded bg-gray-900 py-1.5 text-xs font-medium text-white hover:bg-gray-700"
        >
          创建
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded border border-gray-300 px-3 py-1.5 text-xs text-gray-700 hover:bg-white"
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
    const ok = window.confirm(
      `把「${p.name}」移入回收站？\n之后可以从 macOS 废纸篓恢复。`
    );
    if (!ok) return;
    await deleteProject(p.path);
  }

  async function openRefs(p: ProjectSummary, e: React.MouseEvent) {
    e.stopPropagation();
    await revealReferences(p.path);
  }

  return (
    <aside className="flex h-full w-72 flex-col border-r border-gray-200 bg-white">
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
        <h2 className="text-sm font-semibold text-gray-700">
          {showArchived ? "已归档" : "工作任务"}
        </h2>
        {!showArchived && (
          <button
            onClick={() => setCreating((v) => !v)}
            className="rounded bg-gray-900 px-2 py-1 text-xs font-medium text-white hover:bg-gray-700"
          >
            {creating ? "取消" : "+ 新建"}
          </button>
        )}
      </div>
      <div className="flex border-b border-gray-200 text-[11px]">
        <button
          onClick={() => setShowArchived(false)}
          className={`flex-1 py-1.5 ${
            !showArchived
              ? "bg-gray-100 font-medium text-gray-800"
              : "text-gray-500 hover:bg-gray-50"
          }`}
        >
          活动
        </button>
        <button
          onClick={() => setShowArchived(true)}
          className={`flex-1 py-1.5 ${
            showArchived
              ? "bg-gray-100 font-medium text-gray-800"
              : "text-gray-500 hover:bg-gray-50"
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
        {items.map((p) => (
          <div
            key={p.slug}
            onClick={() => selectProject(p.slug)}
            className={`group relative block w-full cursor-pointer border-b border-gray-100 border-l-4 ${leftBorderColor(
              p
            )} px-4 py-3 text-left transition ${
              selectedSlug === p.slug ? "bg-blue-50" : "hover:bg-gray-50"
            }`}
          >
            <div className="flex items-center gap-1.5 pr-7">
              <div className="min-w-0 flex-1 truncate text-sm font-medium text-gray-800">
                {p.name}
              </div>
              {p.requires_references && (
                <button
                  onClick={(e) => openRefs(p, e)}
                  title={
                    p.has_references
                      ? "参考资料已就绪，点击打开 references/"
                      : "需要放入参考资料，点击打开 references/"
                  }
                  className={`flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 text-[10px] transition ${
                    p.has_references
                      ? "bg-amber-50 text-amber-700 hover:bg-amber-100"
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700"
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
            <div className="mt-1 text-[11px] text-gray-400">
              创建于 {new Date(p.created_at).toLocaleDateString()}
            </div>
            {!showArchived && (
              <button
                onClick={(e) => remove(p, e)}
                title="移入回收站"
                className="absolute right-2 top-2 rounded p-1 text-gray-400 opacity-0 hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
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

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

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
