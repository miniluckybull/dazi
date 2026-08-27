/**
 * 跨进程写入安全：原子写 + 排他锁。
 *
 * 现有 Rust 实现是无锁 read-modify-write（journal.md、meta.yml 的 runs、usage
 * 月文件），多人并发必然静默丢写。这里把锁作为写入层的地基，而不是事后补丁。
 *
 * 依赖仅 node:fs——不引入 proper-lockfile 之类依赖，因为我们只需要
 * 「同目录 O_EXCL 建锁文件 + 陈旧锁回收」这一点点语义。
 */
import { constants as FS } from 'node:fs'
import * as fs from 'node:fs/promises'
import * as path from 'node:path'

/** 超过此年龄的锁视为持有者已崩溃，可抢占（毫秒）。 */
const STALE_LOCK_MS = 30_000
/** 抢锁重试间隔（毫秒）。 */
const RETRY_MS = 50

/** 锁等待超时。调用方应向上抛，不要静默继续写。 */
export class LockTimeoutError extends Error {
  constructor(target: string, timeoutMs: number) {
    super(`获取锁超时（${timeoutMs}ms）: ${target}`)
    this.name = 'LockTimeoutError'
  }
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

/**
 * 原子写：同目录写临时文件再 rename。rename 在同一文件系统内是原子的，
 * 因此读者永远看到旧内容或新内容，不会看到截断的半个文件。
 *
 * 临时文件名带 pid + 随机数，避免并发写者互相覆盖对方的临时文件。
 */
export async function writeAtomic(filePath: string, data: string): Promise<void> {
  const dir = path.dirname(filePath)
  const tmp = path.join(dir, `.${path.basename(filePath)}.${process.pid}.${Math.random().toString(36).slice(2, 8)}.tmp`)
  await fs.mkdir(dir, { recursive: true })
  try {
    await fs.writeFile(tmp, data, 'utf8')
    await fs.rename(tmp, filePath)
  } catch (e) {
    await fs.rm(tmp, { force: true }).catch(() => {})
    throw e
  }
}

/**
 * 持锁执行 fn。锁是 `<target>.lock` 文件，靠 O_EXCL 保证只有一个建成者。
 *
 * 陈旧锁（持有者崩溃未清理）超过 STALE_LOCK_MS 后被抢占——否则一次崩溃会
 * 让该任务永久不可写。
 *
 * @param target 被保护的文件路径（锁文件与它同目录）
 * @param fn 持锁期间执行的操作
 * @param timeoutMs 等锁上限，超时抛 LockTimeoutError
 */
export async function withLock<T>(
  target: string,
  fn: () => Promise<T>,
  timeoutMs = 10_000,
): Promise<T> {
  const lockPath = `${target}.lock`
  await fs.mkdir(path.dirname(target), { recursive: true })
  const deadline = Date.now() + timeoutMs

  for (;;) {
    try {
      const fh = await fs.open(lockPath, FS.O_CREAT | FS.O_EXCL | FS.O_WRONLY)
      await fh.writeFile(`${process.pid}`, 'utf8').catch(() => {})
      await fh.close()
      break
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code !== 'EEXIST') throw e

      // 锁已存在：陈旧则抢占，否则等待。
      const age = await fs
        .stat(lockPath)
        .then((s) => Date.now() - s.mtimeMs)
        .catch(() => 0) // 锁刚被别人释放，重试即可
      if (age > STALE_LOCK_MS) {
        await fs.rm(lockPath, { force: true }).catch(() => {})
        continue
      }
      if (Date.now() >= deadline) throw new LockTimeoutError(target, timeoutMs)
      await sleep(RETRY_MS)
    }
  }

  try {
    return await fn()
  } finally {
    await fs.rm(lockPath, { force: true }).catch(() => {})
  }
}

/**
 * 持锁的 read-modify-write。这是 Rust 侧缺失、导致并发丢写的那个原语：
 * 读、改、原子写全在同一把锁内完成。
 *
 * @param filePath 目标文件
 * @param mutate 接收当前内容（不存在为 undefined），返回新内容；返回
 *   undefined 表示放弃写入
 */
export async function updateAtomic(
  filePath: string,
  mutate: (current: string | undefined) => Promise<string | undefined> | string | undefined,
): Promise<void> {
  await withLock(filePath, async () => {
    const current = await fs.readFile(filePath, 'utf8').catch((e) => {
      if ((e as NodeJS.ErrnoException).code === 'ENOENT') return undefined
      throw e
    })
    const next = await mutate(current)
    if (next === undefined) return
    await writeAtomic(filePath, next)
  })
}

/** 追加一行到 append-only 日志（relay.jsonl 等），持锁保证不交错。 */
export async function appendLine(filePath: string, line: string): Promise<void> {
  await withLock(filePath, async () => {
    await fs.mkdir(path.dirname(filePath), { recursive: true })
    await fs.appendFile(filePath, line.endsWith('\n') ? line : `${line}\n`, 'utf8')
  })
}
