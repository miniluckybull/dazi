/** 权限矩阵测试。这张表是安全边界，逐格钉死。 */
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  PERMISSIONS,
  ROLES,
  type Permission,
  type Role,
  can,
  canAssignRole,
  isRole,
  rank,
} from '../src/roles.ts'

const active = (role: Role) => ({ id: `m-${role}`, role, status: 'active' as const })

describe('权限矩阵', () => {
  /** 期望表：每个权限列出被允许的角色，其余一律拒绝。 */
  const ALLOWED: Record<Permission, Role[]> = {
    read: ['viewer', 'member', 'admin', 'owner'],
    write: ['member', 'admin', 'owner'],
    run: ['member', 'admin', 'owner'],
    approve: ['member', 'admin', 'owner'],
    manage_members: ['admin', 'owner'],
    manage_devices: ['admin', 'owner'],
    transfer_ownership: ['owner'],
  }

  it('逐格比对完整矩阵', () => {
    for (const perm of PERMISSIONS) {
      for (const role of ROLES) {
        const expected = ALLOWED[perm].includes(role)
        assert.equal(can(active(role), perm), expected, `${role} × ${perm} 应为 ${expected}`)
      }
    }
  })

  it('suspended 成员一切权限归零，包括 owner', () => {
    for (const role of ROLES) {
      for (const perm of PERMISSIONS) {
        assert.equal(can({ role, status: 'suspended' }, perm), false, `${role} × ${perm}`)
      }
    }
  })

  it('角色等级严格递增', () => {
    assert.deepEqual([...ROLES], ['viewer', 'member', 'admin', 'owner'])
    for (let i = 1; i < ROLES.length; i++) {
      assert.ok(rank(ROLES[i]!) > rank(ROLES[i - 1]!))
    }
  })

  it('isRole 拒绝未知值', () => {
    assert.ok(isRole('admin'))
    for (const bad of ['Owner', 'root', '', 'ADMIN', null, 1, undefined]) {
      assert.equal(isRole(bad), false, String(bad))
    }
  })
})

describe('canAssignRole 提权防线', () => {
  const owner = active('owner')
  const admin = active('admin')
  const member = active('member')
  const viewer = active('viewer')

  it('owner 可以任意升降（除造 owner）', () => {
    assert.ok(canAssignRole(owner, admin, 'member'))
    assert.ok(canAssignRole(owner, viewer, 'admin'))
    assert.equal(canAssignRole(owner, admin, 'owner'), false, '不能制造第二个 owner')
  })

  it('admin 不能造 owner、不能动同级或更高', () => {
    assert.ok(canAssignRole(admin, member, 'admin'))
    assert.equal(canAssignRole(admin, member, 'owner'), false)
    const otherAdmin = { id: 'm-admin-2', role: 'admin' as Role }
    assert.equal(canAssignRole(admin, otherAdmin, 'member'), false, 'admin 不能降同级 admin')
    assert.equal(canAssignRole(admin, owner, 'member'), false, 'admin 不能降 owner')
  })

  it('member/viewer 完全不能改角色', () => {
    assert.equal(canAssignRole(member, viewer, 'member'), false)
    assert.equal(canAssignRole(viewer, viewer, 'admin'), false)
  })

  it('不能改自己（防自我提权与自我降权锁死）', () => {
    assert.equal(canAssignRole(admin, { id: admin.id, role: 'admin' }, 'owner'), false)
    assert.equal(canAssignRole(owner, { id: owner.id, role: 'owner' }, 'admin'), false)
  })

  it('suspended 的 admin 不能改任何人', () => {
    const susp = { id: 'm-x', role: 'admin' as Role, status: 'suspended' as const }
    assert.equal(canAssignRole(susp, member, 'viewer'), false)
  })
})
