import { useEffect, useState } from "react";
import { Sparkles, X } from "lucide-react";
import { ProjectSummary, useApp } from "./store";

/** 任务级技能注入：勾选 ~/.claude/skills/ 中的 skill，
 *  交接/自动执行时写入 prompt 强制使用（比 Claude Code 自动发现更确定）。 */
export function SkillPickerModal({
  project,
  open,
  onClose,
}: {
  project: ProjectSummary;
  open: boolean;
  onClose: () => void;
}) {
  const readMeta = useApp((s) => s.readMeta);
  const updateMeta = useApp((s) => s.updateMeta);
  const skills = useApp((s) => s.skills);
  const refreshSkills = useApp((s) => s.refreshSkills);

  const [selected, setSelected] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    refreshSkills();
    readMeta(project.path)
      .then((m) => {
        if (!cancelled) setSelected(m.skills ?? []);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [open, project.slug, project.path, readMeta, refreshSkills]);

  function toggle(slug: string) {
    setSelected((cur) =>
      cur.includes(slug) ? cur.filter((s) => s !== slug) : [...cur, slug]
    );
  }

  async function save() {
    setSaving(true);
    try {
      await updateMeta(project.path, { skills: selected });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

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
          <h2 className="flex items-center gap-1.5 text-sm font-semibold text-gray-800">
            <Sparkles size={14} className="text-accent" />
            注入技能
          </h2>
          <button
            onClick={onClose}
            className="flex h-6 w-6 items-center justify-center rounded-md text-gray-400 hover:bg-white hover:text-gray-700"
          >
            <X size={14} />
          </button>
        </div>

        {skills.length === 0 ? (
          <p className="py-6 text-center text-xs text-gray-400">
            还没有可用技能，归档任务后点「提炼为 skill」沉淀经验
          </p>
        ) : (
          <div className="max-h-72 space-y-1 overflow-y-auto">
            {skills.map((sk) => {
              const on = selected.includes(sk.slug);
              return (
                <label
                  key={sk.slug}
                  className={`flex cursor-pointer items-start gap-2 rounded-md border px-3 py-2 transition ${
                    on
                      ? "border-accent/70 bg-accent-soft"
                      : "border-white/70 bg-white/70 hover:bg-white"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={on}
                    onChange={() => toggle(sk.slug)}
                    className="mt-0.5 accent-accent"
                  />
                  <span className="min-w-0">
                    <span
                      className={`block truncate text-xs font-medium ${
                        on ? "text-accent-text" : "text-gray-800"
                      }`}
                    >
                      {sk.slug}
                    </span>
                    {sk.description && (
                      <span className="mt-0.5 block text-[11px] leading-snug text-gray-500">
                        {sk.description}
                      </span>
                    )}
                  </span>
                </label>
              );
            })}
          </div>
        )}

        <p className="mt-3 text-[11px] leading-snug text-gray-400">
          勾选的技能会在启动协作/自动执行时写入 prompt 强制使用；未勾选时
          Claude 仍可能按技能描述自动发现调用。
        </p>

        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-md border border-white/70 bg-white/70 px-3 py-1.5 text-xs text-gray-700 transition hover:bg-white"
          >
            取消
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="rounded-md bg-accent/90 px-3 py-1.5 text-xs font-medium text-on-accent shadow-sm shadow-accent/20 transition hover:bg-accent disabled:opacity-50"
          >
            {saving ? "保存中…" : `保存（已选 ${selected.length}）`}
          </button>
        </div>
      </div>
    </div>
  );
}
