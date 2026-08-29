/**
 * 团队身份存储。磁盘格式必须与 Rust 侧 `crates/dazi-daemon/src/team.rs` 一致。
 *
 * 文件划分（沿用既有惯例，不动已有文件的位置）：
 * - `~/.dazi/team.json`    成员与邀请码（本包新增）
 * - `~/.dazi/devices.json` 已配对设备，新增 `id` 与 `member_id` 两个字段（向后兼容读取）
 *
 * JSON 字段用 snake_case，与 serde 默认的 Rust 字段名对齐；TS 内部用 camelCase，
 * 在 read/write 边界转换——与 @dazi/workspace 处理 meta.yml 的做法相同。
 *
 * 全部写入走 updateAtomic：team.json 是安全关键文件，一次写坏就是全员失联，
 * 临时文件 + rename 的代价可以忽略。
 */
import * as crypto from 'node:crypto'
import * as os from 'node:os'
import * as path from 'node:path'

import { updateAtomic } from '@dazi/workspace'

import { type Member, type Role, isMemberStatus, isRole } from './roles.ts'

/** 邀请码有效期。够一次线下/IM 交付，过期即失效。 */
export const INVITE_TTL_MS = 24 * 60 * 60 * 1000

/** 邀请码字母表：去掉了 0/O/1/I/L，避免口头或截图传递时认错。 */
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
const CODE_LEN = 8

export interface Invite {
  code: string
  memberId: string
  createdAt: string
  expiresAt: string
  usedAt?: string
}

export interface Device {
  id: string
  name: string
  tokenHash: string
  /** 归属成员。旧数据没有此字段，bootstrap 时补绑到 owner。 */
  memberId: string
  pairedAt: string
}

export interface Team {
  members: Member[]
  invites: Invite[]
}

export function daziDir(): string {
  return path.join(os.homedir(), '.dazi')
}
export const teamPath = () => path.join(daziDir(), 'team.json')
export const devicesPath = () => path.join(daziDir(), 'devices.json')

function nowIso(): string {
  // 与 @dazi/workspace 的时间戳惯例一致（0ms 时省略小数部分）
  const d = new Date()
  const iso = d.toISOString()
  return d.getUTCMilliseconds() === 0 ? iso.replace(/\.000Z$/, 'Z') : iso
}

/** 随机 id：`m-`/`d-` 前缀 + 12 位 hex，便于日志里一眼分辨类型。 */
function genId(prefix: 'm' | 'd'): string {
  return `${prefix}-${crypto.randomBytes(6).toString('hex')}`
}

export function genInviteCode(): string {
  const bytes = crypto.randomBytes(CODE_LEN)
  let out = ''
  for (let i = 0; i < CODE_LEN; i++) {
    // rejection-free 取模：字母表 31 个字符，256 % 31 有偏但可忽略；
    // 邀请码是短时单次凭证，且服务端限次，此处不需要密码学级均匀分布。
    out += CODE_ALPHABET[bytes[i]! % CODE_ALPHABET.length]
  }
  return out
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token, 'utf8').digest('hex')
}

/** 32 字节随机 device_token，hex 编码——与 Rust 侧 gen_token 一致。 */
export function genDeviceToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

// ---------- 解析（对未知/损坏数据保持宽容，但不放过角色与状态） ----------

function parseMember(v: unknown): Member | undefined {
  if (typeof v !== 'object' || v === null) return undefined
  const o = v as Record<string, unknown>
  if (typeof o.id !== 'string' || typeof o.name !== 'string') return undefined
  if (!isRole(o.role) || !isMemberStatus(o.status)) return undefined
  return {
    id: o.id,
    name: o.name,
    role: o.role,
    status: o.status,
    createdAt: typeof o.created_at === 'string' ? o.created_at : nowIso(),
  }
}

function parseInvite(v: unknown): Invite | undefined {
  if (typeof v !== 'object' || v === null) return undefined
  const o = v as Record<string, unknown>
  if (typeof o.code !== 'string' || typeof o.member_id !== 'string') return undefined
  if (typeof o.expires_at !== 'string') return undefined
  return {
    code: o.code,
    memberId: o.member_id,
    createdAt: typeof o.created_at === 'string' ? o.created_at : nowIso(),
    expiresAt: o.expires_at,
    ...(typeof o.used_at === 'string' ? { usedAt: o.used_at } : {}),
  }
}

export function parseTeam(raw: string | undefined): Team {
  if (!raw?.trim()) return { members: [], invites: [] }
  let json: unknown
  try {
    json = JSON.parse(raw)
  } catch {
    return { members: [], invites: [] }
  }
  const o = (typeof json === 'object' && json !== null ? json : {}) as Record<string, unknown>
  const members = Array.isArray(o.members)
    ? o.members.map(parseMember).filter((m): m is Member => m !== undefined)
    : []
  const invites = Array.isArray(o.invites)
    ? o.invites.map(parseInvite).filter((i): i is Invite => i !== undefined)
    : []
  return { members, invites }
}

