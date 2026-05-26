import { useEffect, useState } from "react";
import {
  ProjectMeta,
  ProjectSummary,
  Schedule,
  SchedulePatch,
  TaskType,
  IntervalUnit,
  useApp,
} from "./store";

const TYPE_LABEL: Record<TaskType, string> = {
  oneoff: "一次性",
  scheduled: "定时",
  recurring: "循环",
};

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

export function ScheduleEditor({ project }: { project: ProjectSummary }) {
  const readMeta = useApp((s) => s.readMeta);
  const setSchedule = useApp((s) => s.setSchedule);

  const [meta, setMeta] = useState<ProjectMeta | null>(null);
  const [open, setOpen] = useState(false);
  const [taskType, setTaskType] = useState<TaskType>("oneoff");
  const [runAtLocal, setRunAtLocal] = useState("");
  const [every, setEvery] = useState(1);
  const [unit, setUnit] = useState<IntervalUnit>("day");
  const [endsAtLocal, setEndsAtLocal] = useState("");
  const [maxRuns, setMaxRuns] = useState<string>("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
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
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [project.slug, project.path, readMeta]);

  async function save() {
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
        };
      }
      const patch: SchedulePatch = {
        task_type: taskType,
        schedule,
        on_trigger: { action: "notify" },
      };
      const updated = await setSchedule(project.path, patch);
      setMeta(updated);
    } finally {
      setSaving(false);
    }
  }

  const next = meta?.next_run_at ? new Date(meta.next_run_at) : null;
  const nextLabel = next ? next.toLocaleString() : "—";

  return (
    <div className="border-b border-white/40 bg-white/40 px-6 py-2 text-xs backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <span className="font-medium text-gray-700">
          类型：
          <span className="ml-1 rounded bg-white/70 px-1.5 py-0.5 text-gray-900">
            {TYPE_LABEL[taskType]}
          </span>
        </span>
        <span className="text-gray-500">下次：{nextLabel}</span>
        <button
          className="ml-auto rounded border border-white/60 bg-white/70 px-2 py-1 text-gray-700 hover:bg-white"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "收起" : "编辑"}
        </button>
      </div>
      {open && (
        <div className="mt-2 grid grid-cols-2 gap-2">
          <label className="flex items-center gap-2">
            类型
            <select
              value={taskType}
              onChange={(e) => setTaskType(e.target.value as TaskType)}
              className="rounded border border-white/70 bg-white/80 px-1 py-0.5"
            >
              <option value="oneoff">一次性</option>
              <option value="scheduled">定时</option>
              <option value="recurring">循环</option>
            </select>
          </label>
          {taskType === "scheduled" && (
            <label className="flex items-center gap-2">
              触发时间
              <input
                type="datetime-local"
                value={runAtLocal}
                onChange={(e) => setRunAtLocal(e.target.value)}
                className="rounded border border-white/70 bg-white/80 px-1 py-0.5"
              />
            </label>
          )}
          {taskType === "recurring" && (
            <>
              <label className="flex items-center gap-2">
                首次（可选）
                <input
                  type="datetime-local"
                  value={runAtLocal}
                  onChange={(e) => setRunAtLocal(e.target.value)}
                  className="rounded border border-white/70 bg-white/80 px-1 py-0.5"
                />
              </label>
              <label className="flex items-center gap-2">
                间隔
                <input
                  type="number"
                  min={1}
                  value={every}
                  onChange={(e) => setEvery(parseInt(e.target.value || "1", 10))}
                  className="w-16 rounded border border-white/70 bg-white/80 px-1 py-0.5"
                />
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value as IntervalUnit)}
                  className="rounded border border-white/70 bg-white/80 px-1 py-0.5"
                >
                  {(Object.keys(UNIT_LABEL) as IntervalUnit[]).map((u) => (
                    <option key={u} value={u}>
                      {UNIT_LABEL[u]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex items-center gap-2">
                截止（可选）
                <input
                  type="datetime-local"
                  value={endsAtLocal}
                  onChange={(e) => setEndsAtLocal(e.target.value)}
                  className="rounded border border-white/70 bg-white/80 px-1 py-0.5"
                />
              </label>
              <label className="flex items-center gap-2">
                最多次数（可选）
                <input
                  type="number"
                  min={1}
                  value={maxRuns}
                  onChange={(e) => setMaxRuns(e.target.value)}
                  className="w-20 rounded border border-white/70 bg-white/80 px-1 py-0.5"
                />
              </label>
            </>
          )}
          <div className="col-span-2 flex justify-end">
            <button
              onClick={save}
              disabled={saving}
              className="rounded border border-indigo-500/70 bg-indigo-600/90 px-3 py-1 text-white shadow-sm shadow-indigo-500/30 hover:bg-indigo-600 disabled:opacity-60"
            >
              {saving ? "保存中…" : "保存"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
