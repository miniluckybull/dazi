import { useEffect, useRef, useState } from "react";
import MDEditor from "@uiw/react-md-editor";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { ask } from "@tauri-apps/plugin-dialog";
import {
  FolderOpen,
  Rocket,
  Archive,
  Eye,
  Pencil,
  Brain,
  ArchiveRestore,
  Sparkles,
  RotateCw,
} from "lucide-react";
import { ProjectSummary, useApp } from "./store";
import { ScheduleEditor } from "./ScheduleEditor";
import { MemoryPanel } from "./MemoryPanel";

function MemoryBadge({
  layers,
}: {
  layers: { profile: boolean; patterns: boolean; project: boolean };
}) {
  const count =
    (layers.profile ? 1 : 0) + (layers.patterns ? 1 : 0) + (layers.project ? 1 : 0);
  if (count === 0) {
    return (
      <span
        title="启动 dazi 时没有可注入的记忆。先在「我的记忆」补充画像，或完成一次会话生成项目记忆。"
        className="flex items-center gap-1 rounded-md border border-white/60 bg-white/60 px-2 py-1 text-[10px] text-gray-400"
      >
        <Brain size={11} />
        无记忆
      </span>
    );
  }
  const tip = [
    layers.profile ? "用户画像 ✓" : "用户画像 —",
    layers.patterns ? "跨项目模式 ✓" : "跨项目模式 —",
    layers.project ? "本项目记忆 ✓" : "本项目记忆 —",
  ].join("\n");
  return (
    <span
      title={`启动 dazi 时会注入：\n${tip}`}
      className="flex items-center gap-1 rounded-md border border-indigo-300/70 bg-indigo-50/80 px-2 py-1 text-[10px] font-medium text-indigo-700"
    >
      <Brain size={11} />
      记忆 {count}/3
    </span>
  );
}

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
    ? `${base} cursor-not-allowed border-white/40 bg-white/30 text-gray-300`
    : emphasis
      ? `${base} border-indigo-500/70 bg-indigo-600/90 text-white shadow-sm shadow-indigo-500/30 hover:bg-indigo-600`
      : `${base} border-white/60 bg-white/70 text-gray-600 backdrop-blur hover:bg-white hover:text-gray-900`;
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
  const handOffToClaude = useApp((s) => s.handOffToClaude);
  const continueWithClaude = useApp((s) => s.continueWithClaude);
  const archiveProject = useApp((s) => s.archiveProject);
  const unarchiveProject = useApp((s) => s.unarchiveProject);
  const extractSkill = useApp((s) => s.extractSkill);
  const refreshProjects = useApp((s) => s.refreshProjects);
  const readProfile = useApp((s) => s.readProfile);
  const readPatterns = useApp((s) => s.readPatterns);
  const readProjectJournal = useApp((s) => s.readProjectJournal);
  const readProjectContext = useApp((s) => s.readProjectContext);

  const [readme, setReadme] = useState<string>("");
  const [savingReadme, setSavingReadme] = useState(false);
  const [readmeDirty, setReadmeDirty] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [importing, setImporting] = useState(false);
  const [previewOnly, setPreviewOnly] = useState(false);
  const [tab, setTab] = useState<"readme" | "memory">("readme");
  const [memoryLayers, setMemoryLayers] = useState({
    profile: false,
    patterns: false,
    project: false,
  });
  const lastLoadedSlug = useRef<string | null>(null);
  const saveTimer = useRef<number | null>(null);

  const claudeBlocked =
    project?.requires_references && !project.has_references
      ? "此任务需要先放入参考资料后再启动 dazi"
      : null;

  async function archive() {
    if (!project) return;
    const ok = await ask(
      `归档「${project.name}」？\n会生成 summary.md 并移动到 archive/ 目录。`,
      { title: "归档任务", kind: "warning" }
    );
    if (!ok) return;
    await archiveProject(project.path);
  }

  async function unarchive() {
    if (!project) return;
    const ok = await ask(
      `把「${project.name}」恢复到活动区？\n任务会从 archive/ 移回 projects/。`,
      { title: "回到活动区", kind: "info" }
    );
    if (!ok) return;
    await unarchiveProject(project.path);
  }

  async function callExtractSkill() {
    if (!project) return;
    const ok = await ask(
      `把这次任务提炼为 Claude Code skill？\n会启动一个 Claude 会话，写入 ~/.claude/skills/${project.slug}/SKILL.md。`,
      { title: "提炼为 skill", kind: "info" }
    );
    if (!ok) return;
    await extractSkill(project.path);
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
    if (!project) {
      setMemoryLayers({ profile: false, patterns: false, project: false });
      return;
    }
    let cancelled = false;
    Promise.all([
      readProfile().catch(() => ""),
      readPatterns().catch(() => ""),
      readProjectContext(project.path).catch(() => ""),
      readProjectJournal(project.path).catch(() => ""),
    ]).then(([p, pa, ctx, j]) => {
      if (cancelled) return;
      setMemoryLayers({
        profile: p.trim().length > 0,
        patterns: pa.trim().length > 0,
        project: ctx.trim().length > 0 || j.trim().length > 0,
      });
    });
    return () => {
      cancelled = true;
    };
  }, [project, readProfile, readPatterns, readProjectContext, readProjectJournal]);

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
      <header className="border-b border-white/60 bg-white/55 px-6 py-3 backdrop-blur-xl">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-semibold text-gray-900">
              {project.name}
            </h1>
            <p
              className="mt-0.5 truncate text-xs text-gray-500"
              title={project.path}
            >
              {project.path}
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
            <MemoryBadge layers={memoryLayers} />
            {project.archived ? (
              <>
                <IconButton title="回到活动区" onClick={unarchive}>
                  <ArchiveRestore size={15} />
                </IconButton>
                <IconButton title="提炼为 skill" onClick={callExtractSkill} emphasis>
                  <Sparkles size={15} />
                </IconButton>
              </>
            ) : (
              <>
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
                <IconButton title="归档" onClick={archive}>
                  <Archive size={15} />
                </IconButton>
                <IconButton
                  title={
                    project.handed_off_at
                      ? "继续上次会话（不重新注入 prompt）"
                      : "尚未启动过 dazi"
                  }
                  onClick={() => continueWithClaude(project.path)}
                  disabled={!project.handed_off_at}
                >
                  <RotateCw size={15} />
                </IconButton>
                <IconButton
                  title={claudeBlocked ?? "启动 dazi"}
                  onClick={callClaude}
                  disabled={!!claudeBlocked}
                  emphasis
                >
                  <Rocket size={15} />
                </IconButton>
              </>
            )}
          </div>
        </div>
      </header>
      <ScheduleEditor project={project} />
      <div className="flex border-b border-white/60 bg-white/45 px-4 text-xs backdrop-blur">
        <button
          onClick={() => setTab("readme")}
          className={`relative -mb-px border-b-2 px-3 py-1.5 transition ${
            tab === "readme"
              ? "border-indigo-500 font-medium text-gray-800"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          README
        </button>
        <button
          onClick={() => setTab("memory")}
          className={`relative -mb-px border-b-2 px-3 py-1.5 transition ${
            tab === "memory"
              ? "border-indigo-500 font-medium text-gray-800"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          协作记忆
        </button>
      </div>
      <div className="flex flex-1 overflow-hidden">
        {tab === "readme" ? (
          <section className="flex-1 overflow-y-auto bg-white/70 backdrop-blur-sm">
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
                extraCommands={[]}
              />
            </div>
          </section>
        ) : (
          <section className="flex-1 overflow-hidden">
            <MemoryPanel project={project} />
          </section>
        )}
      </div>
      {dragOver && (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-indigo-500/10 backdrop-blur-[2px]">
          <div className="rounded-xl border-2 border-dashed border-indigo-400 bg-white/85 px-6 py-4 text-sm font-medium text-indigo-700 shadow-glass-lg">
            松开以将文件复制到 references/
          </div>
        </div>
      )}
    </main>
  );
}