export function stringifyTeam(team: Team): string {
  return `${JSON.stringify(
    {
      members: team.members.map((m) => ({
        id: m.id,
        name: m.name,
        role: m.role,
        status: m.status,
        created_at: m.createdAt,
      })),
      invites: team.invites.map((i) => ({
        code: i.code,
        member_id: i.memberId,
        created_at: i.createdAt,
        expires_at: i.expiresAt,
        ...(i.usedAt ? { used_at: i.usedAt } : {}),
      })),
    },
    null,
    2,
  )}\n`
}

function parseDevice(v: unknown): Device | undefined {
  if (typeof v !== 'object' || v === null) return undefined
  const o = v as Record<string, unknown>
  if (typeof o.name !== 'string' || typeof o.token_hash !== 'string') return undefined
  return {
    // 旧数据无 id/member_id，先留空串，由 bootstrap 补齐
    id: typeof o.id === 'string' ? o.id : '',
    name: o.name,
    tokenHash: o.token_hash,
    memberId: typeof o.member_id === 'string' ? o.member_id : '',
    pairedAt: typeof o.paired_at === 'string' ? o.paired_at : nowIso(),
  }
}

export function parseDevices(raw: string | undefined): Device[] {
  if (!raw?.trim()) return []
  let json: unknown
  try {
    json = JSON.parse(raw)
  } catch {
    return []
  }
  const o = (typeof json === 'object' && json !== null ? json : {}) as Record<string, unknown>
  return Array.isArray(o.devices)
    ? o.devices.map(parseDevice).filter((d): d is Device => d !== undefined)
    : []
}

export function stringifyDevices(devices: Device[]): string {
  return `${JSON.stringify(
    {
      devices: devices.map((d) => ({
        id: d.id,
        name: d.name,
        token_hash: d.tokenHash,
        member_id: d.memberId,
        paired_at: d.pairedAt,
      })),
    },
    null,
    2,
  )}\n`
}

// ---------- 变更操作 ----------

export interface BootstrapResult {
  owner: Member
  /** 补绑到 owner 的旧设备数量（首次升级时 > 0）。 */
  migratedDevices: number
}

/**
 * 首次启动引导：若无任何成员，创建唯一 owner，并把历史遗留设备补绑给它。
 *
 * 把旧设备判为 owner 是可辩护的：配对必须先拿到只打印在本机终端的 PIN，
 * 能配上的人本就物理控制着这台机器。若改为一律失效，用户自己的手机会突然断连；
 * 若留作匿名，则永远无法追溯归属。
 */
export async function bootstrap(ownerName: string): Promise<BootstrapResult> {
  let owner: Member | undefined
  await updateAtomic(teamPath(), (raw) => {
    const team = parseTeam(raw)
    const existing = team.members.find((m) => m.role === 'owner')
    if (existing) {
      owner = existing
      return undefined // 无需写入
    }
    owner = {
      id: genId('m'),
      name: ownerName,
      role: 'owner',
      status: 'active',
      createdAt: nowIso(),
    }
    team.members.push(owner)
    return stringifyTeam(team)
  })
  if (!owner) throw new Error('bootstrap 未能确定 owner')
  const ownerId = owner.id

  let migrated = 0
  await updateAtomic(devicesPath(), (raw) => {
    const devices = parseDevices(raw)
    let changed = false
    for (const d of devices) {
      if (!d.id) {
        d.id = genId('d')
        changed = true
      }
      if (!d.memberId) {
        d.memberId = ownerId
        migrated++
        changed = true
      }
    }
    return changed ? stringifyDevices(devices) : undefined
  })

  return { owner, migratedDevices: migrated }
}

export async function readTeam(): Promise<Team> {
  const { readFile } = await import('node:fs/promises')
  try {
    return parseTeam(await readFile(teamPath(), 'utf8'))
  } catch {
    return { members: [], invites: [] }
  }
}

export async function readDevices(): Promise<Device[]> {
  const { readFile } = await import('node:fs/promises')
  try {
    return parseDevices(await readFile(devicesPath(), 'utf8'))
  } catch {
    return []
  }
}

export async function addMember(name: string, role: Role): Promise<Member> {
  if (!name.trim()) throw new Error('成员名不能为空')
  if (role === 'owner') throw new Error('owner 唯一，不能新增；请用 transferOwnership')
  const member: Member = {
    id: genId('m'),
    name: name.trim(),
    role,
    status: 'active',
    createdAt: nowIso(),
  }
  await updateAtomic(teamPath(), (raw) => {
    const team = parseTeam(raw)
    team.members.push(member)
    return stringifyTeam(team)
  })
  return member
}

