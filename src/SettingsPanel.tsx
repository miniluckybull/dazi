import { useEffect, useRef, useState } from "react";
import { X, Sparkles } from "lucide-react";
import { ask, message } from "@tauri-apps/plugin-dialog";
import { useApp } from "./store";

type Tab = "profile" | "patterns";

export function SettingsPanel({ onClose }: { onClose: () => void }) {
  const readProfile = useApp((s) => s.readProfile);
  const writeProfile = useApp((s) => s.writeProfile);
  const readPatterns = useApp((s) => s.readPatterns);
  const writePatterns = useApp((s) => s.writePatterns);
  const synthesizePatterns = useApp((s) => s.synthesizePatterns);

  const [tab, setTab] = useState<Tab>("profile");
  const [profile, setProfile] = useState("");
  const [patterns, setPatterns] = useState("");
  const [profileDirty, setProfileDirty] = useState(false);
  const [patternsDirty, setPatternsDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [synthesizing, setSynthesizing] = useState(false);
  const profileTimer = useRef<number | null>(null);
  const patternsTimer = useRef<number | null>(null);

  useEffect(() => {
    readProfile()
      .then((v) => setProfile(v))
      .catch(() => {});
    readPatterns()
      .then((v) => setPatterns(v))
      .catch(() => {});
  }, [readProfile, readPatterns]);

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

  const dirty = profileDirty || patternsDirty;

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
        </div>
        <div className="flex-1 overflow-hidden p-4">
          {tab === "profile" ? (
            <div className="flex h-full flex-col gap-2">
              <p className="text-[11px] leading-relaxed text-gray-500">
                描述你是谁、工作偏好、协作风格、口头禅。Claude
                每次会话都会读取，并在发现新观察时增量补充。
              </p>
              <textarea
                value={profile}
                onChange={(e) => {
                  setProfile(e.target.value);
                  setProfileDirty(true);
                }}
                placeholder={`# 关于我\n\n- 角色: \n- 技术栈: \n- 工作偏好: \n- 沟通风格: `}
                className="flex-1 resize-none rounded-md border border-white/60 bg-white/80 p-3 font-mono text-[13px] leading-relaxed text-gray-800 outline-none transition focus:border-indigo-300 focus:bg-white"
              />
            </div>
          ) : (
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
                      : "bg-indigo-600/90 text-white shadow-sm shadow-indigo-500/20 hover:bg-indigo-600"
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
                className="flex-1 resize-none rounded-md border border-white/60 bg-white/80 p-3 font-mono text-[13px] leading-relaxed text-gray-800 outline-none transition focus:border-indigo-300 focus:bg-white"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
