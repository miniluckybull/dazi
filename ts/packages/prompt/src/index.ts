/**
 * prompt 拼装 —— 上下文段落 + 尾部任务指令。
 *
 * 行为对齐 Rust `crates/dazi-core/src/prompt.rs`。**这份上下文本身就是交接包**：
 * 人→人 与 人→agent 复用同一份产物，团队版的接力棒递交不需要另造格式。
 *
 * 四种 prompt 共用 {@link buildContextSections}，区别只在尾部任务指令：
 *  - {@link buildHandoffPrompt}     交给用户实时协作（含记忆回写约定）
 *  - {@link buildHandoffPlanPrompt} 桌面「先出计划」（只读）
 *  - {@link buildPlanPrompt}        手机审批用的计划（只读）
 *  - {@link buildAutopilotPrompt}   无人值守执行（含记忆回写约定）
 */
import * as fs from 'node:fs/promises'
import * as path from 'node:path'

import { readGlobal, readProject, tailJournal } from '@dazi/memory'
import { type ProjectMeta, parseMeta } from '@dazi/workspace'

/** 兄弟项目索引最多列出的条数。 */
const SIBLING_LIMIT = 40
/** 兄弟项目摘要截断长度（字符数，非字节——Rust 用 chars().take(80)）。 */
const SIBLING_SUMMARY_CHARS = 80
/** journal 注入段数。 */
const JOURNAL_TAIL_SECTIONS = 5

/** 依赖注入：skill 是否存在。默认查 ~/.claude/skills/<slug>/SKILL.md。 */
export interface PromptDeps {
  skillExists?: (slug: string) => Promise<boolean>
}

const exists = (p: string) =>
  fs
    .access(p)
    .then(() => true)
    .catch(() => false)

async function defaultSkillExists(slug: string): Promise<boolean> {
  const home = process.env.HOME ?? process.env.USERPROFILE
  if (!home) return false
  return exists(path.join(home, '.claude', 'skills', slug, 'SKILL.md'))
}

/** 取首个非空、非 `#` 开头的行（对齐 Rust first_non_empty_line）。 */
function firstNonEmptyLine(text: string): string | undefined {
  for (const line of text.split('\n')) {
    const t = line.trim()
    if (t !== '' && !t.startsWith('#')) return t
  }
  return undefined
}

/**
 * 取首个段落，跳过标题行，多行以空格连接（对齐 Rust first_paragraph）。
 * 遇到空行且已有内容则结束。
 */
function firstParagraph(text: string): string | undefined {
  let buf = ''
  for (const line of text.split('\n')) {
    const t = line.trim()
    if (t === '') {
      if (buf !== '') break
      continue
    }
    if (t.startsWith('#')) continue
    if (buf !== '') buf += ' '
    buf += t
  }
  return buf === '' ? undefined : buf
}

async function readMetaOrUndefined(projectPath: string): Promise<ProjectMeta | undefined> {
  try {
    return parseMeta(await fs.readFile(path.join(projectPath, 'meta.yml'), 'utf8'))
  } catch {
    return undefined
  }
}

async function readReadme(projectPath: string): Promise<string> {
  return fs.readFile(path.join(projectPath, 'README.md'), 'utf8').catch(() => '')
}

/** references/ 下的条目名（跳过隐藏文件，按小写名排序，目录名加 `/`）。 */
async function listReferenceNames(projectPath: string): Promise<string[]> {
  const dir = path.join(projectPath, 'references')
  const entries = await fs.readdir(dir, { withFileTypes: true }).catch(() => [])
  return entries
    .filter((e) => !e.name.startsWith('.'))
    .sort((a, b) => (a.name.toLowerCase() < b.name.toLowerCase() ? -1 : a.name.toLowerCase() > b.name.toLowerCase() ? 1 : 0))
    .map((e) => (e.isDirectory() ? `${e.name}/` : e.name))
}

/** 兄弟项目摘要：优先 context.md 首段，退到 README 首行，再退到项目名。 */
async function summarizeSibling(
  projectPath: string,
): Promise<{ name: string; summary: string } | undefined> {
  const meta = await readMetaOrUndefined(projectPath)
  if (!meta) return undefined

  const context = await readProject(projectPath, 'context.md').catch(() => '')
  const fromContext = firstParagraph(context)
  if (fromContext) return { name: meta.name, summary: fromContext }

  const fromReadme = firstNonEmptyLine(await readReadme(projectPath))
  if (fromReadme) return { name: meta.name, summary: fromReadme }

  return { name: meta.name, summary: meta.name }
}

/**
 * 兄弟项目索引 —— dazi 既有的跨项目知识机制。扫 workspace 的 projects/ 与
 * archive/，让 agent 知道「另一个任务里说过的事」该去哪找。
 */
