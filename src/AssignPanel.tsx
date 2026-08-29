// AssignPanel — 桌面端负责人与讨论。与手机 AssigneeRow + CommentsView 同语义，
// 读写同一份 .dazi/assign.json 与 .dazi/comments.jsonl（经 dazi_core，非各自实现）。
//
// 桌面无配对身份，操作者恒为本机 owner（见 src-tauri 的 local_actor）。
// @提及由 Rust 侧 parse_mentions 解析，前端不做匹配——中文名无词边界，
// 两端各写一套规则必然漂移。
import { useCallback, useEffect, useState } from "react";
import { AtSign, MessageSquare, Send, UserCheck } from "lucide-react";
import { Assignment, Comment, useApp } from "./store";

function formatAt(iso: string): string {
  const t = new Date(iso);
  return Number.isNaN(t.getTime()) ? iso : t.toLocaleString();
}

export function AssignPanel({ projectPath }: { projectPath: string }) {
  const {
    teamMembers,
    refreshTeamMembers,
    readAssignment,
    setAssignment,
    readComments,
    addComment,
  } = useApp();
  const [assignment, setAssignmentState] = useState<Assignment | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [showComments, setShowComments] = useState(false);

  const reload = useCallback(async () => {
    try {
      const [a, c] = await Promise.all([
        readAssignment(projectPath),
        readComments(projectPath),
      ]);
      setAssignmentState(a);
      setComments(c);
    } catch (e) {
      setErr(String(e));
    }
  }, [projectPath, readAssignment, readComments]);

  useEffect(() => {
    void reload();
    void refreshTeamMembers();
  }, [reload, refreshTeamMembers]);

  const nameOf = (id?: string | null) =>
    id ? (teamMembers.find((m) => m.id === id)?.name ?? id) : "未知";

  const act = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    setErr(null);
    try {
      await fn();
      await reload();
    } catch (e) {
      setErr(String(e));
    } finally {
      setBusy(false);
    }
  };

  const candidates = teamMembers.filter((m) => m.status === "active");

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    void act(async () => {
      await addComment(projectPath, text);
      setDraft("");
    });
  };

  return (
    <div className="rounded-lg border border-black/5 bg-white/70 p-3">
      <div className="flex items-center gap-2">
        <UserCheck size={14} className="shrink-0 text-gray-400" />
        <span className="text-xs font-medium text-gray-900">
          {assignment ? nameOf(assignment.assignee) : "未指派"}
        </span>
        <div className="ml-auto flex items-center gap-1.5">
          {candidates.length > 0 && (
            <select
              value={assignment?.assignee ?? ""}
              disabled={busy}
              onChange={(e) => {
                const v = e.target.value;
                void act(() => setAssignment(projectPath, v === "" ? null : v));
              }}
              className="h-7 rounded-md border border-black/10 bg-white px-1.5 text-[11px] text-gray-600"
            >
              <option value="">未指派</option>
              {candidates.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          )}
          <button
            onClick={() => setShowComments((v) => !v)}
            className="flex h-7 items-center gap-1 rounded-md border border-black/10 px-2 text-[11px] text-gray-600 transition hover:bg-black/5"
          >
            <MessageSquare size={12} />
            讨论 {comments.length > 0 ? comments.length : ""}
          </button>
        </div>
      </div>

      {err && <p className="mt-2 text-[11px] text-orange-600">{err}</p>}

      {showComments && (
        <div className="mt-2 border-t border-black/5 pt-2">
          {comments.length === 0 ? (
            <p className="text-[11px] text-gray-400">
              还没有讨论。用 @姓名 提到某人，他会收到通知。
            </p>
          ) : (
            <ul className="max-h-64 space-y-2 overflow-y-auto">
              {comments.map((c, i) => (
                <li key={`${c.at}-${i}`} className="text-[11px]">
                  <p className="text-gray-400">
                    {nameOf(c.by)} · {formatAt(c.at)}
                  </p>
                  <p className="whitespace-pre-wrap text-gray-700">{c.text}</p>
                  {c.mentions.length > 0 && (
                    <p className="mt-0.5 flex items-center gap-1 text-accent-text">
                      <AtSign size={10} />
                      {c.mentions.map(nameOf).join("、")}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
          <div className="mt-2 flex gap-1.5">
            <input
              value={draft}
              disabled={busy}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder="说点什么，@姓名 可派给他"
              className="h-7 min-w-0 flex-1 rounded-md border border-black/10 bg-white px-2 text-[11px] text-gray-700"
            />
            <button
              disabled={busy || !draft.trim()}
              onClick={send}
              className="flex h-7 items-center gap-1 rounded-md border border-accent-border/70 bg-accent-soft/80 px-2 text-[11px] font-medium text-accent-text transition hover:bg-accent-soft disabled:opacity-50"
            >
              <Send size={12} />
              发送
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
