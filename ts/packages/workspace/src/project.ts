/**
 * 任务即文件夹：workspace 布局与任务创建。
 *
 * 行为对齐 Rust `crates/dazi-core/src/project.rs`：
 *  - `create_project_with` :217 —— 7 步创建流程
 *  - `sanitize_dir_name`   :189 —— 保留中文，替换文件系统禁用字符为空格
 *  - `make_unique_slug`    :169 —— base、base-2 … base-999、base-<epoch>
 *  - `ensure_workspace_layout` :162
 *  - `README_TEMPLATE`     :138
 *
 * 所有写入走 atomic.ts，故 TS 侧从第一行起就是并发安全的。
 */
import * as fs from 'node:fs/promises'
import * as path from 'node:path'

import { writeAtomic } from './atomic.ts'
import {
  DEFAULT_PRIORITY,
  DEFAULT_STATUS,
  DEFAULT_TASK_TYPE,
  formatTimestamp,
  type ProjectMeta,
  parseMeta,
  stringifyMeta,
} from './meta.ts'

/** README 模板。与 Rust README_TEMPLATE 逐字节一致（含 `{{name}}` 占位）。 */
export const README_TEMPLATE = `# {{name}}

> 这份 README 同时也是交给 Claude 的提示词。把背景、目标、约束写清楚，Claude 拿到的上下文就越完整。

## 角色

（希望 Claude 以什么身份介入？例如：资深前端工程师 / 数据分析师 / 文案编辑）

## 背景

（这件事的来龙去脉：从哪儿来、为什么现在做、相关的人或系统）

## 目标

（这次协作要达成的具体结果，越可衡量越好）

## 关键输入

- references/ 下的资料：（列出文件作用，没有就写「暂无」）
- 其它需要 Claude 知道的事实、链接、数据

## 约束与偏好

- （必须遵守的规则：技术栈、风格、不能改的东西）
- （应当避免的做法）

## 交付物

（期望产出什么：文件、代码改动、文档、结论…… 以及格式要求）

## 验收标准

- [ ]
- [ ]

## 备注

`

/** 项目内 `.dazi/` 记忆文件（对齐 memory.rs 的 PROJECT_FILES）。 */
const PROJECT_MEMORY_FILES = ['journal.md', 'context.md'] as const

/** 创建任务时的可选初始字段。 */
export interface ProjectInit {
  status?: string
  priority?: string
  tags?: string[]
  start_date?: string | null
  due_date?: string | null
  requires_references?: boolean
}

export function projectsDir(workspace: string): string {
  return path.join(workspace, 'projects')
}

export function archiveDir(workspace: string): string {
  return path.join(workspace, 'archive')
}

/** 建齐 workspace 三个顶层目录。 */
export async function ensureWorkspaceLayout(workspace: string): Promise<void> {
  for (const sub of ['.dazi', 'projects', 'archive']) {
    await fs.mkdir(path.join(workspace, sub), { recursive: true })
  }
}

/**
 * 清理目录名：替换文件系统禁用字符与控制字符为空格，去首尾空白与点。
 * **保留中文等 Unicode**——这是 dazi 的既有行为，任务名多为中文。
 */
export function sanitizeDirName(input: string): string {
  const cleaned = [...input]
    .map((c) => {
      if ('/\\:*?"<>|'.includes(c)) return ' '
      // 控制字符：C0 与 DEL/C1
      const code = c.codePointAt(0)!
      if (code < 0x20 || (code >= 0x7f && code <= 0x9f)) return ' '
      return c
    })
    .join('')
  return trimDots(cleaned.trim())
}

/** 对齐 Rust `trim_matches('.')`：去掉首尾所有点。 */
function trimDots(s: string): string {
  let start = 0
  let end = s.length
  while (start < end && s[start] === '.') start++
  while (end > start && s[end - 1] === '.') end--
  return s.slice(start, end)
}

const exists = (p: string) =>
  fs
    .lstat(p)
    .then(() => true)
    .catch(() => false)

/**
 * 生成不冲突的 slug：base → base-2 … base-999 → base-<unix 秒>。
 * @param parents 需要同时查重的目录（创建走 projects/，关联走 projects/+archive/）
 */
export async function makeUniqueSlug(parents: string[], base: string): Promise<string> {
  const b = base === '' ? 'project' : base
  const free = async (name: string) => {
    for (const p of parents) if (await exists(path.join(p, name))) return false
    return true
  }
  if (await free(b)) return b
  for (let n = 2; n < 1000; n++) {
    const candidate = `${b}-${n}`
    if (await free(candidate)) return candidate
  }
  return `${b}-${Math.floor(Date.now() / 1000)}`
}

/** 初始化项目内记忆文件（已存在则不覆盖）。 */
async function initProjectMemory(projectPath: string): Promise<void> {
  const dir = path.join(projectPath, '.dazi')
  await fs.mkdir(dir, { recursive: true })
  for (const name of PROJECT_MEMORY_FILES) {
    const p = path.join(dir, name)
    if (!(await exists(p))) await writeAtomic(p, '')
  }
}

/** 创建结果。字段取 Rust ProjectSummary 中创建路径会用到的部分。 */
export interface CreatedProject {
  slug: string
  name: string
  path: string
  meta: ProjectMeta
}

/**
 * 新建任务 = 新建一个任务文件夹。步骤与 Rust `create_project_with` 对齐：
 * 校验名称 → 建 workspace 布局 → 定 slug → 建三个子目录 → 初始化记忆
 * → 写 meta.yml → 写 README.md。
 *
 * @param workspace workspace 根目录
 * @param name 任务名（可含中文；两端空白会被去掉）
 * @param init 可选初始字段
 */
export async function createProject(
  workspace: string,
  name: string,
  init: ProjectInit = {},
): Promise<CreatedProject> {
  const trimmed = name.trim()
  if (trimmed === '') throw new Error('名称不能为空')

  await ensureWorkspaceLayout(workspace)
  const parent = projectsDir(workspace)
  const slug = await makeUniqueSlug([parent], sanitizeDirName(trimmed))
  const projectPath = path.join(parent, slug)

  for (const sub of ['references', 'notes', 'output']) {
    await fs.mkdir(path.join(projectPath, sub), { recursive: true })
  }
  await initProjectMemory(projectPath)

  const now = formatTimestamp()
  const meta: ProjectMeta = {
    slug,
    name: trimmed,
    status: init.status ?? DEFAULT_STATUS,
    priority: init.priority ?? DEFAULT_PRIORITY,
    tags: init.tags ?? [],
    start_date: init.start_date ?? null,
    due_date: init.due_date ?? null,
    requires_references: init.requires_references ?? false,
    handed_off_at: null,
    created_at: now,
    updated_at: now,
    task_type: DEFAULT_TASK_TYPE,
    schedule: null,
    on_trigger: null,
    runs: [],
    next_run_at: null,
    skills: [],
  }
  await writeMeta(projectPath, meta)
  await writeAtomic(path.join(projectPath, 'README.md'), README_TEMPLATE.replace('{{name}}', trimmed))

  return { slug, name: trimmed, path: projectPath, meta }
}

/** 写 meta.yml（原子）。 */
export async function writeMeta(projectPath: string, meta: ProjectMeta): Promise<void> {
  await writeAtomic(path.join(projectPath, 'meta.yml'), stringifyMeta(meta))
}

/** 读 meta.yml。 */
export async function readMeta(projectPath: string): Promise<ProjectMeta> {
  return parseMeta(await fs.readFile(path.join(projectPath, 'meta.yml'), 'utf8'))
}
