import { useEffect, useState } from "react";
import { ask } from "@tauri-apps/plugin-dialog";
import { Copy, FolderOpen, Sparkles, Trash2, Undo2 } from "lucide-react";
import { useApp } from "./store";

/** 技能详情：预览 SKILL.md + 操作（Finder 显示 / 复制导出 / 删除 / 来源任务）。 */
export function SkillDetail() {
  const skills = useApp((s) => s.skills);
  const selectedSkillSlug = useApp((s) => s.selectedSkillSlug);
  const readSkill = useApp((s) => s.readSkill);
  const deleteSkill = useApp((s) => s.deleteSkill);
  const refreshSkills = useApp((s) => s.refreshSkills);
  const selectSkill = useApp((s) => s.selectSkill);
  const revealInFinder = useApp((s) => s.revealInFinder);
  const projects = useApp((s) => s.projects);
  const archived = useApp((s) => s.archived);
  const setShowSkills = useApp((s) => s.setShowSkills);
  const setShowArchived = useApp((s) => s.setShowArchived);
  const selectProject = useApp((s) => s.selectProject);

  const skill = skills.find((s) => s.slug === selectedSkillSlug) ?? null;
  const [content, setContent] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setContent(null);
    setCopied(false);
    if (!skill) return;
    readSkill(skill.slug)
      .then(setContent)
      .catch(() => setContent(null));
  }, [skill?.slug, readSkill]);

  if (!skill) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center text-sm text-gray-400">
          <Sparkles size={28} className="mx-auto mb-3 text-gray-300" />
          {skills.length === 0
            ? "还没有技能，归档任务后点「提炼为 skill」沉淀经验"
            : "从左侧选择一个技能查看"}
        </div>
      </div>
    );
  }

  // 来源任务：skill slug 与任务 slug 相同（提炼时一一对应）
  const source =
    projects.find((p) => p.slug === skill.slug) ??
    archived.find((p) => p.slug === skill.slug) ??
    null;

  async function remove() {
    const ok = await ask(
      `删除技能「${skill!.slug}」？\n会移除 ~/.claude/skills/${skill!.slug}/ 整个目录。`,
      { title: "删除技能", kind: "warning", okLabel: "删除", cancelLabel: "取消" }
    );
    if (!ok) return;
    await deleteSkill(skill!.slug);
    selectSkill(null);
    await refreshSkills();
  }

  async function copy() {
    if (!content) return;
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function openSource() {
    if (!source) return;
    setShowSkills(false);
    setShowArchived(source.archived);
    selectProject(source.slug);
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/60 px-5 py-3">
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold text-gray-800">
            {skill.slug}
          </h2>
          {skill.description && (
            <p className="mt-0.5 truncate text-[11px] text-gray-500">
              {skill.description}
            </p>
          )}
        </div>
        <div className="ml-3 flex shrink-0 items-center gap-1.5">
          {source && (
            <button
              onClick={openSource}
              title={`跳转到来源任务「${source.name}」`}
              className="flex h-7 items-center gap-1 rounded-md border border-white/60 bg-white/70 px-2 text-[11px] text-gray-600 transition hover:bg-white hover:text-gray-900"
            >
              <Undo2 size={12} />
              来源任务
            </button>
          )}
          <button
            onClick={() => revealInFinder(skill.path)}
            title="在 Finder 中显示（分享时把 SKILL.md 发给对方即可）"
            className="flex h-7 w-7 items-center justify-center rounded-md border border-white/60 bg-white/70 text-gray-600 transition hover:bg-white hover:text-gray-900"
          >
            <FolderOpen size={13} />
          </button>
          <button
            onClick={copy}
            title="复制 SKILL.md 全文"
            className="flex h-7 items-center gap-1 rounded-md border border-white/60 bg-white/70 px-2 text-[11px] text-gray-600 transition hover:bg-white hover:text-gray-900"
          >
            <Copy size={12} />
            {copied ? "已复制" : "复制"}
          </button>
          <button
            onClick={remove}
            title="删除技能"
            className="flex h-7 w-7 items-center justify-center rounded-md border border-white/60 bg-white/70 text-gray-500 transition hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {content === null ? (
          <p className="text-sm text-gray-400">加载中…</p>
        ) : (
          <pre className="whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-gray-700">
            {content}
          </pre>
        )}
      </div>
    </div>
  );
}
