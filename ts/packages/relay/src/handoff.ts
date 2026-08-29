/**
 * 交接包 = 既有上下文 + 接力链。
 *
 * `@dazi/prompt` 的 buildContextSections 已经是交接包（人→人与人→agent 复用
 * 同一份产物），这里只补上它缺的一块：**这根棒之前经过谁的手**。
 *
 * ## 为什么不直接改 buildContextSections
 *
 * 那个函数的输出有冻结的 golden（与 Rust 逐字节比对，是 S2 的验收闸门）。
 * 往里加 section 会让 golden 全部失效，也就把「TS 与 Rust 行为一致」这个
 * 唯一的回退保障拆了。故接力段在外层组合，Rust 侧行为不受影响。
 */
import { readRelayChain, type RelayEntry } from './baton.ts'

/** 注入接力链的最大条数。链会一直增长，但 prompt 不能无限长。 */
export const RELAY_TAIL_ENTRIES = 20

/** 把 member_id 显示成人名。查不到就退回原 id——宁可难看也不能丢信息。 */
export type NameResolver = (id: string) => string | undefined

const ACTION_LABEL: Record<RelayEntry['action'], string> = {
  claim: '接手',
  handoff: '递交',
  release: '放下',
  expire: '超时释放',
}

function describe(e: RelayEntry, name: NameResolver): string {
  const who = (id: string | null) => (id ? (name(id) ?? id) : '无人')
  const head = `- ${e.at} ${ACTION_LABEL[e.action]}`
  const body =
    e.action === 'handoff'
      ? `：${who(e.from)} → ${who(e.to)}`
      : e.action === 'claim'
        ? `：${who(e.to)}`
        : `：${who(e.from)}`
  const note = e.note ? `\n  说明：${e.note}` : ''
  return `${head}${body}${note}`
}

/**
 * 构造接力链 section。链为空时回 null（而不是空 section）——
 * 单人任务不该在 prompt 里多出一段废话。
 */
export async function buildRelaySection(
  projectPath: string,
  name: NameResolver = () => undefined,
  limit = RELAY_TAIL_ENTRIES,
): Promise<string | null> {
  const chain = await readRelayChain(projectPath, limit)
  if (chain.length === 0) return null
  const lines = chain.map((e) => describe(e, name)).join('\n')
  return `## 本任务接力历史（来自 .dazi/relay.jsonl，最近 ${chain.length} 条）
这根棒之前经过下列人手。交接说明里可能有上一位留下的关键判断，不要重复他们已经做过的工作：
${lines}`
}

/**
 * 把接力段并入既有 prompt。
 *
 * 插在末尾而非开头：既有 prompt 的最后一段是「任务」指令，模型对结尾指令
 * 敏感度最高，故接力历史放在任务指令**之前**。
 */
export function withRelaySection(prompt: string, relaySection: string | null): string {
  if (!relaySection) return prompt
  const marker = '\n\n## 任务'
  const at = prompt.lastIndexOf(marker)
  if (at === -1) return `${prompt}\n\n${relaySection}`
  return `${prompt.slice(0, at)}\n\n${relaySection}${prompt.slice(at)}`
}

/**
 * 交接说明的预填草稿。计划要求「人只做编辑，不手写」。
 *
 * 刻意只做机械汇总（做了什么、棒在谁手里、下一步待定），不臆造进展——
 * 真实的下一步判断得由持棒人自己写，假装能生成会让交接说明变成噪音。
 */
export function draftHandoffNote(opts: {
  taskName: string
  fromName: string
  toName: string
  recentJournal?: string | undefined
}): string {
  const progress = opts.recentJournal?.trim()
  return [
    `${opts.fromName} → ${opts.toName}：${opts.taskName}`,
    '',
    '## 我做到哪了',
    progress ? progress : '（待填：本次持棒期间完成了什么）',
    '',
    '## 交给你的下一步',
    '（待填：最有价值的下一个动作是什么）',
    '',
    '## 需要注意',
    '（待填：坑、约束、还没验证的假设）',
  ].join('\n')
}
