/**
 * 角色与权限矩阵。纯函数、无 IO，Rust 侧 `crates/dazi-daemon/src/team.rs` 必须
 * 逐条对齐这张表（有对齐测试）。
 *
 * 设计取舍：首版只做四个角色、七种权限。approve 故意给到 member 而不是限 admin——
 * 小团队里人人都是 member，若审批要 admin 会把所有人堵死；真正需要"他人计划由他人
 * 批"的场景等 S5 接力棒落地后再谈，那时才知道该按什么维度收紧。
 */

/** 角色由弱到强，数组下标即权力等级，比较用 rank()。 */
export const ROLES = ['viewer', 'member', 'admin', 'owner'] as const
export type Role = (typeof ROLES)[number]

export const PERMISSIONS = [
  'read',
  'write',
  'run',
  'approve',
  'manage_members',
  'manage_devices',
  'transfer_ownership',
] as const
export type Permission = (typeof PERMISSIONS)[number]

/** 每种权限所需的最低角色。 */
const MIN_ROLE: Record<Permission, Role> = {
  read: 'viewer',
  write: 'member',
  run: 'member',
  approve: 'member',
  manage_members: 'admin',
  manage_devices: 'admin',
  transfer_ownership: 'owner',
}

export function rank(role: Role): number {
  return ROLES.indexOf(role)
}

export function isRole(v: unknown): v is Role {
  return typeof v === 'string' && (ROLES as readonly string[]).includes(v)
}

/** 成员状态：suspended 保留记录但一切权限归零（比删除更可追溯）。 */
export const MEMBER_STATUSES = ['active', 'suspended'] as const
export type MemberStatus = (typeof MEMBER_STATUSES)[number]

export function isMemberStatus(v: unknown): v is MemberStatus {
  return typeof v === 'string' && (MEMBER_STATUSES as readonly string[]).includes(v)
}

export interface Member {
  id: string
  name: string
  role: Role
  status: MemberStatus
  createdAt: string
}

/** 判权唯一入口。suspended 成员无论角色一律拒绝。 */
export function can(member: Pick<Member, 'role' | 'status'>, perm: Permission): boolean {
  if (member.status !== 'active') return false
  return rank(member.role) >= rank(MIN_ROLE[perm])
}

/**
 * 能否把目标成员改成某个角色。规则：
 * - 需要 manage_members；
 * - 不能授出高于自己的角色（admin 不能造 owner）；
 * - 不能改动权力 >= 自己的人（admin 不能降另一个 admin 或 owner）；
 * - owner 唯一，转让走 transferOwnership，不能靠改角色制造第二个 owner。
 */
export function canAssignRole(
  actor: Pick<Member, 'id' | 'role' | 'status'>,
  target: Pick<Member, 'id' | 'role'>,
  next: Role,
): boolean {
  if (!can(actor, 'manage_members')) return false
  if (actor.id === target.id) return false
  if (next === 'owner') return false
  if (rank(next) > rank(actor.role)) return false
  if (rank(target.role) >= rank(actor.role)) return false
  return true
}
