import { useEffect, useState } from "react";
import { ProjectSummary, useApp } from "./store";

export function MemoryPanel({ project }: { project: ProjectSummary }) {
  const readProjectJournal = useApp((s) => s.readProjectJournal);
  const readProjectContext = useApp((s) => s.readProjectContext);

  const [journal, setJournal] = useState("");
  const [context, setContext] = useState("");

  useEffect(() => {
    readProjectJournal(project.path)
      .then((v) => setJournal(v))
      .catch(() => setJournal(""));
    readProjectContext(project.path)
      .then((v) => setContext(v))
      .catch(() => setContext(""));
  }, [project.path, readProjectJournal, readProjectContext]);

  const empty = !journal.trim() && !context.trim();

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto bg-white/70 p-5 backdrop-blur-sm">
      {empty && (
        <div className="rounded-lg border border-dashed border-white/60 bg-white/50 p-4 text-xs text-gray-500">
          这个项目还没有协作记忆。完成第一次 dazi
          会话后，Claude 会在 .dazi/journal.md 与 .dazi/context.md
          中追加内容。
        </div>
      )}

      <section className="rounded-lg border border-white/50 bg-white/70 shadow-sm">
        <header className="flex items-baseline justify-between border-b border-white/50 px-4 py-2">
          <h3 className="text-sm font-semibold text-gray-800">当前进展</h3>
          <span className="text-[10px] text-gray-400">.dazi/context.md</span>
        </header>
        <div className="px-4 py-3">
          {context.trim() ? (
            <pre className="whitespace-pre-wrap break-words font-mono text-[12px] leading-relaxed text-gray-800">
              {context}
            </pre>
          ) : (
            <p className="text-xs text-gray-400">尚未生成</p>
          )}
        </div>
      </section>

      <section className="rounded-lg border border-white/50 bg-white/70 shadow-sm">
        <header className="flex items-baseline justify-between border-b border-white/50 px-4 py-2">
          <h3 className="text-sm font-semibold text-gray-800">协作日志</h3>
          <span className="text-[10px] text-gray-400">.dazi/journal.md</span>
        </header>
        <div className="px-4 py-3">
          {journal.trim() ? (
            <pre className="whitespace-pre-wrap break-words font-mono text-[12px] leading-relaxed text-gray-800">
              {journal}
            </pre>
          ) : (
            <p className="text-xs text-gray-400">尚未生成</p>
          )}
        </div>
      </section>
    </div>
  );
}
