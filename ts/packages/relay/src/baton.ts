/**
 * 接力棒（relay baton）—— dazi 团队版的核心原语。
 *
 * 架构前提「单持棒人串行接力」：同一任务在同一时刻只有一个持棒人，
 * 并发度靠跨任务并行拿，不靠同任务多人并行。故这里刻意**没有**多持有者、
 * 没有读写锁分离——那会引出 git 冲突，而 v1 明确用社交层规避。
 *
 * ## 为什么棒放在 .dazi/baton.json 而不是 meta.yml
 *
 * 计划原稿把 baton 放进 meta.yml。实测这在 strangler 过渡期会丢数据：
 * Rust 侧 `ProjectMeta` 不认识 baton 字段，而 serde 默认**忽略**未知字段，
 * 于是 Rust 任何一次 write_meta 都会静默把棒抹掉。同时 meta.yml 多一个
 * `baton: null` 会改变字节输出，冻结的 golden 全部失效。
 *
 * 独立文件则两个问题都不存在：Rust 不读不写，meta.yml 对 React/Flutter 的
 * 契约一字不动。等 TS 成为唯一写入方后，可再决定是否并入 meta.yml。
 *
 * ## 落盘顺序
 *
 * baton.json（当前状态）先写，relay.jsonl（历史）后追加，全程持同一把锁。
 * 两者之间崩溃则丢一条历史、状态正确；反序则日志声称的状态与实际不符——
 * 前者是可接受的失败模式，后者不是。
 */
import * as fs from 'node:fs/promises'
import * as path from 'node:path'

import { appendLine, formatTimestamp, withLock, writeAtomic } from '@dazi/workspace'

/** 棒的默认存活时长：2 小时。到点后任何人可抢，避免持棒人失联导致任务永久卡死。 */
export const BATON_TTL_MS = 2 * 60 * 60 * 1000

/** 持棒人类型。agent 持棒时 holder 是 agent 标识而非 member_id。 */
export type HolderKind = 'human' | 'agent'

/** 接力事件类型。 */
export type RelayAction = 'claim' | 'handoff' | 'release' | 'expire'

export interface Baton {
  /** 持棒人标识：human 时为 member_id，agent 时为 agent 名。 */
  holder: string
  kind: HolderKind
  /** 本次持棒开始时刻（RFC3339 AutoSi，与 Rust chrono 一致）。 */
  since: string
  /** 过期时刻。到点即视为无人持棒。 */
  expires_at: string
}

/** relay.jsonl 的一行。append-only，绝不改写既有行。 */
export interface RelayEntry {
  at: string
  action: RelayAction
  /** 事件发生前的持棒人；首次 claim 时为 null。 */
  from: string | null
  /** 事件发生后的持棒人；release/expire 时为 null。 */
  to: string | null
  kind: HolderKind | null
  /** 交接说明。由 plan 模式预填、人工编辑，不强制。 */
  note: string | null
  /** 实际写入这条记录的成员（可能不是 from/to，例如管理员强收）。 */
  by: string
}

export interface BatonState {
  baton: Baton | null
  /** 棒存在但已过期时为 true——调用方据此显示「已超时，可接管」。 */
  expired: boolean
}

/** 持棒冲突。调用方应把 currentHolder 展示给用户，而不是静默覆盖。 */
export class BatonHeldError extends Error {
  readonly currentHolder: string
  readonly expiresAt: string

  constructor(currentHolder: string, expiresAt: string) {
    super(`任务已被 ${currentHolder} 持有，到 ${expiresAt} 前不可抢占`)
    this.name = 'BatonHeldError'
    this.currentHolder = currentHolder
    this.expiresAt = expiresAt
  }
}

/** 非持棒人试图递棒/放棒。 */
export class NotHolderError extends Error {
  readonly actual: string | null
  readonly attempted: string

  constructor(actual: string | null, attempted: string) {
    super(actual ? `当前持棒人是 ${actual}，${attempted} 无权操作` : `当前无人持棒，${attempted} 无棒可交`)
    this.name = 'NotHolderError'
    this.actual = actual
    this.attempted = attempted
  }
}

const batonPath = (projectPath: string) => path.join(projectPath, '.dazi', 'baton.json')
const relayPath = (projectPath: string) => path.join(projectPath, '.dazi', 'relay.jsonl')

/** 棒是否已过期。解析失败一律判为已过期——坏数据不该让任务永久锁死。 */
function isExpired(b: Baton, now: Date): boolean {
  const t = Date.parse(b.expires_at)
  return Number.isNaN(t) || t <= now.getTime()
}

/** 读原始棒（不判过期）。文件缺失或内容非法都回 null。 */
async function readRaw(projectPath: string): Promise<Baton | null> {
  let raw: string
  try {
    raw = await fs.readFile(batonPath(projectPath), 'utf8')
  } catch {
    return null
  }
  try {
    const v = JSON.parse(raw) as Partial<Baton>
    if (typeof v.holder !== 'string' || !v.holder) return null
    if (v.kind !== 'human' && v.kind !== 'agent') return null
    if (typeof v.since !== 'string' || typeof v.expires_at !== 'string') return null
    return { holder: v.holder, kind: v.kind, since: v.since, expires_at: v.expires_at }
  } catch {
    return null
  }
}

/**
 * 读当前棒状态。过期的棒照实返回并置 expired，而不是当作无棒——
 * 界面需要区分「从没人碰过」和「有人拿了但超时了」。
 */
export async function readBaton(projectPath: string, now: Date = new Date()): Promise<BatonState> {
  const baton = await readRaw(projectPath)
  if (!baton) return { baton: null, expired: false }
  return { baton, expired: isExpired(baton, now) }
}

