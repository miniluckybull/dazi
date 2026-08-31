/**
 * 凭据读取测试。全部在临时目录下跑，靠 DAZI_DSH_ENV 指向假文件，
 * 绝不碰真实 ~/.dazi/dsh.env——测试读到用户真 key 是最不该发生的事。
 *
 * 断言里用的都是假 key（`sk-test-*`），任何真值都不该出现在仓库中。
 */
import assert from 'node:assert/strict'
import * as fs from 'node:fs/promises'
import * as os from 'node:os'
import * as path from 'node:path'
import { afterEach, describe, it } from 'node:test'

import {
  MissingCredentialError,
  checkCredentialsPermissions,
  credentialsPath,
  loadDeepSeekCredentials,
  parseEnvText,
  readCredential,
} from '../src/index.ts'

const saved = { ...process.env }
const tmps: string[] = []

async function withEnvFile(content: string, mode = 0o600): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'dazi-llm-'))
  tmps.push(dir)
  const p = path.join(dir, 'dsh.env')
  await fs.writeFile(p, content, { mode })
  process.env.DAZI_DSH_ENV = p
  return p
}

afterEach(async () => {
  for (const k of Object.keys(process.env)) if (!(k in saved)) delete process.env[k]
  Object.assign(process.env, saved)
  await Promise.all(tmps.splice(0).map((d) => fs.rm(d, { recursive: true, force: true })))
})

describe('parseEnvText', () => {
  it('只按第一个 = 切分，key 里的 = 不被截断', () => {
    // base64 尾部 padding 就带 =，按全部 = 切会得到一个「像对的」错值。
    const got = parseEnvText('DEEPSEEK_API_KEY=sk-test-a=b==\n')
    assert.equal(got.DEEPSEEK_API_KEY, 'sk-test-a=b==')
  })

  it('容忍 export 前缀、引号、注释与空行', () => {
    const got = parseEnvText(
      ['# 注释', '', 'export DEEPSEEK_API_KEY="sk-test-1"', "DEEPSEEK_BASE_URL='https://x/'", '=bad', 'NOEQ'].join('\n'),
    )
    assert.deepEqual(got, { DEEPSEEK_API_KEY: 'sk-test-1', DEEPSEEK_BASE_URL: 'https://x/' })
  })
})

describe('readCredential', () => {
  it('从文件读到值', async () => {
    await withEnvFile('DEEPSEEK_API_KEY=sk-test-file\n')
    delete process.env.DEEPSEEK_API_KEY
    assert.equal(await readCredential('DEEPSEEK_API_KEY'), 'sk-test-file')
  })

  it('process.env 优先于文件', async () => {
    await withEnvFile('DEEPSEEK_API_KEY=sk-test-file\n')
    process.env.DEEPSEEK_API_KEY = 'sk-test-env'
    assert.equal(await readCredential('DEEPSEEK_API_KEY'), 'sk-test-env')
  })

  it('文件缺失时报可操作的错，且不泄露 key', async () => {
    process.env.DAZI_DSH_ENV = path.join(os.tmpdir(), 'dazi-not-exist', 'dsh.env')
    delete process.env.DEEPSEEK_API_KEY
    await assert.rejects(() => readCredential('DEEPSEEK_API_KEY'), (e: unknown) => {
      assert.ok(e instanceof MissingCredentialError)
      // 错误信息要含变量名与路径（用户据此知道该干什么），仅此而已。
      assert.match(e.message, /DEEPSEEK_API_KEY/)
      assert.match(e.message, /dsh\.env/)
      return true
    })
  })

  it('空值按缺失处理', async () => {
    // 空 key 会让请求带 `Bearer ` 发出去，换回一个语义模糊的 401，比明说「没配」难查。
    await withEnvFile('DEEPSEEK_API_KEY=\n')
    delete process.env.DEEPSEEK_API_KEY
    await assert.rejects(() => readCredential('DEEPSEEK_API_KEY'), MissingCredentialError)
  })

  it('不缓存：轮换 key 后立刻生效', async () => {
    const p = await withEnvFile('DEEPSEEK_API_KEY=sk-test-old\n')
    delete process.env.DEEPSEEK_API_KEY
    assert.equal(await readCredential('DEEPSEEK_API_KEY'), 'sk-test-old')
    await fs.writeFile(p, 'DEEPSEEK_API_KEY=sk-test-new\n')
    assert.equal(await readCredential('DEEPSEEK_API_KEY'), 'sk-test-new')
  })
})

describe('loadDeepSeekCredentials', () => {
  it('baseURL 默认官方端点', async () => {
    await withEnvFile('DEEPSEEK_API_KEY=sk-test-1\n')
    delete process.env.DEEPSEEK_API_KEY
    delete process.env.DEEPSEEK_BASE_URL
    assert.deepEqual(await loadDeepSeekCredentials(), {
      apiKey: 'sk-test-1',
      baseURL: 'https://api.deepseek.com',
    })
  })

  it('文件里的 DEEPSEEK_BASE_URL 能覆盖默认端点', async () => {
    // 用户已有的中转/企业网关应当直接接上，不必改代码。
    await withEnvFile('DEEPSEEK_API_KEY=sk-test-1\nDEEPSEEK_BASE_URL=https://relay.example/v1\n')
    delete process.env.DEEPSEEK_API_KEY
    delete process.env.DEEPSEEK_BASE_URL
    const got = await loadDeepSeekCredentials()
    assert.equal(got.baseURL, 'https://relay.example/v1')
  })
})

describe('checkCredentialsPermissions', () => {
  it('0600 不算过宽，0644 算', async (t) => {
    if (process.platform === 'win32') return t.skip('Windows 无 Unix 权限位语义')
    await withEnvFile('DEEPSEEK_API_KEY=sk-test-1\n', 0o600)
    assert.deepEqual(await checkCredentialsPermissions(), { mode: '600', tooOpen: false })
    await fs.chmod(credentialsPath(), 0o644)
    const loose = await checkCredentialsPermissions()
    assert.equal(loose?.tooOpen, true)
  })

  it('文件不存在时回 null 而非抛', async () => {
    process.env.DAZI_DSH_ENV = path.join(os.tmpdir(), 'dazi-not-exist', 'dsh.env')
    assert.equal(await checkCredentialsPermissions(), null)
  })
})