/** 签发单次邀请码。同一成员的旧未用邀请会被作废，避免多码并存。 */
export async function createInvite(memberId: string): Promise<Invite> {
  const now = Date.now()
  let invite: Invite | undefined
  await updateAtomic(teamPath(), (raw) => {
    const team = parseTeam(raw)
    const member = team.members.find((m) => m.id === memberId)
    if (!member) throw new Error(`成员不存在: ${memberId}`)
    if (member.status !== 'active') throw new Error('成员已停用，不能签发邀请码')
    invite = {
      code: genInviteCode(),
      memberId,
      createdAt: new Date(now).toISOString().replace(/\.000Z$/, 'Z'),
      expiresAt: new Date(now + INVITE_TTL_MS).toISOString().replace(/\.000Z$/, 'Z'),
    }
    team.invites = team.invites.filter((i) => i.memberId !== memberId || i.usedAt)
    team.invites.push(invite)
    return stringifyTeam(team)
  })
  if (!invite) throw new Error('签发邀请码失败')
  return invite
}

export interface PairResult {
  token: string
  device: Device
  member: Member
}

/**
 * 用邀请码配对，签发 device_token 并把设备绑定到邀请对应的成员。
 * 邀请码单次有效：核销与设备落盘之间若崩溃，宁可让码作废（用户重新要一个），
 * 也不能留下可复用的码。
 */
export async function pairWithInvite(code: string, deviceName: string): Promise<PairResult> {
  const normalized = code.trim().toUpperCase()
  if (!deviceName.trim()) throw new Error('设备名不能为空')

  let member: Member | undefined
  await updateAtomic(teamPath(), (raw) => {
    const team = parseTeam(raw)
    const invite = team.invites.find((i) => i.code === normalized)
    if (!invite) throw new Error('邀请码无效')
    if (invite.usedAt) throw new Error('邀请码已被使用')
    if (Date.parse(invite.expiresAt) <= Date.now()) throw new Error('邀请码已过期')
    const m = team.members.find((x) => x.id === invite.memberId)
    if (!m) throw new Error('邀请码对应的成员已不存在')
    if (m.status !== 'active') throw new Error('成员已停用')
    invite.usedAt = nowIso()
    member = m
    return stringifyTeam(team)
  })
  if (!member) throw new Error('配对失败')

  const token = genDeviceToken()
  const device: Device = {
    id: genId('d'),
    name: deviceName.trim(),
    tokenHash: hashToken(token),
    memberId: member.id,
    pairedAt: nowIso(),
  }
  await updateAtomic(devicesPath(), (raw) => {
    const devices = parseDevices(raw)
    devices.push(device)
    return stringifyDevices(devices)
  })
  return { token, device, member }
}

/** 吊销设备——此前整个产品里缺失的那条路径。返回是否真的删掉了一条。 */
export async function revokeDevice(deviceId: string): Promise<boolean> {
  let removed = false
  await updateAtomic(devicesPath(), (raw) => {
    const devices = parseDevices(raw)
    const next = devices.filter((d) => d.id !== deviceId)
    if (next.length === devices.length) return undefined
    removed = true
    return stringifyDevices(next)
  })
  return removed
}

/** 停用成员，并连带吊销其全部设备（否则停用只是摆设）。 */
export async function suspendMember(memberId: string): Promise<number> {
  await updateAtomic(teamPath(), (raw) => {
    const team = parseTeam(raw)
    const m = team.members.find((x) => x.id === memberId)
    if (!m) throw new Error(`成员不存在: ${memberId}`)
    if (m.role === 'owner') throw new Error('不能停用 owner')
    if (m.status === 'suspended') return undefined
    m.status = 'suspended'
    return stringifyTeam(team)
  })
  let revoked = 0
  await updateAtomic(devicesPath(), (raw) => {
    const devices = parseDevices(raw)
    const next = devices.filter((d) => d.memberId !== memberId)
    revoked = devices.length - next.length
    return revoked > 0 ? stringifyDevices(next) : undefined
  })
  return revoked
}

/** token → 成员。鉴权唯一入口：设备存在且成员 active 才算通过。 */
export async function resolveToken(
  token: string,
): Promise<{ device: Device; member: Member } | undefined> {
  if (!token) return undefined
  const hash = hashToken(token)
  const [devices, team] = await Promise.all([readDevices(), readTeam()])
  const device = devices.find((d) => d.tokenHash === hash)
  if (!device) return undefined
  const member = team.members.find((m) => m.id === device.memberId)
  if (!member || member.status !== 'active') return undefined
  return { device, member }
}
