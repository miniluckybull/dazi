/**
 * 接力棒测试。重点不在 happy path，而在三件必须不发生的事：
 *   1. 两人同时认领，双双成功（棒必须是排他的）
 *   2. 超时接管后链上看不出发生过超时
 *   3. 非持棒人递出别人的棒
 */
import assert from 'node:assert/strict'
import * as fs from 'node:fs/promises'
import * as os from 'node:os'
import * as path from 'node:path'
import { afterEach, beforeEach, describe, it } from 'node:test'

import {
  BATON_TTL_MS,
  BatonHeldError,
  buildRelaySection,
  claimBaton,
  draftHandoffNote,
  handoffBaton,
  NotHolderError,
  readBaton,
  readRelayChain,
  releaseBaton,
  withRelaySection,
} from '../src/index.ts'

let dir: string

beforeEach(async () => {
  dir = await fs.mkdtemp(path.join(os.tmpdir(), 'dazi-relay-'))
})

afterEach(async () => {
  await fs.rm(dir, { recursive: true, force: true })
})

const T0 = new Date('2026-08-29T10:00:00Z')
const at = (msOffset: number) => new Date(T0.getTime() + msOffset)

describe('认领与排他', () => {
  it('首次认领：写棒 + 记一条 claim，from 为 null', async () => {
    const b = await claimBaton(dir, 'm-alice', { now: T0 })
    assert.equal(b.holder, 'm-alice')
    assert.equal(b.kind, 'human')
    assert.equal(b.since, '2026-08-29T10:00:00Z')
    assert.equal(b.expires_at, '2026-08-29T12:00:00Z', 'TTL 2 小时')

    const chain = await readRelayChain(dir)
    assert.equal(chain.length, 1)
    assert.equal(chain[0]?.action, 'claim')
    assert.equal(chain[0]?.from, null)
    assert.equal(chain[0]?.to, 'm-alice')
    assert.equal(chain[0]?.by, 'm-alice')
  })

  it('他人持棒且未过期 → BatonHeldError，且棒不被改动', async () => {
    await claimBaton(dir, 'm-alice', { now: T0 })
    await assert.rejects(
      () => claimBaton(dir, 'm-bob', { now: at(60_000) }),
      (e: unknown) => {
        assert.ok(e instanceof BatonHeldError)
        assert.equal(e.currentHolder, 'm-alice')
        return true
      },
    )
    const { baton } = await readBaton(dir, at(60_000))
    assert.equal(baton?.holder, 'm-alice', '失败的抢棒不能改动持棒人')
    assert.equal((await readRelayChain(dir)).length, 1, '失败的抢棒不该留记录')
  })

  it('本人重复认领 = 续期，幂等不报错', async () => {
    await claimBaton(dir, 'm-alice', { now: T0 })
    const again = await claimBaton(dir, 'm-alice', { now: at(60 * 60 * 1000) })
    assert.equal(again.holder, 'm-alice')
    assert.equal(again.expires_at, '2026-08-29T13:00:00Z', '过期时间应向后推')
  })

  /**
   * 这是现有 Rust 实现（无锁 read-modify-write）必然失败的用例：
   * 两人在同一毫秒点「接手」，必须恰好一个成功。
   */
  it('并发认领：20 个竞争者恰好 1 人拿到棒', async () => {
    const ids = Array.from({ length: 20 }, (_, i) => `m-${i}`)
    const results = await Promise.allSettled(ids.map((id) => claimBaton(dir, id, { now: T0 })))

    const won = results.filter((r) => r.status === 'fulfilled')
    assert.equal(won.length, 1, `应恰好 1 人成功，实际 ${won.length}`)

    const { baton } = await readBaton(dir, T0)
    const claims = (await readRelayChain(dir)).filter((e) => e.action === 'claim')
    assert.equal(claims.length, 1, '链上也只能有一条 claim')
    assert.equal(claims[0]?.to, baton?.holder, '链上的持棒人与棒文件必须一致')
  })
})

