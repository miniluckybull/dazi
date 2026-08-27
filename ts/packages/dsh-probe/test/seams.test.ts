/**
 * S1 冒烟：验证 dsh 的两个 gating seam 在进程内真实可用，并把实测到的
 * 约束固化为断言——这些约束决定了 dazi 审批要分两层（见计划文件）。
 *
 * 这不是对 dsh 的测试，而是对「我们依赖的契约」的测试：dsh 是 v0.1 且明示
 * 会破坏兼容，升级时本文件先炸，比在业务代码里炸要好。
 */
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { Context } from '@deepseek-ai/cordis'
import ApprovalService, {
  APPROVAL_POLICIES,
  ApprovalRequestId,
} from '@deepseek-ai/dsh-user-approval'
import UserQuestionService from '@deepseek-ai/dsh-user-questions'

describe('ctx.approval seam', () => {
  it('挂载到 ctx.approval，且 policy 词汇表只有 ask/never', async () => {
    const ctx = new Context()
    await ctx.plugin(ApprovalService, {})

    assert.ok(ctx.approval, 'ctx.approval 应存在')
    assert.equal(typeof ctx.approval.request, 'function')
    assert.equal(typeof ctx.approval.setPolicy, 'function')
    assert.equal(typeof ctx.approval.overrideOf, 'function')

    // 实测约束：只有 ask / never，没有 allow-always、没有授权存储、没有吊销。
    // 「每成员权限档位」因此必须由 dazi 在 answerer 内实现。
    assert.deepEqual([...APPROVAL_POLICIES].sort(), ['ask', 'never'])

    await ctx.fiber.dispose()
  })

  it('ApprovalRequestId 是 branded 字符串构造器', () => {
    assert.equal(ApprovalRequestId('ap1'), 'ap1')
  })
})

describe('ctx.userQuestions seam', () => {
  it('挂载到 ctx.userQuestions 并接受 provider 注册', async () => {
    const ctx = new Context()
    await ctx.plugin(UserQuestionService)

    assert.ok(ctx.userQuestions, 'ctx.userQuestions 应存在')
    const dispose = ctx.userQuestions.registerProvider({
      ask: async () => ({ answers: [{ id: 'q1', selected: ['甲'] }] }),
    })
    assert.equal(typeof dispose, 'function')

    // agentless 程序化调用走 provider 路径（团队版的「路由到持棒人」就挂这里）
    const answer = await ctx.userQuestions.ask({
      questions: [
        {
          id: 'q1',
          question: '这一步要继续吗？',
          options: [{ label: '甲' }, { label: '乙' }],
        },
      ],
    })
    assert.deepEqual(answer.answers, [{ id: 'q1', selected: ['甲'] }])

    dispose()
    await ctx.fiber.dispose()
  })

  it('每 context 仅一个 provider：重复注册抛 DUPLICATE_PROVIDER', async () => {
    const ctx = new Context()
    await ctx.plugin(UserQuestionService)

    const noop = { ask: async () => ({ answers: [] }) }
    const dispose = ctx.userQuestions.registerProvider(noop)
    // 实测约束：无 fan-out。dazi-questions 只能注册唯一 provider，
    // 再在内部按接力棒状态分发给当前持棒人。
    assert.throws(() => ctx.userQuestions.registerProvider(noop), /DUPLICATE_PROVIDER|provider/i)

    dispose()
    await ctx.fiber.dispose()
  })

  it('无 provider 时 ask() 抛 NO_PROVIDER 而非降级', async () => {
    const ctx = new Context()
    await ctx.plugin(UserQuestionService)

    await assert.rejects(
      () => ctx.userQuestions.ask({ questions: [{ id: 'q', question: '？' }] }),
      /NO_PROVIDER|provider/i,
    )

    await ctx.fiber.dispose()
  })
})
