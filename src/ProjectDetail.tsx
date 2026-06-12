import { useEffect, useRef, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { ask } from "@tauri-apps/plugin-dialog";
import {
  FolderOpen,
  Archive,
  Brain,
  ArchiveRestore,
  Sparkles,
  Send,
  Zap,
  Clock,
  Repeat,
  ChevronDown,
  Bot,
  SquareTerminal,
} from "lucide-react";
import { ProjectSummary, TaskType, useApp } from "./store";
import { ScheduleConfigModal } from "./ScheduleEditor";
import { MemoryPanel } from "./MemoryPanel";
import { ActivityPanel } from "./ActivityPanel";
import { MarkdownEditor } from "./MarkdownEditor";
import { TerminalView } from "./terminal/TerminalView";
import { requestLaunch } from "./terminal/manager";
import { invoke } from "@tauri-apps/api/core";

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
      className="flex items-center gap-1 rounded-md border border-accent-border/70 bg-accent-soft/80 px-2 py-1 text-[10px] font-medium text-accent-text"
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
  tone,
  children,
}: {
  title: string;
  onClick: () => void;
  disabled?: boolean;
  emphasis?: boolean;
  tone?: "blue" | "orange";
  children: React.ReactNode;
}) {
  const base =
    "flex h-8 w-8 items-center justify-center rounded-md border transition";
  let cls: string;
  if (disabled) {
    cls = `${base} cursor-not-allowed border-white/40 bg-white/30 text-gray-300`;
  } else if (tone === "orange") {
    cls = `${base} border-amber-500/70 bg-amber-500/90 text-on-accent shadow-sm shadow-amber-500/30 hover:bg-amber-500`;
  } else if (tone === "blue") {
    cls = `${base} border-sky-500/70 bg-sky-600/90 text-on-accent shadow-sm shadow-sky-500/30 hover:bg-sky-600`;
  } else if (emphasis) {
    cls = `${base} border-accent/70 bg-accent/90 text-on-accent shadow-sm shadow-accent/30 hover:bg-accent`;
  } else {
    cls = `${base} border-white/60 bg-white/70 text-gray-600 backdrop-blur hover:bg-white hover:text-gray-900`;
  }
  return (
    <button title={title} onClick={onClick} disabled={disabled} className={cls}>
      {children}
    </button>
  );
}

function taskTypeIcon(t: TaskType) {
  if (t === "scheduled") return <Clock size={13} />;
  if (t === "recurring") return <Repeat size={13} />;
  return <Zap size={13} />;
}

