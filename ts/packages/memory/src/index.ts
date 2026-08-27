/**
 * 分层记忆：全局（跟着用户走）与项目级（跟着项目走）。
 *
 * 行为对齐 Rust `crates/dazi-core/src/memory.rs`：
 *  - 文件名白名单校验（防路径穿越）——`validate_global_file` :29 / `validate_project_file` :37
 *  - 缺文件读作空串而非报错——`read_or_empty` :45
 *  - `tail_journal` :84 以行首 `## ` 切段，取末尾 N 段
 *
 * 与 Rust 的差异：写入走 @dazi/workspace 的原子写，避免并发截断。
 */
import * as fs from 'node:fs/promises'
import * as os from 'node:os'
import * as path from 'node:path'

import { writeAtomic } from '@dazi/workspace'

/** 全局记忆文件白名单。顺序与 Rust GLOBAL_FILES 一致。 */
export const GLOBAL_FILES = ['profile.md', 'patterns.md', 'facts.md', 'changelog.md'] as const
/** 项目记忆文件白名单。 */
export const PROJECT_FILES = ['journal.md', 'context.md'] as const

export type GlobalFile = (typeof GLOBAL_FILES)[number]
export type ProjectFile = (typeof PROJECT_FILES)[number]

/**
 * 全局记忆目录 `~/.dazi`。
 *
 * Rust 侧读 HOME，回退 USERPROFILE。`os.homedir()` 已封装这个平台差异。
 */
export function globalDir(): string {
  const home = os.homedir()
  if (!home) throw new Error('无法确定用户主目录（HOME/USERPROFILE 均未设置）')
  return path.join(home, '.dazi')
}

function validateGlobalFile(name: string): asserts name is GlobalFile {
  if (!(GLOBAL_FILES as readonly string[]).includes(name)) {
    throw new Error(`非法的全局记忆文件名: ${name}`)
  }
}

function validateProjectFile(name: string): asserts name is ProjectFile {
  if (!(PROJECT_FILES as readonly string[]).includes(name)) {
    throw new Error(`非法的项目记忆文件名: ${name}`)
  }
}

/** 读文件，不存在返回空串（对齐 Rust read_or_empty）。 */
async function readOrEmpty(p: string): Promise<string> {
  return fs.readFile(p, 'utf8').catch((e) => {
    if ((e as NodeJS.ErrnoException).code === 'ENOENT') return ''
    throw new Error(`读取 ${p} 失败: ${e}`)
  })
}

/** 读全局记忆文件。 */
export async function readGlobal(name: string): Promise<string> {
  validateGlobalFile(name)
  return readOrEmpty(path.join(globalDir(), name))
}

/** 写全局记忆文件（原子）。 */
export async function writeGlobal(name: string, content: string): Promise<void> {
  validateGlobalFile(name)
  const dir = globalDir()
  await fs.mkdir(dir, { recursive: true })
  await writeAtomic(path.join(dir, name), content)
}

/** 读项目记忆文件。 */
export async function readProject(projectPath: string, name: string): Promise<string> {
  validateProjectFile(name)
  return readOrEmpty(path.join(projectPath, '.dazi', name))
}

/** 写项目记忆文件（原子）。 */
export async function writeProject(
  projectPath: string,
  name: string,
  content: string,
): Promise<void> {
  validateProjectFile(name)
  const dir = path.join(projectPath, '.dazi')
  await fs.mkdir(dir, { recursive: true })
  await writeAtomic(path.join(dir, name), content)
}

/**
 * 对齐 Rust `str::lines()`：按 `\n` 切分，丢弃末尾空片段，并去掉每行尾部的 `\r`
 * （CRLF 文件）。
 */
function splitLines(raw: string): string[] {
  const lines = raw.split('\n')
  if (lines.length > 0 && lines[lines.length - 1] === '') lines.pop()
  return lines.map((l) => (l.endsWith('\r') ? l.slice(0, -1) : l))
}

/**
 * 取 journal.md 末尾 N 个 `## ` 段落，供 prompt 注入（避免过长）。
 *
 * 切分规则严格对齐 Rust `tail_journal`：以行首 `## ` 起新段；首段之前的前言
 * （若有）也算一段。返回值 trim 尾部空白。
 *
 * @param projectPath 项目根目录
 * @param n 取末尾多少段
 */
export async function tailJournal(projectPath: string, n: number): Promise<string> {
  const raw = await readProject(projectPath, 'journal.md')
  if (raw.trim() === '') return ''

  const sections: string[] = []
  let current = ''
  for (const line of splitLines(raw)) {
    if (line.startsWith('## ') && current !== '') {
      sections.push(current)
      current = ''
    }
    current += `${line}\n`
  }
  if (current !== '') sections.push(current)

  return sections.slice(Math.max(0, sections.length - n)).join('').trimEnd()
}

/** 初始化项目记忆目录与占位文件（已存在不覆盖）。 */
export async function initProjectMemory(projectPath: string): Promise<void> {
  const dir = path.join(projectPath, '.dazi')
  await fs.mkdir(dir, { recursive: true })
  for (const name of PROJECT_FILES) {
    const p = path.join(dir, name)
    const exists = await fs
      .access(p)
      .then(() => true)
      .catch(() => false)
    if (!exists) await writeAtomic(p, '')
  }
}
