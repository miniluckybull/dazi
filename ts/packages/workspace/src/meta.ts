/**
 * ProjectMeta 与 meta.yml 的字节兼容序列化。
 *
 * 契约来自 Rust 侧 `serde_yaml::to_string(&ProjectMeta)`（crates/dazi-core/src/project.rs）。
 * 实测输出（golden）：
 *
 *   slug: 测试 任务 A          ← CJK 不加引号
 *   name: 测试 任务/A.
 *   status: todo
 *   priority: normal
 *   tags: []                   ← 空数组行内
 *   start_date: null           ← None 序列化为 null，不是省略
 *   ...
 *   created_at: 2026-08-26T08:23:54.047628Z   ← 6 位微秒
 *   runs: []
 *   skills: []
 *
 * 两处必须手工保证、`yaml` 库不会替我们做对的地方：
 *  1. **字段顺序**必须与 Rust struct 声明顺序一致（serde 按声明顺序输出）。
 *     故本模块显式按序构造对象，不依赖对象字面量的隐式顺序。
 *  2. **时间戳精度是 6 位微秒**，而 JS Date 只有毫秒。直接 toISOString() 会
 *     产出 3 位，与 Rust 不同字节。见 {@link formatTimestamp}。
 */
import { parse, stringify } from 'yaml'

/** 定时任务间隔。 */
export interface Interval {
  every: number
  unit: string
}

/** 任务调度设置。 */
export interface Schedule {
  run_at: string | null
  interval: Interval | null
  ends_at: string | null
  max_runs: number | null
  paused: boolean
}

/** 到点触发时的动作。 */
export interface OnTrigger {
  action: string
  model: string | null
}

/** 一条运行记录。`id`/`summary`/`artifacts` 在 Rust 侧带 skip_serializing_if。 */
export interface RunRecord {
  at: string
  action: string
  ok: boolean
  message: string | null
  id?: string
  summary?: string
  artifacts?: string[]
}

/** meta.yml 的完整形状。字段顺序即 Rust struct 声明顺序。 */
export interface ProjectMeta {
  slug: string
  name: string
  status: string
  priority: string
  tags: string[]
  start_date: string | null
  due_date: string | null
  requires_references: boolean
  handed_off_at: string | null
  created_at: string
  updated_at: string
  task_type: string
  schedule: Schedule | null
  on_trigger: OnTrigger | null
  runs: RunRecord[]
  next_run_at: string | null
  skills: string[]
}

export const DEFAULT_STATUS = 'todo'
export const DEFAULT_PRIORITY = 'normal'
export const DEFAULT_TASK_TYPE = 'oneoff'
export const DEFAULT_ACTION = 'notify'

/**
 * 产出与 Rust `chrono::DateTime<Utc>` 一致的时间戳。
 *
 * chrono serde 用 RFC3339 + `SecondsFormat::AutoSi`：小数秒为 0 时**完全省略**
 * 小数部分，否则取 3/6/9 位且不补尾零。故：
 *   - 0 毫秒     → `2026-02-01T00:00:00Z`
 *   - 972 毫秒   → `2026-08-26T08:28:31.972Z`
 *
 * Rust 侧 `Utc::now()` 有微秒精度会输出 6 位（如 `.047628Z`），JS 只有毫秒精度
 * 故最多 3 位——两者都是合法 AutoSi 输出，可互相解析。
 *
 * @param d 时间；默认当前时刻
 */
export function formatTimestamp(d: Date = new Date()): string {
  const iso = d.toISOString() // 总是 .mmmZ
  return d.getUTCMilliseconds() === 0 ? iso.replace(/\.000Z$/, 'Z') : iso
}

/** 显式按 Rust struct 声明顺序重建对象，保证 YAML 键序一致。 */
function ordered(meta: ProjectMeta): Record<string, unknown> {
  const out: Record<string, unknown> = {
    slug: meta.slug,
    name: meta.name,
    status: meta.status,
    priority: meta.priority,
    tags: meta.tags,
    start_date: meta.start_date,
    due_date: meta.due_date,
    requires_references: meta.requires_references,
    handed_off_at: meta.handed_off_at,
    created_at: meta.created_at,
    updated_at: meta.updated_at,
    task_type: meta.task_type,
    schedule: meta.schedule,
    on_trigger: meta.on_trigger,
    runs: meta.runs.map((r) => {
      // 与 Rust 的 skip_serializing_if 对齐：None / 空 Vec 不出现在输出里。
      const rec: Record<string, unknown> = {
        at: r.at,
        action: r.action,
        ok: r.ok,
        message: r.message ?? null,
      }
      if (r.id !== undefined) rec.id = r.id
      if (r.summary !== undefined) rec.summary = r.summary
      if (r.artifacts !== undefined && r.artifacts.length > 0) rec.artifacts = r.artifacts
      return rec
    }),
    next_run_at: meta.next_run_at,
    skills: meta.skills,
  }
  return out
}

/**
 * 序列化为 meta.yml 文本。
 *
 * 三个选项都是为了匹配 serde_yaml 的输出风格，实测交叉验证得出：
 *  - `indentSeq: false` —— serde_yaml 的序列项**不**在父键下缩进（`- a` 而非 `  - a`）
 *  - `lineWidth: 0`     —— 不折行
 *  - `PLAIN` 字符串/键  —— CJK 不加引号
 */
export function stringifyMeta(meta: ProjectMeta): string {
  return stringify(ordered(meta), {
    indentSeq: false,
    lineWidth: 0,
    nullStr: 'null',
    defaultStringType: 'PLAIN',
    defaultKeyType: 'PLAIN',
  })
}

/** 解析 meta.yml，缺省字段按 Rust 侧 `#[serde(default)]` 补齐。 */
export function parseMeta(raw: string): ProjectMeta {
  const d = (parse(raw) ?? {}) as Partial<ProjectMeta>
  if (!d.slug || !d.name) throw new Error('meta.yml 缺少 slug 或 name')
  return {
    slug: d.slug,
    name: d.name,
    status: d.status ?? DEFAULT_STATUS,
    priority: d.priority ?? DEFAULT_PRIORITY,
    tags: d.tags ?? [],
    start_date: d.start_date ?? null,
    due_date: d.due_date ?? null,
    requires_references: d.requires_references ?? false,
    handed_off_at: d.handed_off_at ?? null,
    created_at: d.created_at!,
    updated_at: d.updated_at!,
    task_type: d.task_type ?? DEFAULT_TASK_TYPE,
    schedule: d.schedule ?? null,
    on_trigger: d.on_trigger ?? null,
    runs: d.runs ?? [],
    next_run_at: d.next_run_at ?? null,
    skills: d.skills ?? [],
  }
}
