/**
 * @dazi/prompt 与 Rust `crates/dazi-core/src/prompt.rs` 的字节兼容测试。
 *
 * golden/*.txt 取自真实 `cargo` 例子在同一份 fixture 上的输出（绝对路径已替换为
 * `<ROOT>`），四种 prompt 以 `<<<DAZI-SPLIT>>>` 分隔。**不是从 Rust 源码推断的**——
 * 这道交叉验证在 @dazi/workspace 抓到过两个 golden 推断漏掉的 bug。
 *
 * fixture 覆盖：references 列表/空目录两种文案、全局记忆三段的有无、兄弟项目
 * 摘要三级回退（context 首段 → README 首行 → 项目名）、80 字截断、软链兄弟、
 * 缺 meta.yml 跳过、journal 取末 5 段、skill 存在性过滤。
 */
import assert from 'node:assert/strict'
import * as fs from 'node:fs/promises'
import * as os from 'node:os'
import * as path from 'node:path'
import { after, describe, it } from 'node:test'

import {
  buildAutopilotPrompt,
  buildContextSections,
  buildHandoffPlanPrompt,
  buildHandoffPrompt,
  buildPlanPrompt,
} from '../src/index.ts'

const HERE = path.dirname(new URL(import.meta.url).pathname)
const SPLIT = '\n<<<DAZI-SPLIT>>>\n'

const tmpRoots: string[] = []
async function tmpDir(): Promise<string> {
  const d = await fs.mkdtemp(path.join(os.tmpdir(), 'dazi-prompt-test-'))
  tmpRoots.push(d)
  return d
}
after(async () => {
  for (const d of tmpRoots) await fs.rm(d, { recursive: true, force: true })
})

const write = async (p: string, s: string) => {
  await fs.mkdir(path.dirname(p), { recursive: true })
  await fs.writeFile(p, s)
}

const metaYml = (name: string, extra = '') =>
  `name: ${name}\nslug: ${name}\ncreated_at: 2026-01-01T00:00:00Z\nupdated_at: 2026-01-01T00:00:00Z\nstatus: active\n${extra}`

/** 在隔离 HOME 下跑，避免真实 ~/.dazi 与 ~/.claude/skills 渗进输出。 */
async function withHome<T>(home: string, fn: () => Promise<T>): Promise<T> {
  const saved = process.env.HOME
  process.env.HOME = home
  try {
    return await fn()
  } finally {
    if (saved === undefined) delete process.env.HOME
    else process.env.HOME = saved
  }
}

/** 四种 prompt 拼成与 Rust 例子相同的单串，便于整体比对。 */
async function allPrompts(projectPath: string): Promise<string> {
  return [
    await buildHandoffPrompt(projectPath),
    await buildHandoffPlanPrompt(projectPath),
    await buildPlanPrompt(projectPath),
    await buildAutopilotPrompt(projectPath),
  ].join(SPLIT)
}

async function golden(name: string, root: string): Promise<string> {
  const raw = await fs.readFile(path.join(HERE, 'golden', name), 'utf8')
  return raw.replaceAll('<ROOT>', root)
}

/** 完整 fixture：与生成 golden/full.txt 时的目录结构逐项一致。 */
async function buildFullFixture(): Promise<{ root: string; project: string }> {
  const root = await tmpDir()
  const home = path.join(root, 'home')
  await write(path.join(home, '.dazi', 'profile.md'), '偏好中文沟通，讨厌过度抽象。\n')
  await write(path.join(home, '.dazi', 'facts.md'), '4090 服务器叫 gpu4090，用户 yq。\n')
  await write(path.join(home, '.dazi', 'patterns.md'), '至少出现两次的纠正才归纳到这里。\n')
  for (const s of ['deep-research', 'pptx']) {
    await write(path.join(home, '.claude', 'skills', s, 'SKILL.md'), 'x\n')
  }

  const ws = path.join(root, 'ws')
  const project = path.join(ws, 'projects', '主任务')
  await write(path.join(project, 'README.md'), '# 主任务\n\n目标：跑通接力。\n')
  await write(
    path.join(project, '.dazi', 'context.md'),
    '一句话目标：验证 prompt 一致性\n进行中：交叉验证\n',
  )
  // 6 段，注入只应取末 5 段
  await write(
    path.join(project, '.dazi', 'journal.md'),
    ['一', '二', '三', '四', '五', '六']
      .map((c, i) => `## 2026-01-0${i + 1} 09:00\n- 第${c}段\n`)
      .join(''),
  )
  await write(path.join(project, 'references', '资料A.md'), 'a\n')
  await write(path.join(project, 'references', 'Beta.txt'), 'b\n')
  await fs.mkdir(path.join(project, 'references', '子目录'), { recursive: true })
  // 第三个 skill 不存在，应被静默跳过
  await write(
    path.join(project, 'meta.yml'),
    metaYml('主任务', 'tags:\n- 迁移\nskills:\n- deep-research\n- pptx\n- 不存在的skill\n'),
  )

  // 兄弟 1：走 context.md 首段（跳标题、多行以空格连接、第二段不取）
  const b1 = path.join(ws, 'projects', '兄弟B')
  await write(path.join(b1, 'meta.yml'), metaYml('兄弟B'))
  await write(
    path.join(b1, '.dazi', 'context.md'),
    '# 标题会被跳过\n这是兄弟B的第一段第一行\n第二行会用空格连接\n\n第二段不要\n',
  )
  // 兄弟 2：在 archive/ 下，走 README 首个非 # 行，且 100 字应被截到 80
  const b2 = path.join(ws, 'archive', '兄弟A归档')
  await write(path.join(b2, 'meta.yml'), metaYml('兄弟A归档'))
  await write(path.join(b2, 'README.md'), `# 忽略\n${'中'.repeat(100)}\n`)
  // 兄弟 3：无 meta.yml → 应被跳过
  await write(path.join(ws, 'projects', '没有meta', 'README.md'), 'x\n')

  return { root, project }
}

