/**
 * 团队存储测试。重点是安全语义：邀请码单次有效、吊销真的断连、停用连带吊销、
 * 旧设备迁移不丢不错绑。全部在隔离 HOME 下跑，绝不碰真实 ~/.dazi。
 */
import assert from 'node:assert/strict'
import * as fs from 'node:fs/promises'
import * as os from 'node:os'
import * as path from 'node:path'
import { after, describe, it } from 'node:test'

import {
  INVITE_TTL_MS,
  addMember,
  bootstrap,
  createInvite,
  genInviteCode,
  hashToken,
  pairWithInvite,
  parseDevices,
  parseTeam,
  readDevices,
  readTeam,
  resolveToken,
  revokeDevice,
  stringifyDevices,
  stringifyTeam,
  suspendMember,
  teamPath,
  devicesPath,
} from '../src/index.ts'

const tmpRoots: string[] = []
after(async () => {
  for (const d of tmpRoots) await fs.rm(d, { recursive: true, force: true })
})

/** 每个用例一个独立 HOME。 */
async function withHome<T>(fn: (home: string) => Promise<T>): Promise<T> {
  const home = await fs.mkdtemp(path.join(os.tmpdir(), 'dazi-team-test-'))
  tmpRoots.push(home)
  await fs.mkdir(path.join(home, '.dazi'), { recursive: true })
  const saved = process.env.HOME
  process.env.HOME = home
  try {
    return await fn(home)
  } finally {
    if (saved === undefined) delete process.env.HOME
    else process.env.HOME = saved
  }
}

describe('bootstrap', () => {
  it('空目录：创建唯一 owner', async () => {
    await withHome(async () => {
      const { owner, migratedDevices } = await bootstrap('Kevin')
      assert.equal(owner.role, 'owner')
      assert.equal(owner.status, 'active')
      assert.equal(owner.name, 'Kevin')
      assert.match(owner.id, /^m-[0-9a-f]{12}$/)
      assert.equal(migratedDevices, 0)
      const team = await readTeam()
      assert.equal(team.members.length, 1)
    })
  })

  it('幂等：重复 bootstrap 不造第二个 owner', async () => {
    await withHome(async () => {
      const a = await bootstrap('Kevin')
      const b = await bootstrap('别人')
      assert.equal(a.owner.id, b.owner.id)
      assert.equal((await readTeam()).members.length, 1)
    })
  })

  it('旧 devices.json（无 id/member_id）补绑到 owner，token 不变', async () => {
    await withHome(async () => {
      // 模拟升级前的真实文件：只有 name/token_hash/paired_at
      const legacyHash = hashToken('legacy-token')
      await fs.writeFile(
        devicesPath(),
        JSON.stringify(
          {
            devices: [
              { name: '我的 iPhone', token_hash: legacyHash, paired_at: '2026-01-01T00:00:00Z' },
            ],
          },
          null,
          2,
        ),
      )
      const { owner, migratedDevices } = await bootstrap('Kevin')
      assert.equal(migratedDevices, 1)
      const [d] = await readDevices()
      assert.ok(d)
      assert.equal(d.memberId, owner.id, '旧设备应绑到 owner')
      assert.match(d.id, /^d-[0-9a-f]{12}$/)
      assert.equal(d.tokenHash, legacyHash, 'token 不能被改动，否则用户手机会断连')
      assert.equal(d.pairedAt, '2026-01-01T00:00:00Z')
      // 老 token 仍然可用，且现在能追溯到人
      const r = await resolveToken('legacy-token')
      assert.equal(r?.member.id, owner.id)
    })
  })
})

