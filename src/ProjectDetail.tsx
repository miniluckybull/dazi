import { useEffect, useRef, useState } from "react";
import MDEditor from "@uiw/react-md-editor";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { ask } from "@tauri-apps/plugin-dialog";
import {
  FolderOpen,
  Terminal,
  Rocket,
  Copy,
  Archive,
  Eye,
  Pencil,
} from "lucide-react";
import { ProjectSummary, useApp } from "./store";

function IconButton({
  title,
  onClick,
  disabled,
  emphasis,
  children,
}: {
  title: string;
  onClick: () => void;
  disabled?: boolean;
  emphasis?: boolean;
  children: React.ReactNode;
}) {
  const base =
    "flex h-8 w-8 items-center justify-center rounded-md border transition";
  const cls = disabled
    ? `${base} cursor-not-allowed border-gray-200 bg-gray-50 text-gray-300`
    : emphasis
      ? `${base} border-amber-700 bg-amber-700 text-white hover:bg-amber-600`
      : `${base} border-gray-300 bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900`;
  return (
    <button title={title} onClick={onClick} disabled={disabled} className={cls}>
      {children}
    </button>
  );
}

export function ProjectDetail({ project }: { project: ProjectSummary | null }) {
  const readReadme = useApp((s) => s.readReadme);
  const writeReadme = useApp((s) => s.writeReadme);
  const importReferences = useApp((s) => s.importReferences);
  const revealInFinder = useApp((s) => s.revealInFinder);
  const openTerminal = useApp((s) => s.openTerminal);
  const handOffToClaude = useApp((s) => s.handOffToClaude);
  const archiveProject = useApp((s) => s.archiveProject);
  const refreshProjects = useApp((s) => s.refreshProjects);

  const [readme, setReadme] = useState<string>("");
  const [savingReadme, setSavingReadme] = useState(false);
  const [readmeDirty, setReadmeDirty] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [importing, setImporting] = useState(false);
  const [previewOnly, setPreviewOnly] = useState(false);
  const [pathHint, setPathHint] = useState<string | null>(null);
  const lastLoadedSlug = useRef<string | null>(null);
  const saveTimer = useRef<number | null>(null);

  const claudeBlocked =
    project?.requires_references && !project.has_references
      ? "此任务需要先放入参考资料后再启动 dazi"
      : null;

  async function copyPath() {
    if (!project) return;
    try {
      await navigator.clipboard.writeText(project.path);
      setPathHint("已复制路径");
    } catch {
      setPathHint("复制失败");
    }
    window.setTimeout(() => setPathHint(null), 1500);
  }

  async function archive() {
    if (!project) return;
    const ok = await ask(
      `归档「${project.name}」？\n会生成 summary.md 并移动到 archive/ 目录。`,
      { title: "归档任务", kind: "warning" }
    );
    if (!ok) return;
    await archiveProject(project.path);
  }

  async function callClaude() {
    if (!project || claudeBlocked) return;
    const ok = await ask(
      `确认参考资料已经放入完整？\n启动后 Claude 会基于 README.md 与 references/ 中的资料推进任务。`,
      { title: "启动 dazi", kind: "info" }
    );
    if (!ok) return;
    await handOffToClaude(project.path);
  }

  useEffect(() => {
    if (!project) {
      setReadme("");
      lastLoadedSlug.current = null;
      return;
    }
    if (lastLoadedSlug.current === project.slug) return;
    lastLoadedSlug.current = project.slug;
    setReadmeDirty(false);
    readReadme(project.path)
      .then((r) => setReadme(r))
      .catch(() => {});
  }, [project, readReadme]);

  useEffect(() => {
    if (!project || !readmeDirty) return;
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(async () => {
      setSavingReadme(true);
      try {
        await writeReadme(project.path, readme);
        setReadmeDirty(false);
      } finally {
        setSavingReadme(false);
      }
    }, 800);
    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
  }, [readme, project, readmeDirty, writeReadme]);

  useEffect(() => {
    if (!project) return;
    let unlisten: (() => void) | undefined;
    let cancelled = false;
    getCurrentWindow()
      .onDragDropEvent(async (event) => {
        if (cancelled) return;
        const payload: any = event.payload;
        if (payload.type === "over" || payload.type === "enter") {
          setDragOver(true);
        } else if (payload.type === "leave") {
          setDragOver(false);
        } else if (payload.type === "drop") {
          setDragOver(false);
          const paths: string[] = payload.paths ?? [];
          if (paths.length === 0) return;
          setImporting(true);
          try {
            await importReferences(project.path, paths);
            await refreshProjects();
          } finally {
            setImporting(false);
          }
        }
      })
      .then((un) => {
        if (cancelled) un();
        else unlisten = un;
      });
    return () => {
      cancelled = true;
      unlisten?.();
    };
  }, [project, importReferences, refreshProjects]);

  if (!project) {
    return (
      <main className="flex flex-1 items-center justify-center text-sm text-gray-400">
        从左侧选择一个任务，或新建一个任务
      </main>
    );
  }

  return (
    <main className="relative flex flex-1 flex-col overflow-hidden">
      <header className="border-b border-gray-200 bg-white px-6 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-semibold text-gray-900">
              {project.name}
            </h1>
            <p
              className="mt-0.5 truncate text-xs text-gray-500"
              title={project.path}
            >
              {pathHint ?? project.path}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <span className="mr-1 text-[11px] text-gray-400">
              {savingReadme
                ? "保存中…"
                : readmeDirty
                  ? "未保存"
                  : "已保存"}
            </span>
            {importing && (
              <span className="mr-1 text-[11px] text-gray-400">
                导入中…
              </span>
            )}
            <IconButton
              title={previewOnly ? "切回编辑" : "预览"}
              onClick={() => setPreviewOnly((v) => !v)}
            >
              {previewOnly ? <Pencil size={15} /> : <Eye size={15} />}
            </IconButton>
            <IconButton
              title="在 Finder 中显示"
              onClick={() => revealInFinder(project.path)}
            >
              <FolderOpen size={15} />
            </IconButton>
            <IconButton
              title="打开终端"
              onClick={() => openTerminal(project.path)}
            >
              <Terminal size={15} />
            </IconButton>
            <IconButton title="复制路径" onClick={copyPath}>
              <Copy size={15} />
            </IconButton>
            <IconButton title="归档" onClick={archive}>
              <Archive size={15} />
            </IconButton>
            <IconButton
              title={claudeBlocked ?? "启动 dazi"}
              onClick={callClaude}
              disabled={!!claudeBlocked}
              emphasis
            >
              <Rocket size={15} />
            </IconButton>
          </div>
        </div>
      </header>
      <div className="flex flex-1 overflow-hidden">
        <section className="flex-1 overflow-y-auto bg-white">
          <div data-color-mode="light" className="h-full">
            <MDEditor
              value={readme}
              onChange={(v) => {
                setReadme(v ?? "");
                setReadmeDirty(true);
              }}
              height="100%"
              preview={previewOnly ? "preview" : "edit"}
              hideToolbar={previewOnly}
              visibleDragbar={false}
            />
          </div>
        </section>
      </div>
      {dragOver && (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-blue-500/10 backdrop-blur-[1px]">
          <div className="rounded-lg border-2 border-dashed border-blue-500 bg-white/90 px-6 py-4 text-sm font-medium text-blue-700">
            松开以将文件复制到 references/
          </div>
        </div>
      )}
    </main>
  );
}
