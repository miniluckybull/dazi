/**
 * S2 最后一道闸门：对**真实** workspace 做只读往返解析。
 *
 * 合成 golden（project.test.ts）只能证明「TS 写出的东西 Rust 能读」。它证明不了
 * 反向：那些由**历史版本 Rust** 写下、已经躺在用户磁盘上的 meta.yml，TS 是否
 * 都能读懂。真实数据里有合成用例覆盖不到的东西——早期版本缺字段、手工编辑过的
 * 文件、跑过几十次留下的长 runs 数组、CJK 目录名。迁移一旦读错，损失的是用户
 * 唯一一份资产。
 *
 * 三条断言，逐级加强：
 *  1. 每个 meta.yml 都能 parse（不抛）
 *  2. parse 出的必填字段非空（不是解析成了一堆 undefined 还不报错）
 *  3. parse → stringify → parse 幂等（第二轮与第一轮逐字段相等）
 *
 * 注意第 3 条不断言「stringify 结果 == 原文件字节」：原文件由**旧版** Rust 写出，
 * 键序与字段集合本就可能与当前 struct 不同，要求字节相等会把「格式演进」误报成
 * 「解析错误」。真正要保的是语义不丢——往返幂等即可证明。
 *
 * 本用例**绝不写入**被测目录：只 readFile，且路径来自环境变量而非硬编码，
 * 避免把私有路径写进仓库。未设置时跳过。
 *
 *   DAZI_REAL_WORKSPACE=/path/to/workspace npm test -w @dazi/workspace
 */
import assert from 'node:assert/strict'
import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import { describe, it } from 'node:test'

import { parseMeta, stringifyMeta } from '../src/index.ts'

const REAL_WS = process.env.DAZI_REAL_WORKSPACE

/** 递归找出所有 meta.yml。深度设 3：workspace/{projects,archive}/<任务>/meta.yml。 */
async function findMetaFiles(root: string, depth = 3): Promise<string[]> {
  if (depth < 0) return []
  let entries
  try {
    entries = await fs.readdir(root, { withFileTypes: true })
  } catch {
    return [] // 权限或软链断裂，跳过而非中断整轮扫描
  }
  const out: string[] = []
  for (const e of entries) {
    const p = path.join(root, e.name)
    if (e.isFile() && e.name === 'meta.yml') out.push(p)
    else if (e.isDirectory() && !e.name.startsWith('.')) {
      out.push(...(await findMetaFiles(p, depth - 1)))
    }
  }
  return out
}

describe('真实 workspace 只读往返', { skip: REAL_WS ? false : '未设置 DAZI_REAL_WORKSPACE' }, () => {
  it('每个 meta.yml 都能解析且往返幂等', async () => {
    const files = await findMetaFiles(REAL_WS!)
    assert.ok(files.length > 0, `${REAL_WS} 下没找到 meta.yml，路径可能不对`)

    const failures: string[] = []
    for (const f of files) {
      const raw = await fs.readFile(f, 'utf8')
      try {
        const first = parseMeta(raw)
        // 必填字段：解析成 undefined 而不抛，是比抛异常更危险的失败模式。
        assert.ok(first.slug, 'slug 为空')
        assert.ok(first.name, 'name 为空')
        assert.ok(first.created_at, 'created_at 为空')
        // 往返幂等：语义没在序列化中丢失。
        const second = parseMeta(stringifyMeta(first))
        assert.deepEqual(second, first, '往返后字段不一致')
      } catch (e) {
        failures.push(`${path.relative(REAL_WS!, f)}: ${(e as Error).message}`)
      }
    }
    assert.deepEqual(failures, [], `以下真实文件解析失败：\n${failures.join('\n')}`)
    console.log(`  ✓ ${files.length} 个真实 meta.yml 全部通过`)
  })
})