describe('超时', () => {
  it('过期棒照实返回并置 expired，区分「没人碰过」与「超时了」', async () => {
    const fresh = await readBaton(dir, T0)
    assert.equal(fresh.baton, null)
    assert.equal(fresh.expired, false)

    await claimBaton(dir, 'm-alice', { now: T0 })
    const after = await readBaton(dir, at(BATON_TTL_MS + 1))
    assert.equal(after.baton?.holder, 'm-alice', '超时不等于棒消失')
    assert.equal(after.expired, true)
  })

  it('超时后他人可接管，且链上补记一条 expire', async () => {
    await claimBaton(dir, 'm-alice', { now: T0 })
    const b = await claimBaton(dir, 'm-bob', { now: at(BATON_TTL_MS + 1) })
    assert.equal(b.holder, 'm-bob')

    const chain = await readRelayChain(dir)
    assert.deepEqual(
      chain.map((e) => e.action),
      ['claim', 'expire', 'claim'],
      '缺了 expire 就看不出中间发生过超时',
    )
    assert.equal(chain[1]?.from, 'm-alice')
    assert.equal(chain[1]?.by, 'm-bob', 'expire 由接管者写下')
  })

  it('expires_at 损坏一律判为过期，坏数据不能让任务永久锁死', async () => {
    await claimBaton(dir, 'm-alice', { now: T0 })
    const p = path.join(dir, '.dazi', 'baton.json')
    const b = JSON.parse(await fs.readFile(p, 'utf8')) as Record<string, unknown>
    b.expires_at = '不是时间'
    await fs.writeFile(p, JSON.stringify(b))

    assert.equal((await readBaton(dir, T0)).expired, true)
    await assert.doesNotReject(() => claimBaton(dir, 'm-bob', { now: T0 }))
  })

  it('自定义 TTL 生效', async () => {
    const b = await claimBaton(dir, 'm-alice', { now: T0, ttlMs: 60_000 })
    assert.equal(b.expires_at, '2026-08-29T10:01:00Z')
  })
})

describe('递棒与放棒', () => {
  it('持棒人递棒：棒换手，链上记 from → to', async () => {
    await claimBaton(dir, 'm-alice', { now: T0 })
    const b = await handoffBaton(dir, 'm-alice', 'm-bob', {
      now: at(1000),
      note: '资料已收齐，请写初稿',
    })
    assert.equal(b.holder, 'm-bob')

    const last = (await readRelayChain(dir)).at(-1)
    assert.equal(last?.action, 'handoff')
    assert.equal(last?.from, 'm-alice')
    assert.equal(last?.to, 'm-bob')
    assert.equal(last?.note, '资料已收齐，请写初稿')
  })

  it('非持棒人递棒 → NotHolderError，棒不动', async () => {
    await claimBaton(dir, 'm-alice', { now: T0 })
    await assert.rejects(
      () => handoffBaton(dir, 'm-bob', 'm-carol', { now: at(1000) }),
      (e: unknown) => {
        assert.ok(e instanceof NotHolderError)
        assert.equal(e.actual, 'm-alice')
        return true
      },
    )
    assert.equal((await readBaton(dir, T0)).baton?.holder, 'm-alice')
  })

  it('无棒可递也报 NotHolderError', async () => {
    await assert.rejects(() => handoffBaton(dir, 'm-alice', 'm-bob'), NotHolderError)
  })

  it('递给 agent：kind 记为 agent', async () => {
    await claimBaton(dir, 'm-alice', { now: T0 })
    const b = await handoffBaton(dir, 'm-alice', 'agent-claude', {
      now: at(1000),
      kind: 'agent',
    })
    assert.equal(b.kind, 'agent')
    assert.equal((await readRelayChain(dir)).at(-1)?.kind, 'agent')
  })

  it('放棒后无人持有，但历史保留', async () => {
    await claimBaton(dir, 'm-alice', { now: T0 })
    await releaseBaton(dir, 'm-alice', { now: at(1000) })
    assert.equal((await readBaton(dir, at(2000))).baton, null)
    assert.equal((await readRelayChain(dir)).length, 2, 'release 也要留痕')
  })

  it('他人放棒被拒；force 强收成功且 by 记的是强收者', async () => {
    await claimBaton(dir, 'm-alice', { now: T0 })
    await assert.rejects(() => releaseBaton(dir, 'm-bob', { now: at(1000) }), NotHolderError)

    await releaseBaton(dir, 'm-admin', { now: at(2000), force: true, note: '成员失联' })
    const last = (await readRelayChain(dir)).at(-1)
    assert.equal(last?.action, 'release')
    assert.equal(last?.from, 'm-alice', '被强收的是 alice')
    assert.equal(last?.by, 'm-admin', '强收者必须留名，否则无法追责')
  })

  it('过期后原持棒人仍可递出（若尚未被抢走）', async () => {
    await claimBaton(dir, 'm-alice', { now: T0 })
    const b = await handoffBaton(dir, 'm-alice', 'm-bob', { now: at(BATON_TTL_MS + 1) })
    assert.equal(b.holder, 'm-bob')
  })
})