async function writeBaton(projectPath: string, b: Baton | null): Promise<void> {
  const p = batonPath(projectPath)
  if (b === null) {
    await fs.rm(p, { force: true })
    return
  }
  await fs.mkdir(path.dirname(p), { recursive: true })
  await writeAtomic(p, `${JSON.stringify(b, null, 2)}\n`)
}

async function appendRelay(projectPath: string, e: RelayEntry): Promise<void> {
  await appendLine(relayPath(projectPath), JSON.stringify(e))
}

function makeBaton(holder: string, kind: HolderKind, now: Date, ttlMs: number): Baton {
  return {
    holder,
    kind,
    since: formatTimestamp(now),
    expires_at: formatTimestamp(new Date(now.getTime() + ttlMs)),
  }
}

export interface ClaimOptions {
  kind?: HolderKind
  note?: string
  ttlMs?: number
  now?: Date
}

/**
 * 认领接力棒。
 *
 * 允许的情形：无人持棒、棒已过期、或本人已持棒（续期，幂等）。
 * 他人持棒且未过期则抛 BatonHeldError——抢棒必须是显式的人类决定。
 *
 * 过期棒被接管时补记一条 expire，否则链上会出现「A 持棒 → B 持棒」
 * 而看不出中间发生了超时。
 */
export async function claimBaton(
  projectPath: string,
  holder: string,
  opts: ClaimOptions = {},
): Promise<Baton> {
  const now = opts.now ?? new Date()
  const kind = opts.kind ?? 'human'
  const ttl = opts.ttlMs ?? BATON_TTL_MS

  return withLock(batonPath(projectPath), async () => {
    const cur = await readRaw(projectPath)
    const held = cur && !isExpired(cur, now)

    if (held && cur.holder !== holder) {
      throw new BatonHeldError(cur.holder, cur.expires_at)
    }

    // 超时接管：先把超时本身记上，再记接管。
    if (cur && !held && cur.holder !== holder) {
      await appendRelay(projectPath, {
        at: formatTimestamp(now),
        action: 'expire',
        from: cur.holder,
        to: null,
        kind: cur.kind,
        note: `持棒超时（应于 ${cur.expires_at} 前交接）`,
        by: holder,
      })
    }

    const next = makeBaton(holder, kind, now, ttl)
    await writeBaton(projectPath, next)
    await appendRelay(projectPath, {
      at: next.since,
      action: 'claim',
      from: cur?.holder ?? null,
      to: holder,
      kind,
      note: opts.note ?? null,
      by: holder,
    })
    return next
  })
}

export interface HandoffOptions {
  kind?: HolderKind
  note?: string
  ttlMs?: number
  now?: Date
}

/**
 * 递棒给下一个人/agent。只有当前持棒人能递。
 *
 * 棒过期后原持棒人**仍可**递出：超时只意味着别人可以抢，不意味着原持棒人
 * 被剥夺资格；若此时已被他人抢走，则 from 不匹配，自然报 NotHolderError。
 */
export async function handoffBaton(
  projectPath: string,
  from: string,
  to: string,
  opts: HandoffOptions = {},
): Promise<Baton> {
  const now = opts.now ?? new Date()
  const kind = opts.kind ?? 'human'
  const ttl = opts.ttlMs ?? BATON_TTL_MS

  return withLock(batonPath(projectPath), async () => {
    const cur = await readRaw(projectPath)
    if (!cur || cur.holder !== from) {
      throw new NotHolderError(cur?.holder ?? null, from)
    }
    const next = makeBaton(to, kind, now, ttl)
    await writeBaton(projectPath, next)
    await appendRelay(projectPath, {
      at: next.since,
      action: 'handoff',
      from,
      to,
      kind,
      note: opts.note ?? null,
      by: from,
    })
    return next
  })
}

export interface ReleaseOptions {
  note?: string
  now?: Date
  /** 管理员强收：跳过持棒人校验。调用方须自行校验权限。 */
  force?: boolean
}

/**
 * 放棒，任务回到无人持有。
 *
 * force 供管理员强收失联成员的棒——记录里 by 会与 from 不同，
 * 因此「谁强收了谁的棒」在链上看得见。
 */
export async function releaseBaton(
  projectPath: string,
  actor: string,
  opts: ReleaseOptions = {},
): Promise<void> {
  const now = opts.now ?? new Date()
  await withLock(batonPath(projectPath), async () => {
    const cur = await readRaw(projectPath)
    if (!cur) throw new NotHolderError(null, actor)
    if (!opts.force && cur.holder !== actor) {
      throw new NotHolderError(cur.holder, actor)
    }
    await writeBaton(projectPath, null)
    await appendRelay(projectPath, {
      at: formatTimestamp(now),
      action: 'release',
      from: cur.holder,
      to: null,
      kind: cur.kind,
      note: opts.note ?? null,
      by: actor,
    })
  })
}

/**
 * 读接力链。坏行跳过而不是整体失败——一行写坏不该让整段历史读不出来。
 *
 * @param limit 只取最近 N 条；省略则全量
 */
export async function readRelayChain(projectPath: string, limit?: number): Promise<RelayEntry[]> {
  let raw: string
  try {
    raw = await fs.readFile(relayPath(projectPath), 'utf8')
  } catch {
    return []
  }
  const out: RelayEntry[] = []
  for (const line of raw.split('\n')) {
    if (!line.trim()) continue
    try {
      out.push(JSON.parse(line) as RelayEntry)
    } catch {
      continue
    }
  }
  return limit === undefined ? out : out.slice(-limit)
}