async function buildSiblingIndex(projectPath: string): Promise<string> {
  const parent = path.dirname(projectPath)
  const workspace = path.dirname(parent)
  if (!workspace || workspace === parent) return ''

  const found: { name: string; summary: string; path: string }[] = []
  for (const sub of ['projects', 'archive']) {
    const dir = path.join(workspace, sub)
    const entries = await fs.readdir(dir, { withFileTypes: true }).catch(() => [])
    for (const e of entries) {
      const p = path.join(dir, e.name)
      // lstat 判目录会把 create_project_from_path 的软链项目漏掉，故用 stat 跟随软链
      const isDir = await fs
        .stat(p)
        .then((s) => s.isDirectory())
        .catch(() => false)
      if (!isDir || p === projectPath) continue
      const s = await summarizeSibling(p)
      if (s) found.push({ ...s, path: p })
    }
  }
  if (found.length === 0) return ''

  found.sort((a, b) => {
    const x = a.name.toLowerCase()
    const y = b.name.toLowerCase()
    return x < y ? -1 : x > y ? 1 : 0
  })

  const lines = [
    '## 兄弟项目索引',
    '当用户提到"另一个任务里说过的事"或暗示跨项目知识时,先在以下索引中扫一眼,必要时用 Read 工具读取对应项目的 context.md / README.md 获取细节:',
  ]
  for (const { name, summary, path: p } of found.slice(0, SIBLING_LIMIT)) {
    lines.push(`- ${name} (${p}): ${[...summary].slice(0, SIBLING_SUMMARY_CHARS).join('')}`)
  }
  return lines.join('\n')
}

/**
 * 拼装注入给 agent 的上下文段落：项目资料 + 全局记忆 + 兄弟索引 + 本项目
 * 进展/日志 + 指定技能。**这就是交接包。**
 *
 * @param projectPath 项目根目录（绝对路径，会原样出现在 prompt 里）
 * @param deps 可注入 skillExists 便于测试
 */
export async function buildContextSections(
  projectPath: string,
  deps: PromptDeps = {},
): Promise<string[]> {
  const abs = projectPath
  const refs = await listReferenceNames(projectPath)
  const refsSection =
    refs.length === 0
      ? `## 项目\n根目录：${abs}\n请阅读 README.md 了解项目背景与目标；当前 references/ 目录为空，如果信息不足请直接说明。`
      : `## 项目\n根目录：${abs}\n请阅读 README.md 与 references/ 下的资料（${refs.join('、')}），理解项目背景与目标。`

  const [profile, patterns, facts, context, journalTail, siblingIndex] = await Promise.all([
    readGlobal('profile.md').catch(() => ''),
    readGlobal('patterns.md').catch(() => ''),
    readGlobal('facts.md').catch(() => ''),
    readProject(projectPath, 'context.md').catch(() => ''),
    tailJournal(projectPath, JOURNAL_TAIL_SECTIONS).catch(() => ''),
    buildSiblingIndex(projectPath),
  ])

  const sections: string[] = [refsSection]

  if (profile.trim() !== '') {
    sections.push(`## 用户画像（来自 ~/.dazi/profile.md）\n${profile.trim()}`)
  }
  if (facts.trim() !== '') {
    sections.push(
      `## 用户世界事实（来自 ~/.dazi/facts.md）\n这里记录用户长期持有的实体与基础设施（服务器、设备、协作者、账号、关键链接等）。被问到"我那台服务器/那个设备/那个人是谁"时,先查这里:\n${facts.trim()}`,
    )
  }
  if (patterns.trim() !== '') {
    sections.push(`## 跨项目模式（来自 ~/.dazi/patterns.md）\n${patterns.trim()}`)
  }
  if (siblingIndex.trim() !== '') {
    sections.push(siblingIndex)
  }
  if (context.trim() !== '') {
    sections.push(`## 本项目当前进展（来自 .dazi/context.md）\n${context.trim()}`)
  }
  if (journalTail.trim() !== '') {
    sections.push(
      `## 本项目最近协作日志（来自 .dazi/journal.md，最近 ${JOURNAL_TAIL_SECTIONS} 段）\n${journalTail.trim()}`,
    )
  }

  // 任务级指定 skill：用户勾选后强制注入（比 agent 自动发现更确定）；
  // 已不存在的 skill 静默跳过。
  const meta = await readMetaOrUndefined(projectPath)
  if (meta) {
    const skillExists = deps.skillExists ?? defaultSkillExists
    const available: string[] = []
    for (const s of meta.skills) if (await skillExists(s)) available.push(s)
    if (available.length > 0) {
      sections.push(
        [
          '## 指定技能（用户要求本任务必须使用）',
          '以下 skill 已安装在 ~/.claude/skills/，请用 Skill 工具逐个调用（或先 Read 对应 SKILL.md），并严格遵循其中的流程、步骤与易踩的坑：',
          ...available.map((s) => `- ${s}`),
        ].join('\n'),
      )
    }
  }

  return sections
}

