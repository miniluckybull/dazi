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
  RefreshCw,
  ChevronsRight,
  ClipboardList,
} from "lucide-react";
import { ProjectSummary, TaskType, useApp } from "./store";
import { ScheduleConfigModal } from "./ScheduleEditor";
import { SkillPickerModal } from "./SkillPicker";
import { MemoryPanel } from "./MemoryPanel";
import { ActivityPanel } from "./ActivityPanel";
import { MarkdownEditor } from "./MarkdownEditor";
import { TerminalView } from "./terminal/TerminalView";
import { requestLaunch, resetSession } from "./terminal/manager";
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

/** 代理模式开关：开启后启动 claude 协作走非交互 bypassPermissions，跳过逐条确认（反馈 #1）。 */
function AgentModeToggle() {
  const agentMode = useApp((s) => s.agentMode);
  const setAgentMode = useApp((s) => s.setAgentMode);
  return (
    <button
      onClick={() => setAgentMode(!agentMode)}
      title={
        agentMode
          ? "代理模式已开启：启动协作时 Claude 跳过所有确认自动执行。点击关闭（恢复逐条确认）"
          : "代理模式已关闭：启动协作时需逐条确认。点击开启（跳过所有确认，自动执行）"
      }
      className={`flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] transition ${
        agentMode
          ? "border-amber-400/70 bg-amber-50 text-amber-700"
          : "border-white/60 bg-white/60 text-gray-500 hover:bg-white/80"
      }`}
    >
      <Zap size={11} className={agentMode ? "text-amber-500" : "text-gray-400"} />
      代理模式
      <span
        className={`relative h-3.5 w-6 rounded-full transition ${
          agentMode ? "bg-amber-500" : "bg-gray-300"
        }`}
      >
        <span
          className={`absolute top-0.5 h-2.5 w-2.5 rounded-full bg-white transition-all ${
            agentMode ? "left-3" : "left-0.5"
          }`}
        />
      </span>
    </button>
  );
}