describe('接力链读取', () => {
  it('坏行跳过，不让一行写坏毁掉整段历史', async () => {
    await claimBaton(dir, 'm-alice', { now: T0 })
    const p = path.join(dir, '.dazi', 'relay.jsonl')
    await fs.appendFile(p, '{半个 json\n')
    await fs.appendFile(p, '\n')
    await handoffBaton(dir, 'm-alice', 'm-bob', { now: at(1000) })

    const chain = await readRelayChain(dir)
    assert.equal(chain.length, 2, '两条合法记录都要读出来')
  })

  it('limit 取最近 N 条', async () => {
    await claimBaton(dir, 'm-a', { now: T0 })
    await handoffBaton(dir, 'm-a', 'm-b', { now: at(1000) })
    await handoffBaton(dir, 'm-b', 'm-c', { now: at(2000) })
    const tail = await readRelayChain(dir, 2)
    assert.equal(tail.length, 2)
    assert.equal(tail[0]?.to, 'm-b', '取的是最近两条，不是最早两条')
  })

  it('无文件回空数组', async () => {
    assert.deepEqual(await readRelayChain(dir), [])
  })

  it('append-only：递棒不改写既有行', async () => {
    await claimBaton(dir, 'm-alice', { now: T0 })
    const p = path.join(dir, '.dazi', 'relay.jsonl')
    const firstLine = (await fs.readFile(p, 'utf8')).split('\n')[0]
    await handoffBaton(dir, 'm-alice', 'm-bob', { now: at(1000) })
    assert.equal((await fs.readFile(p, 'utf8')).split('\n')[0], firstLine)
  })
})

describe('交接包注入', () => {
  it('无接力历史回 null，单人任务不该多一段废话', async () => {
    assert.equal(await buildRelaySection(dir), null)
  })

  it('渲染人名而非 member_id，查不到则退回 id', async () => {
    await claimBaton(dir, 'm-alice', { now: T0 })
    await handoffBaton(dir, 'm-alice', 'm-unknown', { now: at(1000), note: '请接手' })
    const names: Record<string, string> = { 'm-alice': '爱丽丝' }
    const sec = await buildRelaySection(dir, (id) => names[id])

    assert.ok(sec?.includes('爱丽丝'))
    assert.ok(sec?.includes('m-unknown'), '查不到人名要退回 id，不能丢信息')
    assert.ok(sec?.includes('请接手'))
  })

  it('注入点在「## 任务」之前，任务指令仍在末尾', async () => {
    await claimBaton(dir, 'm-alice', { now: T0 })
    const sec = await buildRelaySection(dir)
    const merged = withRelaySection('## 项目\n根目录：/x\n\n## 任务\n请总结', sec)

    const relayAt = merged.indexOf('## 本任务接力历史')
    const taskAt = merged.indexOf('## 任务')
    assert.ok(relayAt > 0 && taskAt > relayAt, '接力段必须在任务指令之前')
    assert.ok(merged.trimEnd().endsWith('请总结'), '任务指令仍须结尾')
  })

  it('无「## 任务」时追加到末尾，不丢内容', async () => {
    await claimBaton(dir, 'm-alice', { now: T0 })
    const sec = await buildRelaySection(dir)
    const merged = withRelaySection('## 项目\n根目录：/x', sec)
    assert.ok(merged.startsWith('## 项目'))
    assert.ok(merged.includes('## 本任务接力历史'))
  })

  it('relaySection 为 null 时原样返回', () => {
    assert.equal(withRelaySection('原文', null), '原文')
  })

  it('交接说明草稿：三段结构 + 待填占位，不臆造进展', () => {
    const draft = draftHandoffNote({
      taskName: '一汽调研',
      fromName: '爱丽丝',
      toName: '鲍勃',
      recentJournal: '已完成访谈提纲',
    })
    assert.ok(draft.includes('爱丽丝 → 鲍勃：一汽调研'))
    assert.ok(draft.includes('已完成访谈提纲'))
    assert.ok(draft.includes('## 交给你的下一步'))
    assert.ok(draft.includes('（待填'), '下一步必须由人写，不能假装能生成')
  })

  it('无 journal 时进展段也是待填占位', () => {
    const draft = draftHandoffNote({ taskName: 'T', fromName: 'A', toName: 'B' })
    assert.ok(draft.includes('（待填：本次持棒期间完成了什么）'))
  })
})
