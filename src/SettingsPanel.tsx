import { useEffect, useRef, useState } from "react";
import { X, Sparkles, Terminal } from "lucide-react";
import { ask, message } from "@tauri-apps/plugin-dialog";
import { useApp } from "./store";

type Tab = "profile" | "facts" | "patterns" | "backend";

export function SettingsPanel({ onClose }: { onClose: () => void }) {
  const readProfile = useApp((s) => s.readProfile);
  const writeProfile = useApp((s) => s.writeProfile);
  const readPatterns = useApp((s) => s.readPatterns);
  const writePatterns = useApp((s) => s.writePatterns);
  const readFacts = useApp((s) => s.readFacts);
  const writeFacts = useApp((s) => s.writeFacts);
  const synthesizePatterns = useApp((s) => s.synthesizePatterns);

  const [tab, setTab] = useState<Tab>("profile");
  const [profile, setProfile] = useState("");
  const [patterns, setPatterns] = useState("");
  const [facts, setFacts] = useState("");
  const [profileDirty, setProfileDirty] = useState(false);
  const [patternsDirty, setPatternsDirty] = useState(false);
  const [factsDirty, setFactsDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [synthesizing, setSynthesizing] = useState(false);
  const profileTimer = useRef<number | null>(null);
  const patternsTimer = useRef<number | null>(null);
  const factsTimer = useRef<number | null>(null);

  useEffect(() => {
    readProfile()
      .then((v) => setProfile(v))
      .catch(() => {});
    readPatterns()
      .then((v) => setPatterns(v))
      .catch(() => {});
    readFacts()
      .then((v) => setFacts(v))
      .catch(() => {});
  }, [readProfile, readPatterns, readFacts]);

  useEffect(() => {
    if (!profileDirty) return;
    if (profileTimer.current) window.clearTimeout(profileTimer.current);
    profileTimer.current = window.setTimeout(async () => {
      setSaving(true);
      try {
        await writeProfile(profile);
        setProfileDirty(false);
      } finally {
        setSaving(false);
      }
    }, 600);
    return () => {
      if (profileTimer.current) window.clearTimeout(profileTimer.current);
    };
  }, [profile, profileDirty, writeProfile]);

  useEffect(() => {
    if (!patternsDirty) return;
    if (patternsTimer.current) window.clearTimeout(patternsTimer.current);
    patternsTimer.current = window.setTimeout(async () => {
      setSaving(true);
      try {
        await writePatterns(patterns);
        setPatternsDirty(false);
      } finally {
        setSaving(false);
      }
    }, 600);
    return () => {
      if (patternsTimer.current) window.clearTimeout(patternsTimer.current);
    };
  }, [patterns, patternsDirty, writePatterns]);

  useEffect(() => {
    if (!factsDirty) return;
    if (factsTimer.current) window.clearTimeout(factsTimer.current);
    factsTimer.current = window.setTimeout(async () => {
      setSaving(true);
      try {
        await writeFacts(facts);
        setFactsDirty(false);
      } finally {
        setSaving(false);
      }
    }, 600);
    return () => {
      if (factsTimer.current) window.clearTimeout(factsTimer.current);
    };
  }, [facts, factsDirty, writeFacts]);

  const dirty = profileDirty || patternsDirty || factsDirty;

  async function runSynthesize() {
    if (synthesizing) return;
    const ok = await ask(
      `复盘会读取所有项目的 .dazi/journal.md，启动一次 Claude 会话来归纳跨项目模式，写入 ~/.dazi/patterns.md。\n\n会在终端中开启新的窗口，确认继续？`,
      { title: "复盘画像", kind: "info", okLabel: "开始复盘", cancelLabel: "取消" }
    );
    if (!ok) return;
    setSynthesizing(true);
    try {
      await synthesizePatterns();
    } catch (e: any) {
      await message(String(e), { title: "复盘失败", kind: "error" });
    } finally {
      setSynthesizing(false);
    }
  }

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/20 backdrop-blur-sm">
      <div className="flex h-[80vh] w-[min(720px,90vw)] flex-col overflow-hidden rounded-2xl border border-white/70 bg-white/85 shadow-glass-lg backdrop-blur-xl">
        <header className="flex items-center justify-between border-b border-white/60 px-5 py-3">
          <div>
            <h2 className="text-base font-semibold text-gray-900">我的记忆</h2>
            <p className="text-[11px] text-gray-500">
              这些内容会在每次启动 dazi 时注入到 Claude，会话结束 Claude 会自动增量回写。
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-gray-400">
              {saving ? "保存中…" : dirty ? "未保存" : "已保存"}
            </span>
            <button
              onClick={onClose}
              className="flex h-7 w-7 items-center justify-center rounded-md border border-white/60 bg-white/70 text-gray-600 transition hover:bg-white"
            >
              <X size={15} />
            </button>
          </div>
        </header>
        <div className="flex border-b border-white/60 text-xs">
          <button
            onClick={() => setTab("profile")}
            className={`flex-1 py-2 transition ${
              tab === "profile"
                ? "bg-white/70 font-medium text-gray-800"
                : "text-gray-500 hover:bg-white/40"
            }`}
          >
            用户画像
            <span className="ml-1.5 text-[10px] text-gray-400">
              ~/.dazi/profile.md
            </span>
          </button>
          <button
            onClick={() => setTab("facts")}
            className={`flex-1 py-2 transition ${
              tab === "facts"
                ? "bg-white/70 font-medium text-gray-800"
                : "text-gray-500 hover:bg-white/40"
            }`}
          >
            世界事实
            <span className="ml-1.5 text-[10px] text-gray-400">
              ~/.dazi/facts.md
            </span>
          </button>
          <button
            onClick={() => setTab("patterns")}
            className={`flex-1 py-2 transition ${
              tab === "patterns"
                ? "bg-white/70 font-medium text-gray-800"
                : "text-gray-500 hover:bg-white/40"
            }`}
          >
            跨项目模式
            <span className="ml-1.5 text-[10px] text-gray-400">
              ~/.dazi/patterns.md
            </span>
          </button>
          <button
            onClick={() => setTab("backend")}
            className={`flex-1 py-2 transition ${
              tab === "backend"
                ? "bg-white/70 font-medium text-gray-800"
                : "text-gray-500 hover:bg-white/40"
            }`}
          >
            <Terminal size={11} className="mr-1 inline-block align-middle" />
            CLI 后端
            <span className="ml-1.5 text-[10px] text-gray-400">
              ~/.dazi/config.json
            </span>
          </button>
        </div>
        <div className="flex-1 overflow-hidden p-4">
          {tab === "profile" ? (
            <div className="flex h-full flex-col gap-2">
              <p className="text-[11px] leading-relaxed text-gray-500">
                描述你是谁、工作偏好、协作风格、口头禅。Claude
                每次会话都会读取,并在发现新观察时增量补充。
              </p>
              <textarea
                value={profile}
                onChange={(e) => {
                  setProfile(e.target.value);
                  setProfileDirty(true);
                }}
                placeholder={`# 关于我\n\n- 角色: \n- 技术栈: \n- 工作偏好: \n- 沟通风格: `}
                className="flex-1 resize-none rounded-md border border-white/60 bg-white/80 p-3 font-mono text-[13px] leading-relaxed text-gray-800 outline-none transition focus:border-accent-border focus:bg-white"
              />
            </div>
          ) : tab === "facts" ? (
            <div className="flex h-full flex-col gap-2">
              <p className="text-[11px] leading-relaxed text-gray-500">
                你世界里长期存在的实体:服务器、设备、人、账号、常用路径……不属于任一项目,但任一项目都可能用到。Claude 会自动把跨项目都用得上的事实回写到这里。
              </p>
              <textarea
                value={facts}
                onChange={(e) => {
                  setFacts(e.target.value);
                  setFactsDirty(true);
                }}
                placeholder={`# 我的世界\n\n## 基础设施\n- 大龙: 4090 服务器, ssh ...\n\n## 设备\n- ...\n\n## 常用账号 / 路径\n- ...`}
                className="flex-1 resize-none rounded-md border border-white/60 bg-white/80 p-3 font-mono text-[13px] leading-relaxed text-gray-800 outline-none transition focus:border-accent-border focus:bg-white"
              />
            </div>
          ) : tab === "patterns" ? (
            <div className="flex h-full flex-col gap-2">
              <div className="flex items-start justify-between gap-3">
                <p className="text-[11px] leading-relaxed text-gray-500">
                  跨项目反复出现的模式与纠正点。可手编，也可让 Claude 读取所有项目日志后归纳。
                </p>
                <button
                  onClick={runSynthesize}
                  disabled={synthesizing}
                  className={`flex shrink-0 items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-medium transition ${
                    synthesizing
                      ? "cursor-not-allowed bg-white/60 text-gray-400"
                      : "bg-accent/90 text-on-accent shadow-sm shadow-accent/20 hover:bg-accent"
                  }`}
                >
                  <Sparkles size={12} />
                  {synthesizing ? "复盘中…" : "复盘画像"}
                </button>
              </div>
              <textarea
                value={patterns}
                onChange={(e) => {
                  setPatterns(e.target.value);
                  setPatternsDirty(true);
                }}
                placeholder={`# 跨项目模式\n\n- 反复观察到的偏好...\n- 多次纠正过的方向...`}
                className="flex-1 resize-none rounded-md border border-white/60 bg-white/80 p-3 font-mono text-[13px] leading-relaxed text-gray-800 outline-none transition focus:border-accent-border focus:bg-white"
              />
            </div>
          ) : tab === "backend" ? (
            <BackendTab />
          ) : null}
        </div>
      </div>
    </div>
  );
}