export function ProjectDetail({
  project,
  onCollapse,
}: {
  project: ProjectSummary | null;
  onCollapse: () => void;
}) {
  const readReadme = useApp((s) => s.readReadme);
  const writeReadme = useApp((s) => s.writeReadme);
  const importReferences = useApp((s) => s.importReferences);
  const revealInFinder = useApp((s) => s.revealInFinder);
  const handOffToClaude = useApp((s) => s.handOffToClaude);
  const planWithClaude = useApp((s) => s.planWithClaude);
  const continueWithClaude = useApp((s) => s.continueWithClaude);
  const archiveProject = useApp((s) => s.archiveProject);
  const unarchiveProject = useApp((s) => s.unarchiveProject);
  const extractSkill = useApp((s) => s.extractSkill);
  const skillExists = useApp((s) => s.skillExists);
  const refreshSkills = useApp((s) => s.refreshSkills);
  const setShowSkills = useApp((s) => s.setShowSkills);
  const selectSkill = useApp((s) => s.selectSkill);
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
  const [skillsOpen, setSkillsOpen] = useState(false);
  const [skillExtracted, setSkillExtracted] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [extractNote, setExtractNote] = useState<string | null>(null);
  const [autopiloting, setAutopiloting] = useState(false);
  const [termVersion, setTermVersion] = useState(0);
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

  // 归档任务：探测是否已提炼过 skill（直接查产物文件，用户手动删过也准确）
  useEffect(() => {
    setSkillExtracted(false);
    setExtractNote(null);
    if (!project?.archived) return;
    let cancelled = false;
    skillExists(project.slug)
      .then((v) => {
        if (!cancelled) setSkillExtracted(v);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [project?.slug, project?.archived, skillExists]);

  async function callExtractSkill() {
    if (!project) return;
    const exists = await skillExists(project.slug).catch(() => false);
    const ok = await ask(
      exists
        ? `「${project.slug}」已提炼过 skill，重新提炼会覆盖\n~/.claude/skills/${project.slug}/SKILL.md。继续？`
        : `把这次任务提炼为 Claude Code skill？\n会启动一个 Claude 会话，写入 ~/.claude/skills/${project.slug}/SKILL.md。`,
      { title: exists ? "重新提炼" : "提炼为 skill", kind: "info" }
    );
    if (!ok) return;
    await extractSkill(project.path);
    if (exists) {
      // 重新提炼：产物已存在，无法靠「出现」探测，只提示会话已启动
      setExtractNote("提炼会话已启动，完成后可到「技能」页查看");
      setTimeout(() => setExtractNote(null), 6000);
      return;
    }
    // 首次提炼：轮询产物出现（Claude 会话异步执行，最长等 5 分钟）
    setExtracting(true);
    setExtractNote("提炼中，请在终端完成会话…");
    for (let i = 0; i < 60; i++) {
      await new Promise((r) => setTimeout(r, 5000));
      const done = await skillExists(project.slug).catch(() => false);
      if (done) {
        setExtracting(false);
        setSkillExtracted(true);
        setExtractNote("✓ 已生成 skill");
        refreshSkills();
        setTimeout(() => setExtractNote(null), 4000);
        return;
      }
    }
    setExtracting(false);
    setExtractNote("未检测到 skill 生成，请检查终端会话");
    setTimeout(() => setExtractNote(null), 8000);
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
    const agent = useApp.getState().agentMode;
    const refsHint = project.has_references
      ? "已检测到 references/ 中的资料。"
      : project.requires_references
        ? "⚠ 此任务标记为「需要参考资料」，但 references/ 当前为空，启动后 Claude 可能信息不足。"
        : "references/ 当前为空，Claude 将仅基于 README.md 推进。";
    const modeHint = agent
      ? "\n⚡ 代理模式已开启：Claude 将跳过所有确认自动执行，请确保 README 任务清晰、无破坏性指令。"
      : "";
    const ok = await ask(
      `启动 dazi 协作？\n${refsHint}${modeHint}\n启动后 Claude 会基于 README.md 与 references/ 中的资料推进任务。`,
      { title: "启动 dazi", kind: "info" }
    );
    if (!ok) return;
    const mode = await invoke<string>("get_terminal_mode").catch(() => "embedded");
    if (mode === "external") {
      await handOffToClaude(project.path);
    } else {
      await requestLaunch(project.slug, project.path, "handoff", agent);
      setTab("terminal");
      await refreshProjects();
    }
  }

  async function callNewChat() {
    if (!project) return;
    // clear 上下文后新建对话：强制重启 claude 重新注入协作记忆（profile/facts/patterns/context/journal），
    // 解决 clear 后新对话丢失关键信息、不主动读记忆的问题（反馈 #7）。
    const ok = await ask(
      `新建对话并重新注入协作记忆？\n会重启 claude 并注入用户画像、世界事实、跨项目模式与本项目进展。适用于上下文 clear 后恢复。`,
      { title: "新建对话", kind: "info" }
    );
    if (!ok) return;
    const agent = useApp.getState().agentMode;
    const mode = await invoke<string>("get_terminal_mode").catch(() => "embedded");
    if (mode === "external") {
      await handOffToClaude(project.path);
    } else {
      await resetSession(project.slug);
      setTermVersion((v) => v + 1);
      await requestLaunch(project.slug, project.path, "handoff", agent);
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

  // 「先出计划」：以 plan 模式启动协作——Claude 只读探索、产出执行计划，
  // 不改动任何文件；用户在终端确认计划后再放行执行（复杂任务先看方案，质量更稳）。
  async function callPlan() {
    if (!project) return;
    const ok = await ask(
      `以计划模式启动协作？\nClaude 会只读分析 README 与参考资料，给出分步执行计划，不会改动任何文件；你确认计划后再让它执行。`,
      { title: "先出计划", kind: "info" }
    );
    if (!ok) return;
    const mode = await invoke<string>("get_terminal_mode").catch(() => "embedded");
    if (mode === "external") {
      await planWithClaude(project.path);
    } else {
      await requestLaunch(project.slug, project.path, "plan");
      setTab("terminal");
      await refreshProjects();
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
        if (payload.type === "enter") {
          // enter 携带 paths：只有拖入文件才显示导入遮罩；
          // 编辑器内部 HTML5 拖拽（如块手柄 ⠿ 排序）paths 为空，直接忽略。
          setDragOver(((payload.paths as string[]) ?? []).length > 0);
        } else if (payload.type === "over") {
          // over 不携带 paths，保持 enter 时确定的状态
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

  // 任务状态徽章（反馈 #2）：待确认/已中断/进行中/已完成/未启动/已归档
  const detailStatus = project.archived
    ? { label: "已归档", cls: "bg-gray-100 text-gray-500" }
    : attention
      ? { label: "待确认", cls: "bg-red-100 text-red-600 animate-pulse" }
      : project.last_run_ok === false
        ? { label: "已中断", cls: "bg-red-100 text-red-600" }
        : project.handed_off_at && project.last_run_ok !== true
          ? { label: "进行中", cls: "bg-amber-100 text-amber-700" }
          : project.last_run_ok === true
            ? { label: "已完成", cls: "bg-emerald-100 text-emerald-700" }
            : { label: "未启动", cls: "bg-sky-100 text-sky-600" };

  return (
    <main className="relative flex flex-1 flex-col overflow-hidden">
      <header className="border-b border-white/60 bg-white/55 px-6 py-3 backdrop-blur-xl">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-semibold text-gray-900">
              {project.name}
            </h1>
            <div className="mt-0.5 flex items-center gap-2">
              <p
                className="truncate text-xs text-gray-500"
                title={project.path}
              >
                {project.path}
              </p>
              <span
                className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${detailStatus.cls}`}
                title={detailStatus.label}
              >
                {detailStatus.label}
              </span>
            </div>
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
            {extractNote && (
              <span className="mr-1 text-[11px] text-gray-400">
                {extractNote}
              </span>
            )}
            <MemoryBadge layers={memoryLayers} />
            {project.archived ? (
              <>
                <IconButton title="回到活动区" onClick={unarchive}>
                  <ArchiveRestore size={15} />
                </IconButton>
                {skillExtracted && (
                  <button
                    title="已提炼，点击到「技能」页查看"
                    onClick={() => {
                      setShowSkills(true);
                      selectSkill(project.slug);
                    }}
                    className="flex h-8 items-center rounded-md border border-accent-border/70 bg-accent-soft/80 px-2 text-[11px] text-accent-text transition hover:bg-accent-soft"
                  >
                    已提炼
                  </button>
                )}
                <IconButton
                  title={skillExtracted ? "重新提炼为 skill（覆盖已有）" : "提炼为 skill"}
                  onClick={callExtractSkill}
                  emphasis
                >
                  <Sparkles
                    size={15}
                    className={extracting ? "animate-pulse text-amber-600" : ""}
                  />
                </IconButton>
                <IconButton
                  title="折叠右侧详情面板（仅看任务列表，点窗口最右缘展开）"
                  onClick={onCollapse}
                >
                  <ChevronsRight size={15} />
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
                <IconButton
                  title="注入技能（启动协作/自动执行时强制使用勾选的 skill）"
                  onClick={() => setSkillsOpen(true)}
                >
                  <Sparkles size={15} />
                </IconButton>
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
                  title="先出计划（plan 模式：Claude 只读分析、给出执行计划，确认后再执行，不改动文件）"
                  onClick={callPlan}
                >
                  <ClipboardList size={15} />
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
                  title={claudeTitle}
                  onClick={callClaude}
                  tone={claudeTone}
                >
                  <Send size={15} />
                </IconButton>
                {project.handed_off_at && (
                  <IconButton
                    title="新建对话（重启 claude 并重新注入协作记忆，用于 clear 后恢复）"
                    onClick={callNewChat}
                  >
                    <RefreshCw size={15} />
                  </IconButton>
                )}
                <IconButton
                  title="折叠右侧详情面板（仅看任务列表，点窗口最右缘展开）"
                  onClick={onCollapse}
                >
                  <ChevronsRight size={15} />
                </IconButton>
              </>
            )}
          </div>
        </div>
      </header>
      <div className="flex items-center justify-between border-b border-white/60 bg-white/45 px-4 text-xs backdrop-blur">
        <div className="flex">
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
                  className="h-2.5 w-2.5 animate-pulse rounded-full bg-amber-400 shadow-[0_0_0_3px_rgba(251,191,36,0.35)]"
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
        {!project.archived && <AgentModeToggle />}
      </div>
      <div className="flex flex-1 overflow-hidden">
        {tab === "readme" ? (
          <section className="flex flex-1 flex-col overflow-hidden bg-white/70 backdrop-blur-sm">
            <div className="shrink-0 border-b border-white/60 px-4 py-1 text-[11px] text-gray-400">
              选中文字可加粗/标题/列表 · 输入 / 或点行首 ➕ 插入块
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
            <TerminalView key={`${project.slug}-${termVersion}`} slug={project.slug} cwd={project.path} />
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
      <SkillPickerModal
        project={project}
        open={skillsOpen}
        onClose={() => setSkillsOpen(false)}
      />
    </main>
  );
}
