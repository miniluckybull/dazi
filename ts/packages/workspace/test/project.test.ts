/**
 * S2 闸门：TS 侧产出必须与 Rust 侧字节兼容。
 *
 * golden 值取自真实 `cargo run` 输出（serde_yaml 对 ProjectMeta 的序列化），
 * 不是照 struct 推断的。任何一处漂移（键序、null 表示、CJK 引号、时间戳格式）
 * 都会让这些断言失败。
 */
import assert from 'node:assert/strict'
import * as fs from 'node:fs/promises'
import * as os from 'node:os'
import * as path from 'node:path'
import { after, describe, it } from 'node:test'

import {
  appendLine,
  createProject,
  formatTimestamp,
  parseMeta,
  readMeta,
  sanitizeDirName,
  stringifyMeta,
  updateAtomic,
  writeMeta,
} from '../src/index.ts'

const tmpRoots: string[] = []
async function tmpWs(): Promise<string> {
  const d = await fs.mkdtemp(path.join(os.tmpdir(), 'dazi-ts-test-'))
  tmpRoots.push(d)
  return d
}
after(async () => {
  for (const d of tmpRoots) await fs.rm(d, { recursive: true, force: true })
})

/**
 * 真实 Rust 输出（`cargo run -p dazi-core --example golden`，名称 "测试 任务/A."）。
 * 时间戳被替换为占位以便比对结构。
 */
const RUST_GOLDEN = `slug: 测试 任务 A
name: 测试 任务/A.
status: todo
priority: normal
tags: []
start_date: null
due_date: null
requires_references: false
handed_off_at: null
created_at: <TS>
updated_at: <TS>
task_type: oneoff
schedule: null
on_trigger: null
runs: []
next_run_at: null
skills: []
`

describe('meta.yml 与 Rust serde_yaml 字节兼容', () => {
  it('新建任务产出的 meta.yml 与 Rust golden 逐字节一致', async () => {
    const ws = await tmpWs()
    const p = await createProject(ws, '测试 任务/A.')

    // Rust 的 sanitize：/ → 空格，尾部 . 去掉
    assert.equal(p.slug, '测试 任务 A')

    const raw = await fs.readFile(path.join(p.path, 'meta.yml'), 'utf8')
    const normalized = raw.replace(
      /(created_at|updated_at): \S+/g,
      (_m, k) => `${k}: <TS>`,
    )
    assert.equal(normalized, RUST_GOLDEN)
  })

  it('时间戳格式对齐 chrono SecondsFormat::AutoSi', () => {
    // 非 0 毫秒：保留 3 位，不补尾零
    assert.equal(
      formatTimestamp(new Date('2026-08-26T08:23:54.047Z')),
      '2026-08-26T08:23:54.047Z',
    )
    // 0 毫秒：完全省略小数部分（此前写成 .000000Z，被交叉验证抓出）
    assert.equal(formatTimestamp(new Date('2026-02-01T00:00:00.000Z')), '2026-02-01T00:00:00Z')
  })

  it('序列项不缩进（serde_yaml 风格，非 yaml 库默认）', () => {
    const base = parseMeta(RUST_GOLDEN.replace(/<TS>/g, '2026-01-01T00:00:00Z'))
    const out = stringifyMeta({ ...base, tags: ['一汽', '调研'] })
    assert.match(out, /^tags:\n- 一汽\n- 调研$/m)
    assert.doesNotMatch(out, /^ {2}- 一汽/m)
  })

  it('runs 的 skip_serializing_if 语义：None/空数组不出现', () => {
    const base = parseMeta(RUST_GOLDEN.replace(/<TS>/g, '2026-01-01T00:00:00Z'))
    const out = stringifyMeta({
      ...base,
      runs: [
        { at: '2026-01-01T00:00:00Z', action: 'autopilot', ok: true, message: null },
        {
          at: '2026-01-02T00:00:00Z',
          action: 'autopilot',
          ok: false,
          message: 'boom',
          id: 'run-1',
          summary: '摘要',
          artifacts: ['output/a.txt'],
        },
      ],
    })
    // 第一条无 id/summary/artifacts 键，且序列项不缩进
    assert.match(out, /^- at: 2026-01-01T00:00:00Z\n {2}action: autopilot\n {2}ok: true\n {2}message: null\n/m)
    assert.match(out, /^ {2}id: run-1$/m)
    assert.match(out, /^ {2}summary: 摘要$/m)
    assert.match(out, /^ {2}- output\/a\.txt$/m)
    // 空 artifacts 不应出现空数组
    assert.doesNotMatch(out, /artifacts: \[\]/)
  })

  it('往返解析不丢字段', async () => {
    const ws = await tmpWs()
    const p = await createProject(ws, '往返')
    const meta = await readMeta(p.path)
    meta.tags = ['a', 'b']
    meta.skills = ['pdf-report']
    meta.on_trigger = { action: 'autopilot', model: 'sonnet' }
    await writeMeta(p.path, meta)
    assert.deepEqual(await readMeta(p.path), meta)
  })
})