/** 极简 fixture：空 references、全局记忆仅空白、兄弟项目是软链。 */
async function buildMinimalFixture(): Promise<{ root: string; project: string }> {
  const root = await tmpDir()
  await write(path.join(root, 'home', '.dazi', 'profile.md'), '   \n\n')

  const ws = path.join(root, 'ws')
  const project = path.join(ws, 'projects', '极简')
  await fs.mkdir(path.join(project, 'references'), { recursive: true })
  await fs.mkdir(path.join(ws, 'archive'), { recursive: true })
  await write(path.join(project, 'README.md'), '# 极简\n')
  await write(path.join(project, 'meta.yml'), metaYml('极简'))

  // 软链项目：Rust 用 p.is_dir()（跟随软链），故必须计入索引
  const real = path.join(root, 'real-elsewhere')
  await write(path.join(real, 'meta.yml'), metaYml('软链兄弟'))
  await write(path.join(real, 'README.md'), '# 忽略\n软链项目的 README 首行\n')
  await fs.symlink(real, path.join(ws, 'projects', '软链兄弟'))

  return { root, project }
}

describe('与 Rust prompt.rs 字节兼容', () => {
  it('完整 fixture：四种 prompt 与 golden 逐字节一致', async () => {
    const { root, project } = await buildFullFixture()
    const actual = await withHome(path.join(root, 'home'), () => allPrompts(project))
    assert.equal(actual, await golden('full.txt', root))
  })

  it('极简 fixture：空 references / 空全局记忆 / 软链兄弟', async () => {
    const { root, project } = await buildMinimalFixture()
    const actual = await withHome(path.join(root, 'home'), () => allPrompts(project))
    assert.equal(actual, await golden('minimal.txt', root))
  })
})

describe('段落组成规则', () => {
  it('段落之间以空行分隔，且顺序固定', async () => {
    const { root, project } = await buildFullFixture()
    const sections = await withHome(path.join(root, 'home'), () =>
      buildContextSections(project),
    )
    const heads = sections.map((s) => s.split('\n')[0])
    assert.deepEqual(heads, [
      '## 项目',
      '## 用户画像（来自 ~/.dazi/profile.md）',
      '## 用户世界事实（来自 ~/.dazi/facts.md）',
      '## 跨项目模式（来自 ~/.dazi/patterns.md）',
      '## 兄弟项目索引',
      '## 本项目当前进展（来自 .dazi/context.md）',
      '## 本项目最近协作日志（来自 .dazi/journal.md，最近 5 段）',
      '## 指定技能（用户要求本任务必须使用）',
    ])
    const joined = await withHome(path.join(root, 'home'), () => buildHandoffPrompt(project))
    assert.ok(joined.includes(`${sections[0]}\n\n${sections[1]}`))
  })

  it('只有 handoff 与 autopilot 带记忆回写约定', async () => {
    const { root, project } = await buildFullFixture()
    await withHome(path.join(root, 'home'), async () => {
      const mark = '## 记忆回写约定（重要）'
      assert.ok((await buildHandoffPrompt(project)).includes(mark))
      assert.ok((await buildAutopilotPrompt(project)).includes(mark))
      assert.ok(!(await buildHandoffPlanPrompt(project)).includes(mark))
      assert.ok(!(await buildPlanPrompt(project)).includes(mark))
    })
  })

  it('skills 段按 skillExists 过滤；全不存在则整段消失', async () => {
    const { root, project } = await buildFullFixture()
    const none = await withHome(path.join(root, 'home'), () =>
      buildContextSections(project, { skillExists: async () => false }),
    )
    assert.ok(!none.some((s) => s.startsWith('## 指定技能')))

    const all = await withHome(path.join(root, 'home'), () =>
      buildContextSections(project, { skillExists: async () => true }),
    )
    const sec = all.find((s) => s.startsWith('## 指定技能'))
    assert.ok(sec)
    // meta.skills 的声明顺序必须保留
    assert.ok(sec.endsWith('- deep-research\n- pptx\n- 不存在的skill'))
  })

  it('兄弟项目摘要截断到 80 字（按字符而非字节）', async () => {
    const { root, project } = await buildFullFixture()
    const sections = await withHome(path.join(root, 'home'), () =>
      buildContextSections(project),
    )
    const idx = sections.find((s) => s.startsWith('## 兄弟项目索引'))!
    const line = idx.split('\n').find((l) => l.includes('兄弟A归档'))!
    const summary = line.slice(line.indexOf('): ') + 3)
    assert.equal([...summary].length, 80)
    assert.equal(summary, '中'.repeat(80))
  })

  it('缺 meta.yml 的目录不进兄弟索引', async () => {
    const { root, project } = await buildFullFixture()
    const sections = await withHome(path.join(root, 'home'), () =>
      buildContextSections(project),
    )
    const idx = sections.find((s) => s.startsWith('## 兄弟项目索引'))!
    assert.ok(!idx.includes('没有meta'))
    // 自身不出现在索引里
    assert.ok(!idx.includes('主任务'))
  })

  it('缺 meta.yml 时上下文仍可拼装，只是没有 skills 段', async () => {
    const root = await tmpDir()
    const project = path.join(root, 'ws', 'projects', '无meta')
    await write(path.join(project, 'README.md'), '# x\n')
    const sections = await withHome(path.join(root, 'home'), () =>
      buildContextSections(project),
    )
    assert.equal(sections.length, 1)
    assert.ok(sections[0]?.startsWith('## 项目'))
  })
})