/** 记忆回写约定（handoff 与 autopilot 共用）。 */
export function writebackConvention(abs: string): string {
  return `## 记忆回写约定（重要）
会话结束前按以下「分诊器」决定每条新信息写到哪个文件，仅写下列文件，不要改动 meta.yml/README.md/references：
- 用户长期持有的「实体」(服务器、设备、SSH/账号、协作者、关键链接、硬件) → Edit 「~/.dazi/facts.md」 增量补充；用户说「记住」「以后这台机器叫…」时一律写这里。
- 用户的「偏好/工作风格」稳定观察(沟通方式、技术口味、不喜欢什么) → Edit 「~/.dazi/profile.md」 增量补充。
- 跨项目反复出现的「做事模式」(至少出现 2 次的协作纠正/打法) → 由复盘流程统一归纳到 「~/.dazi/patterns.md」，**单次会话不要主动改它**。
- 本项目「当前进展快照」 → Write 覆写 「${abs}/.dazi/context.md」(一句话目标 + 进行中 + 下一步 + 已完成要点)。
- 本项目「这次会话讨论/决定/待办」流水 → Edit 在 「${abs}/.dazi/journal.md」 末尾追加：
## YYYY-MM-DD HH:MM
- 讨论了 …
- 决定 …
- 待办 …

判断要点：信息「跟着用户走」(下个项目还要用) 写 facts/profile；信息「跟着这个项目走」写 context/journal。拿不准时优先写 facts，宁可全局也别困在某个项目里。

写入失败处理：若 Edit/Write 「${abs}/.dazi/context.md」时报 "Error writing file"，通常是 .dazi/ 目录缺失，先用 Bash 执行 \`mkdir -p ${abs}/.dazi\` 再重试一次；仍失败则在 journal.md 末尾记下待确认，不要静默丢弃。`
}

/** 交接给用户实时协作用的 prompt：先总结理解，再提下一步。 */
export async function buildHandoffPrompt(projectPath: string, deps?: PromptDeps): Promise<string> {
  const sections = await buildContextSections(projectPath, deps)
  sections.push('## 任务\n先用一段话总结你对本项目的理解，再提出 3 个最有价值的下一步。')
  sections.push(writebackConvention(projectPath))
  return sections.join('\n\n')
}

/** 桌面「先出计划」用的交互式 plan prompt：只读探索、制定计划、不执行。 */
export async function buildHandoffPlanPrompt(
  projectPath: string,
  deps?: PromptDeps,
): Promise<string> {
  const sections = await buildContextSections(projectPath, deps)
  sections.push(
    `## 任务（计划模式）
你处于**计划模式**：只读探索、制定计划，不要执行任何写操作或命令（当前会话的权限设置也会阻止你改动文件）。请：
1. 依据 README.md 与上面的上下文，理解本项目的目标与现状。
2. 输出一份清晰的执行计划：要做哪些事、改哪些文件、跑什么命令、产出什么结果，按步骤列出，让用户一眼能判断是否放行。
3. 明确标注其中任何**破坏性或不可逆**的操作（删除、覆盖、对外发送、装卸依赖、动 git 历史等）与风险点。
4. 不要现在就执行——只输出计划。用户确认后会告诉你开始执行。`,
  )
  return sections.join('\n\n')
}

/** 手机审批用的计划 prompt：只产出计划，批准后才执行。 */
export async function buildPlanPrompt(projectPath: string, deps?: PromptDeps): Promise<string> {
  const sections = await buildContextSections(projectPath, deps)
  sections.push(
    `## 任务（计划模式 / 待人工审批）
你正在为本项目的既定任务**制定执行计划**，稍后会推送到用户手机等待批准，批准后才会真正执行。请：
1. 依据 README.md 与上面的上下文，判断此刻最该推进的既定任务。
2. 用清晰的条目列出你**打算执行的具体步骤**（要改哪些文件、跑什么命令、产出什么），让用户一眼能判断是否放心批准。
3. 明确标注其中任何**破坏性或不可逆**的操作（删除、覆盖、对外发送、装卸依赖、动 git 历史等）。
4. 不要现在就执行——只输出计划。这段计划就是你这次的结果。`,
  )
  return sections.join('\n\n')
}

/** 无人值守自动执行用的 prompt。 */
export async function buildAutopilotPrompt(
  projectPath: string,
  deps?: PromptDeps,
): Promise<string> {
  const sections = await buildContextSections(projectPath, deps)
  sections.push(
    `## 任务（自动执行模式）
你正在**无人值守**地自动执行本项目的既定任务，没有用户实时盯着，运行结束后用户才会看到结果。请：
1. 依据 README.md 与上面的上下文，判断本项目此刻最该推进的既定任务，并把它**实际推进到一个可交付/可检查的状态**（该写文件就写、该跑命令就跑）。
2. **破坏性或不可逆操作**（删除、覆盖重要文件、对外发送、安装/卸载、动 git 历史、改系统配置）以及**你拿不准是否符合用户意图**的决策：不要擅自执行，改为在 journal 里记下「待用户确认」并说明原因。
3. 只在本项目目录范围内操作，不要去动其它项目。
4. 最后用 2-4 句话总结：这次做了什么、产出在哪、有没有需要用户确认或接手的事项。这段总结就是你这次运行的结果。`,
  )
  sections.push(writebackConvention(projectPath))
  return sections.join('\n\n')
}