/** CLI 后端选择面板（反馈 #14）：列出已注册后端 + 探活 + 切换。 */
function BackendTab() {
  const backend = useApp((s) => s.backend);
  const backendList = useApp((s) => s.backendList);
  const setBackend = useApp((s) => s.setBackend);
  const loadBackend = useApp((s) => s.loadBackend);
  const [refreshing, setRefreshing] = useState(false);

  async function refresh() {
    setRefreshing(true);
    try {
      await loadBackend();
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <div className="flex h-full flex-col gap-3 overflow-y-auto">
      <p className="text-[11px] leading-relaxed text-gray-500">
        切换 dazi 调用的 CLI 工具。当前已注册 {backendList.length} 个后端，
        选择后会影响 handoff / autopilot / 复盘 / 提炼 skill 等所有调用路径，
        持久化到 <code className="rounded bg-white/70 px-1">~/.dazi/config.json</code>。
      </p>
      <div className="flex justify-end">
        <button
          onClick={refresh}
          disabled={refreshing}
          className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition ${
            refreshing
              ? "cursor-not-allowed bg-white/60 text-gray-400"
              : "bg-accent/90 text-on-accent shadow-sm shadow-accent/20 hover:bg-accent"
          }`}
        >
          {refreshing ? "检测中…" : "重新探活"}
        </button>
      </div>
      <div className="flex flex-col gap-2">
        {backendList.length === 0 && (
          <p className="text-xs text-gray-400">暂无后端，启动时自动检测。</p>
        )}
        {backendList.map((b) => {
          const active = backend === b.name;
          const available = b.version !== null;
          return (
            <button
              key={b.name}
              onClick={() => setBackend(b.name)}
              disabled={!available}
              className={`flex items-start gap-3 rounded-lg border p-3 text-left transition ${
                active
                  ? "border-accent bg-accent-soft/60"
                  : "border-white/70 bg-white/70 hover:bg-white/90"
              } ${!available ? "opacity-60" : ""}`}
            >
              <div
                className={`mt-0.5 h-4 w-4 shrink-0 rounded-full border-2 transition ${
                  active
                    ? "border-accent bg-accent"
                    : "border-gray-300 bg-white"
                }`}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-900">
                    {b.name}
                  </span>
                  {active && (
                    <span className="rounded bg-accent/90 px-1.5 py-0.5 text-[10px] font-medium text-on-accent">
                      当前
                    </span>
                  )}
                  {!available && (
                    <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500">
                      未安装
                    </span>
                  )}
                  {b.supports_permission_mode && (
                    <span
                      title="支持 --permission-mode，代理模式开关可用"
                      className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] text-amber-600"
                    >
                      perm-mode
                    </span>
                  )}
                </div>
                <div className="mt-0.5 truncate font-mono text-[11px] text-gray-500">
                  {b.bin}
                </div>
                <div className="mt-0.5 text-[11px] text-gray-500">
                  版本: {b.version ?? "—"}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
