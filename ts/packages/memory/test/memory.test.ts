/**
 * @dazi/memory 行为对齐 Rust memory.rs 的测试。
 * 重点：白名单校验（防路径穿越）、缺文件读空串、tailJournal 分段规则。
 */
import assert from 'node:assert/strict'
import * as fs from 'node:fs/promises'
import * as os from 'node:os'
import * as path from 'node:path'
import { after, describe, it } from 'node:test'

import {
  GLOBAL_FILES,
  PROJECT_FILES,
  initProjectMemory,
  readGlobal,
  readProject,
  tailJournal,
  writeGlobal,
  writeProject,
} from '../src/index.ts'

const tmpRoots: string[] = []
async function tmpDir(): Promise<string> {
  const d = await fs.mkdtemp(path.join(os.tmpdir(), 'dazi-mem-test-'))
  tmpRoots.push(d)
  return d
}
after(async () => {
  for (const d of tmpRoots) await fs.rm(d, { recursive: true, force: true })
})

/** 在隔离 HOME 下运行，避免污染真实 ~/.dazi。 */
async function withFakeHome<T>(fn: (home: string) => Promise<T>): Promise<T> {
  const home = await tmpDir()
  const saved = process.env.HOME
  process.env.HOME = home
  try {
    return await fn(home)
  } finally {
    if (saved === undefined) delete process.env.HOME
    else process.env.HOME = saved
  }
}

describe('文件名白名单', () => {
  it('拒绝非白名单的全局文件名（含路径穿越尝试）', async () => {
    for (const bad of ['../../etc/passwd', 'secrets.md', 'profile.md.bak', '', 'PROFILE.MD']) {
      await assert.rejects(() => readGlobal(bad), /非法的全局记忆文件名/, `应拒绝: ${bad}`)
      await assert.rejects(() => writeGlobal(bad, 'x'), /非法的全局记忆文件名/)
    }
  })

  it('拒绝非白名单的项目文件名', async () => {
    const d = await tmpDir()
    for (const bad of ['../meta.yml', 'notes.md', 'journal.md.tmp']) {
      await assert.rejects(() => readProject(d, bad), /非法的项目记忆文件名/)
    }
  })

  it('白名单本身与 Rust 一致', () => {
    assert.deepEqual([...GLOBAL_FILES], ['profile.md', 'patterns.md', 'facts.md', 'changelog.md'])
    assert.deepEqual([...PROJECT_FILES], ['journal.md', 'context.md'])
  })
})

describe('读写', () => {
  it('缺文件读作空串而非报错', async () => {
    await withFakeHome(async () => {
      assert.equal(await readGlobal('facts.md'), '')
    })
    const d = await tmpDir()
    assert.equal(await readProject(d, 'context.md'), '')
  })

  it('全局记忆往返', async () => {
    await withFakeHome(async (home) => {
      await writeGlobal('facts.md', '4090 服务器叫 gpu4090\n')
      assert.equal(await readGlobal('facts.md'), '4090 服务器叫 gpu4090\n')
      // 落在 ~/.dazi/ 下
      assert.ok(await fs.stat(path.join(home, '.dazi', 'facts.md')))
    })
  })

  it('项目记忆往返', async () => {
    const d = await tmpDir()
    await writeProject(d, 'context.md', '目标：跑通接力\n')
    assert.equal(await readProject(d, 'context.md'), '目标：跑通接力\n')
  })

  it('initProjectMemory 不覆盖已有内容', async () => {
    const d = await tmpDir()
    await writeProject(d, 'journal.md', '已有内容\n')
    await initProjectMemory(d)
    assert.equal(await readProject(d, 'journal.md'), '已有内容\n')
    assert.equal(await readProject(d, 'context.md'), '')
  })
})

describe('tailJournal 分段（对齐 Rust tail_journal）', () => {
  const j = (...secs: string[]) => secs.join('')

  it('空 journal 返回空串', async () => {
    const d = await tmpDir()
    await writeProject(d, 'journal.md', '   \n\n')
    assert.equal(await tailJournal(d, 5), '')
  })

  it('取末尾 N 段，trim 尾部空白', async () => {
    const d = await tmpDir()
    await writeProject(
      d,
      'journal.md',
      j(
        '## 2026-01-01 10:00\n- 第一段\n',
        '## 2026-01-02 10:00\n- 第二段\n',
        '## 2026-01-03 10:00\n- 第三段\n\n',
      ),
    )
    assert.equal(
      await tailJournal(d, 2),
      '## 2026-01-02 10:00\n- 第二段\n## 2026-01-03 10:00\n- 第三段',
    )
    assert.equal(await tailJournal(d, 1), '## 2026-01-03 10:00\n- 第三段')
  })

  it('N 大于总段数时返回全部', async () => {
    const d = await tmpDir()
    await writeProject(d, 'journal.md', '## A\n- x\n')
    assert.equal(await tailJournal(d, 99), '## A\n- x')
  })

  it('首段之前的前言也算一段', async () => {
    const d = await tmpDir()
    await writeProject(d, 'journal.md', '前言行\n## A\n- x\n')
    assert.equal(await tailJournal(d, 99), '前言行\n## A\n- x')
    assert.equal(await tailJournal(d, 1), '## A\n- x')
  })

  it('仅行首 ## 才切段，正文里的 ## 不切', async () => {
    const d = await tmpDir()
    await writeProject(d, 'journal.md', '## A\n- 提到 ## 不该切\n  ## 缩进也不切\n')
    assert.equal(await tailJournal(d, 1), '## A\n- 提到 ## 不该切\n  ## 缩进也不切')
  })

  it('CRLF 文件的行尾 \\r 被去掉（Rust str::lines 语义）', async () => {
    const d = await tmpDir()
    await writeProject(d, 'journal.md', '## A\r\n- x\r\n')
    assert.equal(await tailJournal(d, 1), '## A\n- x')
  })
})
