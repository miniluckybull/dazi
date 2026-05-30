import { useEffect, useState } from "react";
import { Pause, Play, X, Zap, Clock, Repeat } from "lucide-react";
import {
  ProjectMeta,
  ProjectSummary,
  Schedule,
  SchedulePatch,
  TaskType,
  IntervalUnit,
  useApp,
} from "./store";

const TYPE_OPTIONS: { value: TaskType; label: string; hint: string; Icon: typeof Zap }[] = [
  { value: "oneoff", label: "一次性", hint: "做完就归档", Icon: Zap },
  { value: "scheduled", label: "定时", hint: "在指定时间点提醒", Icon: Clock },
  { value: "recurring", label: "循环", hint: "按固定间隔重复", Icon: Repeat },
];

const UNIT_LABEL: Record<IntervalUnit, string> = {
  minute: "分钟",
  hour: "小时",
  day: "天",
  week: "周",
  month: "月",
};

function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromLocalInput(v: string): string | null {
  if (!v) return null;
  const d = new Date(v);
  if (isNaN(d.getTime())) return null;
  return d.toISOString();
}

export function ScheduleConfigModal({
  project,
  open,
  onClose,
}: {
  project: ProjectSummary;
  open: boolean;
  onClose: () => void;
}) {
  const readMeta = useApp((s) => s.readMeta);
  const setSchedule = useApp((s) => s.setSchedule);

  const [meta, setMeta] = useState<ProjectMeta | null>(null);
  const [taskType, setTaskType] = useState<TaskType>("oneoff");
  const [runAtLocal, setRunAtLocal] = useState("");
  const [every, setEvery] = useState(1);
  const [unit, setUnit] = useState<IntervalUnit>("day");
  const [endsAtLocal, setEndsAtLocal] = useState("");
  const [maxRuns, setMaxRuns] = useState<string>("");
  const [paused, setPaused] = useState(false);
  const [triggerAction, setTriggerAction] = useState<"notify" | "autopilot">("notify");
  const [riskAck, setRiskAck] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    readMeta(project.path)
      .then((m) => {
        if (cancelled) return;
        setMeta(m);
        setTaskType(m.task_type);
        setRunAtLocal(toLocalInput(m.schedule?.run_at));
        setEvery(m.schedule?.interval?.every ?? 1);
        setUnit((m.schedule?.interval?.unit as IntervalUnit) ?? "day");
        setEndsAtLocal(toLocalInput(m.schedule?.ends_at));
        setMaxRuns(m.schedule?.max_runs ? String(m.schedule.max_runs) : "");
        setPaused(!!m.schedule?.paused);
        const act = m.on_trigger?.action === "autopilot" ? "autopilot" : "notify";
        setTriggerAction(act);
        setRiskAck(act === "autopilot");
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [open, project.slug, project.path, readMeta]);

  async function save(closeAfter = true) {
    setSaving(true);
    try {
      let schedule: Schedule | null = null;
      if (taskType === "scheduled") {
        const run_at = fromLocalInput(runAtLocal);
        if (!run_at) {
          alert("请选择触发时间");
          return;
        }
        schedule = { run_at };
      } else if (taskType === "recurring") {
        const e = Math.max(1, Math.floor(every));
        schedule = {
          run_at: runAtLocal ? fromLocalInput(runAtLocal) : null,
          interval: { every: e, unit },
          ends_at: endsAtLocal ? fromLocalInput(endsAtLocal) : null,
          max_runs: maxRuns ? Math.max(1, parseInt(maxRuns, 10)) : null,
          paused,
        };
      }
      // 一次性任务不支持 autopilot（无调度执行器触发），强制 notify。
      const action: "notify" | "autopilot" =
        taskType !== "oneoff" && triggerAction === "autopilot" ? "autopilot" : "notify";
      if (action === "autopilot" && !riskAck) {
        alert("自动执行会以跳过权限模式无人值守运行 Claude，请先勾选风险确认");
        return;
      }
      const patch: SchedulePatch = {
        task_type: taskType,
        schedule,
        on_trigger: { action },
      };
      const updated = await setSchedule(project.path, patch);
      setMeta(updated);
      if (closeAfter) onClose();
    } finally {
      setSaving(false);
    }
  }

  async function togglePause() {
    const next = !paused;
    setPaused(next);
    if (taskType === "recurring") {
      // 立刻持久化，避免用户关掉模态后没保存
      setSaving(true);
      try {
        const e = Math.max(1, Math.floor(every));
        const schedule: Schedule = {
          run_at: runAtLocal ? fromLocalInput(runAtLocal) : null,
          interval: { every: e, unit },
          ends_at: endsAtLocal ? fromLocalInput(endsAtLocal) : null,
          max_runs: maxRuns ? Math.max(1, parseInt(maxRuns, 10)) : null,
          paused: next,
        };
        const updated = await setSchedule(project.path, {
          task_type: "recurring",
          schedule,
          on_trigger: {
            action: triggerAction === "autopilot" && riskAck ? "autopilot" : "notify",
          },
        });
        setMeta(updated);
      } finally {
        setSaving(false);
      }
    }
  }

  if (!open) return null;

  const next = meta?.next_run_at ? new Date(meta.next_run_at) : null;
  const nextLabel = next ? next.toLocaleString() : "—";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-[420px] rounded-xl border border-white/60 bg-white/90 p-5 shadow-glass-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-800">任务调度</h2>
          <button
            onClick={onClose}
            className="flex h-6 w-6 items-center justify-center rounded-md text-gray-400 hover:bg-white hover:text-gray-700"
          >
            <X size={14} />
          </button>
        </div>

        <div className="mb-3 grid grid-cols-3 gap-1.5">
          {TYPE_OPTIONS.map((t) => {
            const Icon = t.Icon;
            const active = taskType === t.value;
            return (
              <button
                key={t.value}
                onClick={() => setTaskType(t.value)}
                className={`flex flex-col items-center gap-1 rounded-md border px-2 py-2 text-[11px] transition ${
                  active
                    ? "border-indigo-500/70 bg-indigo-50 text-indigo-700"
                    : "border-white/70 bg-white/70 text-gray-600 hover:bg-white"
                }`}
                title={t.hint}
              >
                <Icon size={14} />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {taskType === "scheduled" && (
          <label className="mb-2 flex items-center justify-between gap-2 text-xs text-gray-700">
            触发时间
            <input
              type="datetime-local"
              value={runAtLocal}
              onChange={(e) => setRunAtLocal(e.target.value)}
              className="rounded border border-white/70 bg-white/80 px-2 py-1"
            />
          </label>
        )}

        {taskType === "recurring" && (
          <div className="space-y-2 text-xs text-gray-700">
            <label className="flex items-center justify-between gap-2">
              首次（可选）
              <input
                type="datetime-local"
                value={runAtLocal}
                onChange={(e) => setRunAtLocal(e.target.value)}
                className="rounded border border-white/70 bg-white/80 px-2 py-1"
              />
            </label>
            <label className="flex items-center justify-between gap-2">
              间隔
              <span className="flex items-center gap-1">
                <input
                  type="number"
                  min={1}
                  value={every}
                  onChange={(e) => setEvery(parseInt(e.target.value || "1", 10))}
                  className="w-16 rounded border border-white/70 bg-white/80 px-2 py-1"
                />
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value as IntervalUnit)}
                  className="rounded border border-white/70 bg-white/80 px-2 py-1"
                >
                  {(Object.keys(UNIT_LABEL) as IntervalUnit[]).map((u) => (
                    <option key={u} value={u}>
                      {UNIT_LABEL[u]}
                    </option>
                  ))}
                </select>
              </span>
            </label>
            <label className="flex items-center justify-between gap-2">
              截止（可选）
              <input
                type="datetime-local"
                value={endsAtLocal}
                onChange={(e) => setEndsAtLocal(e.target.value)}
                className="rounded border border-white/70 bg-white/80 px-2 py-1"
              />
            </label>
            <label className="flex items-center justify-between gap-2">
              最多次数（可选）
              <input
                type="number"
                min={1}
                value={maxRuns}
                onChange={(e) => setMaxRuns(e.target.value)}
                className="w-20 rounded border border-white/70 bg-white/80 px-2 py-1"
              />
            </label>
            <div className="flex items-center justify-between rounded-md border border-white/70 bg-white/70 px-2 py-1.5">
              <span className="flex items-center gap-1.5">
                {paused ? (
                  <Pause size={13} className="text-amber-600" />
                ) : (
                  <Play size={13} className="text-emerald-600" />
                )}
                {paused ? "已暂停" : "运行中"}
              </span>
              <button
                onClick={togglePause}
                disabled={saving}
                className={`rounded px-2 py-0.5 text-[11px] transition ${
                  paused
                    ? "bg-emerald-500 text-white hover:bg-emerald-600"
                    : "bg-amber-500 text-white hover:bg-amber-600"
                } disabled:opacity-60`}
              >
                {paused ? "恢复" : "暂停"}
              </button>
            </div>
          </div>
        )}

        {taskType !== "oneoff" && (
          <div className="mt-3 space-y-2 rounded-md border border-white/70 bg-white/60 p-2.5 text-xs text-gray-700">
            <div className="font-medium text-gray-800">到点动作</div>
            <div className="flex gap-2">
              <button
                onClick={() => setTriggerAction("notify")}
                className={`flex-1 rounded border px-2 py-1.5 transition ${
                  triggerAction === "notify"
                    ? "border-indigo-500/70 bg-indigo-50 text-indigo-700"
                    : "border-white/70 bg-white/70 text-gray-600 hover:bg-white"
                }`}
              >
                提醒我
              </button>
              <button
                onClick={() => setTriggerAction("autopilot")}
                className={`flex-1 rounded border px-2 py-1.5 transition ${
                  triggerAction === "autopilot"
                    ? "border-amber-500/70 bg-amber-50 text-amber-700"
                    : "border-white/70 bg-white/70 text-gray-600 hover:bg-white"
                }`}
              >
                自动执行
              </button>
            </div>
            {triggerAction === "autopilot" && (
              <div className="space-y-1.5 rounded border border-amber-300/70 bg-amber-50/70 p-2 text-[11px] text-amber-800">
                <p>
                  到点后会以「跳过权限」模式无人值守运行 Claude，它可在本项目目录内自主读写文件、执行命令。
                  破坏性操作会被要求只记录待你确认，运行留痕在 .dazi/journal.md。
                </p>
                <label className="flex items-center gap-1.5">
                  <input
                    type="checkbox"
                    checked={riskAck}
                    onChange={(e) => setRiskAck(e.target.checked)}
                  />
                  我已知晓风险，允许自动执行
                </label>
              </div>
            )}
          </div>
        )}

        <div className="mt-4 flex items-center justify-between text-[11px] text-gray-500">
          <span>下次：{nextLabel}</span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="rounded border border-white/60 bg-white/70 px-3 py-1 text-gray-700 hover:bg-white"
            >
              取消
            </button>
            <button
              onClick={() => save(true)}
              disabled={saving || (triggerAction === "autopilot" && taskType !== "oneoff" && !riskAck)}
              className="rounded border border-indigo-500/70 bg-indigo-600/90 px-3 py-1 text-white shadow-sm shadow-indigo-500/30 hover:bg-indigo-600 disabled:opacity-60"
            >
              {saving ? "保存中…" : "保存"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
