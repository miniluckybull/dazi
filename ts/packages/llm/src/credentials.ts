/**
 * 模型端点凭据：从 `~/.dazi/dsh.env` 读，不入仓库、不进日志。
 *
 * 为什么单独一个文件而不复用 Rust 侧的 `~/.dazi/credentials.json`：那份是 base64
 * 存的 Anthropic 三元组（base_url/api_key/provider），给桌面端「测试模型连通性」
 * 用的；base64 只防误看，且 schema 绑在 Rust struct 上。dsh 侧要的是不同供应商的
 * key，混进同一个文件会让两套代码互相踩 schema。用 KEY=VALUE 纯文本 + 0600，
 * 语义直白，用户能用一行 shell 写出来，也便于日后换成 keychain。
 *
 * 三条硬规则：
 * 1. **key 值绝不出现在返回的错误信息、日志或异常里**——报错只说「哪个变量缺了、
 *    该往哪个文件写」。凭据一旦进了日志就等于泄露，而日志会被复制、粘贴、上传。
 * 2. **不缓存**。用户轮换 key 后不该必须重启 daemon；每次读一遍文件的开销
 *    （几十字节）远小于「改了没生效」带来的困惑。
 * 3. `process.env` 优先于文件——容器/CI 里通常只有环境变量，此时不该强迫用户
 *    先造一个文件。
 */
import * as fs from 'node:fs/promises'
import * as os from 'node:os'
import * as path from 'node:path'

/** 凭据文件路径。可用 DAZI_DSH_ENV 覆盖，便于测试不碰真实 HOME。 */
export function credentialsPath(): string {
  return process.env.DAZI_DSH_ENV ?? path.join(os.homedir(), '.dazi', 'dsh.env')
}

/** 缺凭据是可预期的配置问题，不是 bug——单独一个类型，让上层能给出可操作提示而非堆栈。 */
export class MissingCredentialError extends Error {
  readonly varName: string
  readonly filePath: string

  constructor(varName: string, filePath: string) {
    super(
      `缺少 ${varName}。请在 ${filePath} 中写入 ${varName}=<你的key>（权限 600），` +
        `或设置同名环境变量。`,
    )
    this.name = 'MissingCredentialError'
    this.varName = varName
    this.filePath = filePath
  }
}

/**
 * 解析 KEY=VALUE 文本。
 *
 * 只按**第一个** `=` 切分：key 本身可能含 `=`（base64 尾部的 padding 就是），
 * 按全部 `=` 切会把 key 截断成一个「看起来对但用不了」的值——这种失败最难查。
 *
 * 支持 `#` 注释与 `export ` 前缀（用户可能直接从 .zshrc 里抄一行过来），
 * 并剥掉包裹的引号。刻意**不**支持转义与变量插值：那是 shell 的活，
 * 在这里实现一半只会让行为难以预测。
 */
export function parseEnvText(text: string): Record<string, string> {
  const out: Record<string, string> = {}
  for (const line of text.split('\n')) {
    const s = line.trim()
    if (!s || s.startsWith('#')) continue
    const eq = s.indexOf('=')
    if (eq <= 0) continue // 没有 `=` 或以 `=` 开头，都不是合法赋值
    const key = s.slice(0, eq).trim().replace(/^export\s+/, '')
    let val = s.slice(eq + 1).trim()
    if (val.length >= 2 && (val[0] === '"' || val[0] === "'") && val.at(-1) === val[0]) {
      val = val.slice(1, -1)
    }
    if (key) out[key] = val
  }
  return out
}

/** 读凭据文件；不存在或读不动都回空表——上层会因「变量缺失」报出可操作的错。 */
async function readEnvFile(): Promise<Record<string, string>> {
  try {
    return parseEnvText(await fs.readFile(credentialsPath(), 'utf8'))
  } catch {
    return {}
  }
}

/**
 * 取一个凭据变量。`process.env` 优先，其次凭据文件。
 * 空字符串按缺失处理——一个空 key 会让请求带着 `Bearer ` 发出去，
 * 拿回一个含义模糊的 401，比直接说「你没配」难查得多。
 */
export async function readCredential(varName: string): Promise<string> {
  const fromEnv = process.env[varName]
  if (fromEnv) return fromEnv
  const v = (await readEnvFile())[varName]
  if (!v) throw new MissingCredentialError(varName, credentialsPath())
  return v
}

/** dsh-llm 需要的最小配置。 */
export interface LlmCredentials {
  apiKey: string
  baseURL: string
}

/** DeepSeek 官方端点。用户配了 DEEPSEEK_BASE_URL（如企业网关/中转）则以其为准。 */
const DEEPSEEK_DEFAULT_BASE_URL = 'https://api.deepseek.com'

/**
 * 装配 DeepSeek 凭据。
 *
 * baseURL 可覆盖是刻意的：用户已有的中转（或企业自有网关、本地模型）应当能直接接上，
 * 不该为了换端点去改代码——这也是宣传口径里「不锁定模型供应商」的落地点。
 */
export async function loadDeepSeekCredentials(): Promise<LlmCredentials> {
  const apiKey = await readCredential('DEEPSEEK_API_KEY')
  const env = await readEnvFile()
  const baseURL =
    process.env.DEEPSEEK_BASE_URL || env.DEEPSEEK_BASE_URL || DEEPSEEK_DEFAULT_BASE_URL
  return { apiKey, baseURL }
}

/**
 * 凭据文件权限是否过宽（组或其他用户可读）。
 *
 * 只**报告**不自动修：静默改用户文件的权限位是越权，何况 chmod 也救不回
 * 已经被读过的内容。返回 null 表示文件不存在或平台不适用（Windows 无此语义）。
 */
export async function checkCredentialsPermissions(): Promise<{ mode: string; tooOpen: boolean } | null> {
  if (process.platform === 'win32') return null
  try {
    const st = await fs.stat(credentialsPath())
    const mode = st.mode & 0o777
    return { mode: mode.toString(8).padStart(3, '0'), tooOpen: (mode & 0o077) !== 0 }
  } catch {
    return null
  }
}
