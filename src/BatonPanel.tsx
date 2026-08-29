// BatonPanel — 桌面端接力棒。与手机 BatonCard 是同一套语义，
// 读写同一份 .dazi/baton.json（经 dazi_core::baton，非各自实现）。
//
// 桌面无配对身份，操作者恒为本机 owner（见 src-tauri 的 local_actor），
// 故这里不做「我是不是持棒人」的客户端判断——由 Rust 侧按 actor 决定，
// 失败回错误串。客户端重建一套判断必然与服务端漂移。
import { useCallback, useEffect, useState } from "react";
import { Hand, Send, LogOut, TimerOff, Bot, User, RefreshCw } from "lucide-react";
import { Baton, BatonState, RelayEntry, useApp } from "./store";

/** 距 iso 还剩多久；已过或解析失败都算过期（与 Rust is_expired 对坏数据的判断一致）。 */
function remaining(iso: string): string {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return "已过期";
  const ms = t - Date.now();
  if (ms <= 0) return "已过期";
  const mins = Math.floor(ms / 60000);
  if (mins >= 60) return `剩 ${Math.floor(mins / 60)} 小时 ${mins % 60} 分`;
  return mins > 0 ? `剩 ${mins} 分` : "剩不到 1 分钟";
}

function formatAt(iso: string): string {
  const t = new Date(iso);
  return Number.isNaN(t.getTime()) ? iso : t.toLocaleString();
}

export function BatonPanel({ projectPath }: { projectPath: string }) {
  const {
    teamMembers,
    refreshTeamMembers,
    readBaton,
    readRelayChain,
    claimBaton,
    handoffBaton,
    releaseBaton,
  } = useApp();
  const [state, setState] = useState<BatonState | null>(null);
  const [chain, setChain] = useState<RelayEntry[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [showChain, setShowChain] = useState(false);
  const [handoffTo, setHandoffTo] = useState<string>("");

  const reload = useCallback(async () => {
    try {
      const [s, c] = await Promise.all([
        readBaton(projectPath),
        readRelayChain(projectPath),
      ]);
      setState(s);
      setChain(c);
    } catch (e) {
      setErr(String(e));
    }
  }, [projectPath, readBaton, readRelayChain]);

  useEffect(() => {
    void reload();
    void refreshTeamMembers();
  }, [reload, refreshTeamMembers]);

  const nameOf = (id?: string | null, kind?: string | null) => {
    if (!id) return "未知";
    // agent 的标识不在成员表里，查不到就原样显示，宁可难看也不丢信息。
    if (kind === "agent") return id;
    return teamMembers.find((m) => m.id === id)?.name ?? id;
  };

  const act = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    setErr(null);
    try {
      await fn();
      await reload();
    } catch (e) {
      setErr(String(e));
      // 失败通常意味着本地看到的状态已经不对了，强制重取。
      await reload();
    } finally {
      setBusy(false);
    }
  };

  const baton: Baton | null = state?.baton ?? null;
  const claimable = !baton || state?.expired;
  const candidates = teamMembers.filter((m) => m.status === "active");

  return (
    <div className="rounded-lg border border-black/5 bg-white/70 p-3">
      <div className="flex items-center gap-2">
        {claimable ? (
          <Hand size={14} className="shrink-0 text-gray-400" />
        ) : baton?.kind === "agent" ? (
          <Bot size={14} className="shrink-0 text-accent-text" />
        ) : (
          <User size={14} className="shrink-0 text-accent-text" />
        )}
        <span className="text-xs font-medium text-gray-900">
          {!baton
            ? "暂无人推进"
            : state?.expired
              ? `${nameOf(baton.holder, baton.kind)} 的棒已超时`
              : `${nameOf(baton.holder, baton.kind)} 正在推进`}
        </span>
        {baton && !state?.expired && (
          <span className="text-[11px] text-gray-400">
            {remaining(baton.expires_at)}
          </span>
        )}
        <div className="ml-auto flex items-center gap-1.5">
          <button
            title="刷新接力棒状态"
            onClick={() => void reload()}
            className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 transition hover:bg-black/5"
          >
            <RefreshCw size={13} />
          </button>
          {claimable ? (
            <button
              disabled={busy}
              onClick={() => void act(() => claimBaton(projectPath))}
              className="flex h-7 items-center gap-1 rounded-md border border-accent-border/70 bg-accent-soft/80 px-2 text-[11px] font-medium text-accent-text transition hover:bg-accent-soft disabled:opacity-50"
            >
              <Hand size={12} />
              接手
            </button>
          ) : (
            <>
              {candidates.length > 0 && (
                <select
                  value={handoffTo}
                  disabled={busy}
                  onChange={(e) => {
                    const to = e.target.value;
                    setHandoffTo("");
                    if (to) void act(() => handoffBaton(projectPath, to));
                  }}
                  className="h-7 rounded-md border border-black/10 bg-white px-1.5 text-[11px] text-gray-600"
                >
                  <option value="">递给…</option>
                  {candidates.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              )}
              <button
                disabled={busy}
                onClick={() => void act(() => releaseBaton(projectPath))}
                className="flex h-7 items-center gap-1 rounded-md border border-black/10 px-2 text-[11px] text-gray-600 transition hover:bg-black/5 disabled:opacity-50"
              >
                <LogOut size={12} />
                放下
              </button>
            </>
          )}
        </div>
      </div>

      {err && <p className="mt-2 text-[11px] text-orange-600">{err}</p>}

      {chain.length > 0 && (
        <div className="mt-2 border-t border-black/5 pt-2">
          <button
            onClick={() => setShowChain((v) => !v)}
            className="text-[11px] text-gray-400 transition hover:text-gray-600"
          >
            接力链 {chain.length} 条 {showChain ? "▾" : "▸"}
          </button>
          {showChain && (
            <ul className="mt-1.5 space-y-1.5">
              {[...chain].reverse().map((e, i) => (
                <li key={`${e.at}-${i}`} className="flex gap-2 text-[11px]">
                  <span className="shrink-0 text-gray-400">
                    {e.action === "handoff" ? (
                      <Send size={11} />
                    ) : e.action === "expire" ? (
                      <TimerOff size={11} />
                    ) : e.action === "release" ? (
                      <LogOut size={11} />
                    ) : (
                      <Hand size={11} />
                    )}
                  </span>
                  <div className="min-w-0">
                    <p className="text-gray-700">
                      {e.action === "claim" && `${nameOf(e.to ?? e.by, e.kind)} 接手`}
                      {e.action === "handoff" &&
                        `${nameOf(e.from, e.kind)} 递给 ${nameOf(e.to, e.kind)}`}
                      {e.action === "release" && `${nameOf(e.from, e.kind)} 放下`}
                      {e.action === "expire" &&
                        `${nameOf(e.from, e.kind)} 超时未推进`}
                    </p>
                    <p className="text-gray-400">
                      {formatAt(e.at)}
                      {/* by 与 from 不一致说明是管理员代操作（强收），要显式点出来 */}
                      {e.action === "release" && e.from && e.from !== e.by
                        ? ` · 由 ${nameOf(e.by)} 操作`
                        : ""}
                    </p>
                    {e.note?.trim() && (
                      <p className="mt-0.5 whitespace-pre-wrap text-gray-600">
                        {e.note}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
