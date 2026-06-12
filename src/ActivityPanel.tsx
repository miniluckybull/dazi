import { useEffect, useState } from "react";
import { Bot, Bell, Send, FileText, Folder, ChevronRight } from "lucide-react";
import { ProjectSummary, ReferenceEntry, RunRecord, useApp } from "./store";

function relativeTime(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  const diff = Date.now() - d.getTime();
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "刚刚";
  if (min < 60) return `${min} 分钟前`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} 小时前`;
  const day = Math.floor(h / 24);
  if (day < 7) return `${day} 天前`;
  return d.toLocaleString();
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function actionBadge(action: string) {
  if (action === "autopilot")
    return (
      <span className="flex items-center gap-1 rounded bg-amber-100/80 px-1.5 py-0.5 text-[10px] text-amber-700">
        <Bot size={10} />
        自动执行
      </span>
    );
  if (action === "handoff")
    return (
      <span className="flex items-center gap-1 rounded bg-sky-100/80 px-1.5 py-0.5 text-[10px] text-sky-700">
        <Send size={10} />
        交接
      </span>
    );
  return (
    <span className="flex items-center gap-1 rounded bg-gray-100/80 px-1.5 py-0.5 text-[10px] text-gray-600">
      <Bell size={10} />
      提醒
    </span>
  );
}

function RunItem({ run }: { run: RunRecord }) {
  const [expanded, setExpanded] = useState(false);
  const hasMessage = !!run.message?.trim();
  return (
    <li className="flex gap-2.5 px-4 py-2.5">
      <span
        className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
          run.ok ? "bg-emerald-500" : "bg-red-500"
        }`}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          {actionBadge(run.action)}
          <span className="text-[11px] text-gray-400" title={new Date(run.at).toLocaleString()}>
            {relativeTime(run.at)}
          </span>
          <span className={`text-[11px] ${run.ok ? "text-emerald-600" : "text-red-600"}`}>
            {run.ok ? "成功" : "失败"}
          </span>
        </div>
        {hasMessage && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="mt-1 flex w-full items-start gap-1 text-left text-[11px] text-gray-500 hover:text-gray-700"
          >
            <ChevronRight
              size={11}
              className={`mt-0.5 shrink-0 transition-transform ${expanded ? "rotate-90" : ""}`}
            />
            <span className={expanded ? "whitespace-pre-wrap break-words" : "truncate"}>
              {run.message}
            </span>
          </button>
        )}
      </div>
    </li>
  );
}

export function ActivityPanel({ project }: { project: ProjectSummary }) {
  const readMeta = useApp((s) => s.readMeta);
  const listReferences = useApp((s) => s.listReferences);
  const revealInFinder = useApp((s) => s.revealInFinder);

  const [runs, setRuns] = useState<RunRecord[]>([]);
  const [refs, setRefs] = useState<ReferenceEntry[]>([]);

  useEffect(() => {
    let cancelled = false;
    readMeta(project.path)
      .then((m) => {
        if (!cancelled) setRuns([...(m.runs ?? [])].reverse());
      })
      .catch(() => {});
    listReferences(project.path)
      .then((list) => {
        if (!cancelled) setRefs(list);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [project.path, readMeta, listReferences]);

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto bg-white/70 p-5 backdrop-blur-sm">
      <section className="rounded-lg border border-white/70 bg-white/70 shadow-sm">
        <header className="flex items-baseline justify-between border-b border-white/70 px-4 py-2">
          <h3 className="text-sm font-semibold text-gray-800">执行历史</h3>
          <span className="text-[10px] text-gray-400">meta.yml · runs</span>
        </header>
        {runs.length === 0 ? (
          <p className="px-4 py-3 text-xs text-gray-400">
            还没有执行记录。定时/循环任务触发或自动执行后会在这里留痕。
          </p>
        ) : (
          <ul className="divide-y divide-white/70">
            {runs.map((r, i) => (
              <RunItem key={`${r.at}-${i}`} run={r} />
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-lg border border-white/70 bg-white/70 shadow-sm">
        <header className="flex items-baseline justify-between border-b border-white/70 px-4 py-2">
          <h3 className="text-sm font-semibold text-gray-800">参考资料</h3>
          <span className="text-[10px] text-gray-400">references/</span>
        </header>
        {refs.length === 0 ? (
          <p className="px-4 py-3 text-xs text-gray-400">
            references/ 为空。把文件拖入 README 页即可导入。
          </p>
        ) : (
          <ul className="divide-y divide-white/70">
            {refs.map((f) => (
              <li key={f.path}>
                <button
                  onClick={() => revealInFinder(f.path)}
                  title="在 Finder 中显示"
                  className="flex w-full items-center gap-2.5 px-4 py-2 text-left transition hover:bg-white/70"
                >
                  {f.is_dir ? (
                    <Folder size={14} className="shrink-0 text-amber-500" />
                  ) : (
                    <FileText size={14} className="shrink-0 text-gray-400" />
                  )}
                  <span className="min-w-0 flex-1 truncate text-xs text-gray-800">
                    {f.name}
                  </span>
                  {!f.is_dir && (
                    <span className="shrink-0 text-[10px] text-gray-400">
                      {formatSize(f.size)}
                    </span>
                  )}
                  <span className="shrink-0 text-[10px] text-gray-400">
                    {relativeTime(f.modified_at)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