describe('邀请码配对', () => {
  it('签发→配对→绑定到正确成员', async () => {
    await withHome(async () => {
      await bootstrap('Kevin')
      const alice = await addMember('Alice', 'member')
      const invite = await createInvite(alice.id)
      assert.equal(invite.memberId, alice.id)
      assert.match(invite.code, /^[A-HJKMNP-Z2-9]{8}$/)

      const { token, device, member } = await pairWithInvite(invite.code, 'Alice 的手机')
      assert.equal(member.id, alice.id)
      assert.equal(device.memberId, alice.id)
      assert.equal(device.tokenHash, hashToken(token))

      const r = await resolveToken(token)
      assert.equal(r?.member.name, 'Alice')
      assert.equal(r?.member.role, 'member')
    })
  })

  it('邀请码单次有效', async () => {
    await withHome(async () => {
      await bootstrap('Kevin')
      const a = await addMember('Alice', 'member')
      const invite = await createInvite(a.id)
      await pairWithInvite(invite.code, '手机1')
      await assert.rejects(() => pairWithInvite(invite.code, '手机2'), /已被使用/)
    })
  })

  it('大小写与空格容错（口头/截图传递现实）', async () => {
    await withHome(async () => {
      await bootstrap('Kevin')
      const a = await addMember('Alice', 'member')
      const invite = await createInvite(a.id)
      const { member } = await pairWithInvite(`  ${invite.code.toLowerCase()} `, '手机')
      assert.equal(member.id, a.id)
    })
  })

  it('过期邀请码被拒', async () => {
    await withHome(async () => {
      await bootstrap('Kevin')
      const a = await addMember('Alice', 'member')
      const invite = await createInvite(a.id)
      // 直接把 expires_at 改到过去
      const team = parseTeam(await fs.readFile(teamPath(), 'utf8'))
      team.invites[0]!.expiresAt = new Date(Date.now() - 1000).toISOString()
      await fs.writeFile(teamPath(), stringifyTeam(team))
      await assert.rejects(() => pairWithInvite(invite.code, '手机'), /已过期/)
    })
  })

  it('TTL 为 24 小时', async () => {
    await withHome(async () => {
      await bootstrap('Kevin')
      const a = await addMember('Alice', 'member')
      const inv = await createInvite(a.id)
      const span = Date.parse(inv.expiresAt) - Date.parse(inv.createdAt)
      assert.equal(span, INVITE_TTL_MS)
      assert.equal(span, 86_400_000)
    })
  })

  it('无效码、不存在的成员、停用成员都被拒', async () => {
    await withHome(async () => {
      await bootstrap('Kevin')
      await assert.rejects(() => pairWithInvite('ZZZZZZZZ', '手机'), /邀请码无效/)
      await assert.rejects(() => createInvite('m-nonexistent'), /成员不存在/)
      const a = await addMember('Alice', 'member')
      await suspendMember(a.id)
      await assert.rejects(() => createInvite(a.id), /已停用/)
    })
  })

  it('重新签发会作废同一成员的旧未用码', async () => {
    await withHome(async () => {
      await bootstrap('Kevin')
      const a = await addMember('Alice', 'member')
      const first = await createInvite(a.id)
      const second = await createInvite(a.id)
      assert.notEqual(first.code, second.code)
      await assert.rejects(() => pairWithInvite(first.code, '手机'), /邀请码无效/)
      const ok = await pairWithInvite(second.code, '手机')
      assert.equal(ok.member.id, a.id)
    })
  })
})

describe('吊销与停用', () => {
  it('吊销设备后 token 立即失效（此前完全缺失的路径）', async () => {
    await withHome(async () => {
      await bootstrap('Kevin')
      const a = await addMember('Alice', 'member')
      const inv = await createInvite(a.id)
      const { token, device } = await pairWithInvite(inv.code, 'Alice 手机')
      assert.ok(await resolveToken(token))

      assert.equal(await revokeDevice(device.id), true)
      assert.equal(await resolveToken(token), undefined, '吊销后必须立刻不可用')
      assert.equal(await revokeDevice(device.id), false, '重复吊销返回 false')
      assert.equal((await readDevices()).length, 0)
    })
  })

  it('吊销只影响目标设备', async () => {
    await withHome(async () => {
      await bootstrap('Kevin')
      const a = await addMember('Alice', 'member')
      const t1 = await pairWithInvite((await createInvite(a.id)).code, '手机')
      const t2 = await pairWithInvite((await createInvite(a.id)).code, '平板')
      await revokeDevice(t1.device.id)
      assert.equal(await resolveToken(t1.token), undefined)
      assert.ok(await resolveToken(t2.token), '另一台设备不应受影响')
    })
  })

  it('停用成员连带吊销其所有设备', async () => {
    await withHome(async () => {
      await bootstrap('Kevin')
      const a = await addMember('Alice', 'member')
      const t1 = await pairWithInvite((await createInvite(a.id)).code, '手机')
      const t2 = await pairWithInvite((await createInvite(a.id)).code, '平板')
      const revoked = await suspendMember(a.id)
      assert.equal(revoked, 2)
      assert.equal(await resolveToken(t1.token), undefined)
      assert.equal(await resolveToken(t2.token), undefined)
      const team = await readTeam()
      assert.equal(team.members.find((m) => m.id === a.id)?.status, 'suspended')
    })
  })

  it('不能停用 owner（防把自己锁在外面）', async () => {
    await withHome(async () => {
      const { owner } = await bootstrap('Kevin')
      await assert.rejects(() => suspendMember(owner.id), /不能停用 owner/)
    })
  })

  it('addMember 拒绝造第二个 owner 与空名', async () => {
    await withHome(async () => {
      await bootstrap('Kevin')
      await assert.rejects(() => addMember('X', 'owner'), /owner 唯一/)
      await assert.rejects(() => addMember('   ', 'member'), /不能为空/)
    })
  })
})