function taskTypeLabel(t: TaskType) {
  if (t === "scheduled") return "定时";
  if (t === "recurring") return "循环";
  return "一次性";
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
  const runAutopilotNow = useApp((s) => s.runAutopilotNow);
  const refreshProjects = useApp((s) => s.refreshProjects);
  const readProfile = useApp((s) => s.readProfile);
  const readPatterns = useApp((s) => s.readPatterns);
  const readProjectJournal = useApp((s) => s.readProjectJournal);
  const readProjectContext = useApp((s) => s.readProjectContext);
  const attention = useApp((s) => (project ? !!s.attention[project.slug] : false));

  const [readme, setReadme] = useState<string>("");
  const [readmeLoadedSlug, setReadmeLoadedSlug] = useState<string | null>(null);
  const [savingReadme, setSavingReadme] = useState(false);
  const [readmeDirty, setReadmeDirty] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [importing, setImporting] = useState(false);
  const [tab, setTab] = useState<"readme" | "terminal" | "activity" | "memory">("readme");
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [autopiloting, setAutopiloting] = useState(false);
  const [memoryLayers, setMemoryLayers] = useState({
    profile: false,
    patterns: false,
    project: false,
  });
  const lastLoadedSlug = useRef<string | null>(null);
  const saveTimer = useRef<number | null>(null);

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
    if (!project) return;
    if (project.handed_off_at) {
      // 继续上次会话
      const mode = await invoke<string>("get_terminal_mode").catch(() => "embedded");
      if (mode === "external") {
        await continueWithClaude(project.path);
      } else {
        await requestLaunch(project.slug, project.path, "continue");
        setTab("terminal");
      }
      return;
    }
    const refsHint = project.has_references
      ? "已检测到 references/ 中的资料。"
      : project.requires_references
        ? "⚠ 此任务标记为「需要参考资料」，但 references/ 当前为空，启动后 Claude 可能信息不足。"
        : "references/ 当前为空，Claude 将仅基于 README.md 推进。";
    const ok = await ask(
      `启动 dazi 协作？\n${refsHint}\n启动后 Claude 会基于 README.md 与 references/ 中的资料推进任务。`,
      { title: "启动 dazi", kind: "info" }
    );
    if (!ok) return;
    const mode = await invoke<string>("get_terminal_mode").catch(() => "embedded");
    if (mode === "external") {
      await handOffToClaude(project.path);
    } else {
      await requestLaunch(project.slug, project.path, "handoff");
      setTab("terminal");
      await refreshProjects();
    }
  }

  async function callAutopilotNow() {
    if (!project || autopiloting) return;
    const ok = await ask(
      `立即自动执行一次？\nClaude 将以「跳过权限」模式无人值守运行，在项目目录内推进任务，结果写入 .dazi/journal.md。`,
      { title: "立即自动执行", kind: "warning" }
    );
    if (!ok) return;
    setAutopiloting(true);
    try {
      await runAutopilotNow(project.path);
    } finally {
      setAutopiloting(false);
    }
  }

  useEffect(() => {
    // 归档任务不显示终端 Tab，切到归档项目时回落 README
    if (project?.archived && tab === "terminal") setTab("readme");
  }, [project, tab]);

  useEffect(() => {
    if (!project) {
      setReadme("");
      setReadmeLoadedSlug(null);
      lastLoadedSlug.current = null;
      return;
    }
    if (lastLoadedSlug.current === project.slug) return;
    lastLoadedSlug.current = project.slug;
    setReadmeDirty(false);
    setReadmeLoadedSlug(null);
    readReadme(project.path)
      .then((r) => {
        setReadme(r);
        setReadmeLoadedSlug(project.slug);
      })
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

  const claudeTone = project.handed_off_at ? "orange" : "blue";
  const claudeTitle = project.handed_off_at
    ? "继续 claude 协作（不重新注入 prompt）"
    : "启动 claude 协作";

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
                <button
                  title={`任务类型：${taskTypeLabel(project.task_type)}（点击配置）`}
                  onClick={() => setScheduleOpen(true)}
                  className="flex h-8 items-center gap-1 rounded-md border border-white/60 bg-white/70 px-2 text-gray-600 backdrop-blur transition hover:bg-white hover:text-gray-900"
                >
                  {taskTypeIcon(project.task_type)}
                  <ChevronDown size={11} />
                </button>
                {project.task_type !== "oneoff" && (
                  <IconButton
                    title={autopiloting ? "自动执行中…" : "立即自动执行一次"}
                    onClick={callAutopilotNow}
                  >
                    <Bot
                      size={15}
                      className={autopiloting ? "animate-pulse text-amber-600" : ""}
                    />
                  </IconButton>
                )}
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
                  title={claudeTitle}
                  onClick={callClaude}
                  tone={claudeTone}
                >
                  <Send size={15} />
                </IconButton>
              </>
            )}
          </div>
        </div>
      </header>
      <div className="flex border-b border-white/60 bg-white/45 px-4 text-xs backdrop-blur">
        <button
          onClick={() => setTab("readme")}
          className={`relative -mb-px border-b-2 px-3 py-1.5 transition ${
            tab === "readme"
              ? "border-accent font-medium text-gray-800"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          README
        </button>
        {!project.archived && (
          <button
            onClick={() => setTab("terminal")}
            className={`relative -mb-px flex items-center gap-1 border-b-2 px-3 py-1.5 transition ${
              tab === "terminal"
                ? "border-accent font-medium text-gray-800"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <SquareTerminal size={12} />
            终端
            {attention && tab !== "terminal" && (
              <span
                title="Claude 正在等待确认"
                className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500"
              />
            )}
          </button>
        )}
        <button
          onClick={() => setTab("activity")}
          className={`relative -mb-px border-b-2 px-3 py-1.5 transition ${
            tab === "activity"
              ? "border-accent font-medium text-gray-800"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          活动
        </button>
        <button
          onClick={() => setTab("memory")}
          className={`relative -mb-px border-b-2 px-3 py-1.5 transition ${
            tab === "memory"
              ? "border-accent font-medium text-gray-800"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          协作记忆
        </button>
      </div>
      <div className="flex flex-1 overflow-hidden">
        {tab === "readme" ? (
          <section className="flex flex-1 flex-col overflow-hidden bg-white/70 backdrop-blur-sm">
            <div className="shrink-0 border-b border-white/60 px-4 py-1 text-[11px] text-gray-400">
              选中文字可加粗/标题/列表 · 输入 / 插入块 · 拖动 ⠿ 排序
            </div>
            <div className="flex-1 overflow-y-auto">
              {readmeLoadedSlug === project.slug && (
                <MarkdownEditor
                  key={project.slug}
                  defaultValue={readme}
                  onChange={(v) => {
                    setReadme(v);
                    setReadmeDirty(true);
                  }}
                />
              )}
            </div>
          </section>
        ) : tab === "terminal" && !project.archived ? (
          <section className="flex-1 overflow-hidden bg-white">
            <TerminalView slug={project.slug} cwd={project.path} />
          </section>
        ) : tab === "activity" ? (
          <section className="flex-1 overflow-hidden">
            <ActivityPanel project={project} />
          </section>
        ) : (
          <section className="flex-1 overflow-hidden">
            <MemoryPanel project={project} />
          </section>
        )}
      </div>
      {dragOver && (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-accent/10 backdrop-blur-[2px]">
          <div className="rounded-xl border-2 border-dashed border-accent/60 bg-white/85 px-6 py-4 text-sm font-medium text-accent-text shadow-glass-lg">
            松开以将文件复制到 references/
          </div>
        </div>
      )}
      <ScheduleConfigModal
        project={project}
        open={scheduleOpen}
        onClose={() => setScheduleOpen(false)}
      />
    </main>
  );
}