describe('sanitizeDirName 对齐 Rust', () => {
  it('保留中文，替换禁用字符，去首尾点与空白', () => {
    assert.equal(sanitizeDirName('一汽集团/调研'), '一汽集团 调研')
    assert.equal(sanitizeDirName('  .隐藏.  '), '隐藏')
    assert.equal(sanitizeDirName('a:b*c?d"e<f>g|h'), 'a b c d e f g h')
    assert.equal(sanitizeDirName('tab\there'), 'tab here')
  })
})

describe('slug 唯一化', () => {
  it('同名任务依次拿到 base、base-2、base-3', async () => {
    const ws = await tmpWs()
    assert.equal((await createProject(ws, '重名')).slug, '重名')
    assert.equal((await createProject(ws, '重名')).slug, '重名-2')
    assert.equal((await createProject(ws, '重名')).slug, '重名-3')
  })
})

describe('并发写入安全（Rust 侧现有实现必然失败的用例）', () => {
  it('20 个并发 read-modify-write 全部落盘，零丢写', async () => {
    const ws = await tmpWs()
    const target = path.join(ws, 'counter.txt')
    await fs.writeFile(target, '0', 'utf8')

    await Promise.all(
      Array.from({ length: 20 }, () =>
        updateAtomic(target, (cur) => String(Number(cur ?? '0') + 1)),
      ),
    )

    assert.equal(await fs.readFile(target, 'utf8'), '20')
  })

  it('50 个并发 appendLine 不交错、不丢行', async () => {
    const ws = await tmpWs()
    const log = path.join(ws, 'relay.jsonl')

    await Promise.all(
      Array.from({ length: 50 }, (_, i) =>
        appendLine(log, JSON.stringify({ seq: i, note: '接力' })),
      ),
    )

    const lines = (await fs.readFile(log, 'utf8')).trim().split('\n')
    assert.equal(lines.length, 50)
    const seqs = lines.map((l) => (JSON.parse(l) as { seq: number }).seq).sort((a, b) => a - b)
    assert.deepEqual(seqs, Array.from({ length: 50 }, (_, i) => i))
  })

  it('原子写：读者永不看到半个文件', async () => {
    const ws = await tmpWs()
    const target = path.join(ws, 'big.txt')
    const big = 'x'.repeat(200_000)
    await fs.writeFile(target, big, 'utf8')

    const reads: Promise<number>[] = []
    const write = updateAtomic(target, () => 'y'.repeat(200_000))
    for (let i = 0; i < 30; i++) {
      reads.push(fs.readFile(target, 'utf8').then((s) => s.length))
    }
    await write
    for (const len of await Promise.all(reads)) assert.equal(len, 200_000)
  })
})

describe('任务文件夹结构', () => {
  it('建齐三个子目录、.dazi 记忆文件、README', async () => {
    const ws = await tmpWs()
    const p = await createProject(ws, '结构检查')

    for (const sub of ['references', 'notes', 'output']) {
      assert.ok((await fs.stat(path.join(p.path, sub))).isDirectory(), `缺 ${sub}/`)
    }
    for (const f of ['journal.md', 'context.md']) {
      assert.equal(await fs.readFile(path.join(p.path, '.dazi', f), 'utf8'), '')
    }
    const readme = await fs.readFile(path.join(p.path, 'README.md'), 'utf8')
    assert.ok(readme.startsWith('# 结构检查\n'))
    assert.ok(readme.includes('这份 README 同时也是交给 Claude 的提示词'))
    assert.doesNotMatch(readme, /\{\{name\}\}/)

    for (const sub of ['.dazi', 'projects', 'archive']) {
      assert.ok((await fs.stat(path.join(ws, sub))).isDirectory(), `缺 workspace/${sub}`)
    }
  })

  it('空名称被拒', async () => {
    const ws = await tmpWs()
    await assert.rejects(() => createProject(ws, '   '), /名称不能为空/)
  })
})