describe('磁盘格式（Rust 侧需按此解析）', () => {
  it('team.json 用 snake_case，2 空格缩进，尾换行', async () => {
    await withHome(async () => {
      const { owner } = await bootstrap('Kevin')
      const raw = await fs.readFile(teamPath(), 'utf8')
      assert.ok(raw.endsWith('\n'))
      assert.ok(raw.includes('"created_at"'), '必须是 snake_case')
      assert.ok(!raw.includes('createdAt'))
      const json = JSON.parse(raw)
      assert.deepEqual(Object.keys(json), ['members', 'invites'])
      assert.deepEqual(Object.keys(json.members[0]), [
        'id',
        'name',
        'role',
        'status',
        'created_at',
      ])
      assert.equal(json.members[0].id, owner.id)
    })
  })

  it('devices.json 保留 devices 数组包裹（兼容旧 Rust DeviceStore）', async () => {
    await withHome(async () => {
      await bootstrap('Kevin')
      const a = await addMember('Alice', 'member')
      await pairWithInvite((await createInvite(a.id)).code, '手机')
      const json = JSON.parse(await fs.readFile(devicesPath(), 'utf8'))
      assert.deepEqual(Object.keys(json), ['devices'])
      assert.deepEqual(Object.keys(json.devices[0]), [
        'id',
        'name',
        'token_hash',
        'member_id',
        'paired_at',
      ])
    })
  })

  it('解析器对损坏与未知数据宽容，但丢弃非法角色', () => {
    assert.deepEqual(parseTeam('{ 坏 json'), { members: [], invites: [] })
    assert.deepEqual(parseTeam(undefined), { members: [], invites: [] })
    assert.deepEqual(parseDevices('null'), [])
    const t = parseTeam(
      JSON.stringify({
        members: [
          { id: 'm-1', name: 'ok', role: 'admin', status: 'active', created_at: 'x' },
          { id: 'm-2', name: '非法角色', role: 'root', status: 'active' },
          { id: 'm-3', name: '缺状态', role: 'member' },
        ],
        unknown_future_field: 1,
      }),
    )
    assert.equal(t.members.length, 1, '非法角色/状态的成员必须丢弃而不是降级放行')
    assert.equal(t.members[0]!.id, 'm-1')
  })

  it('往返稳定', async () => {
    await withHome(async () => {
      await bootstrap('Kevin')
      const a = await addMember('Alice', 'admin')
      await createInvite(a.id)
      const raw = await fs.readFile(teamPath(), 'utf8')
      assert.equal(stringifyTeam(parseTeam(raw)), raw)
      await pairWithInvite((await readTeam()).invites[0]!.code, '手机')
      const draw = await fs.readFile(devicesPath(), 'utf8')
      assert.equal(stringifyDevices(parseDevices(draw)), draw)
    })
  })

  it('邀请码字母表排除易混字符', () => {
    for (let i = 0; i < 200; i++) {
      assert.doesNotMatch(genInviteCode(), /[01OIL]/)
    }
  })
})
