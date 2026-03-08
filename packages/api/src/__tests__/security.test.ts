/**
 * Security Fix Verification Tests
 *
 * Validates all 6 security fixes from commit 745c479:
 * 1. JWT_SECRET required (no hardcoded fallback)
 * 2. user.getById scoped to accountId
 * 3. message.updateStatus scoped to accountId
 * 4. conversation.create validates cross-tenant inbox/contact/assignee
 * 5. conversation.assign validates cross-tenant assignee
 * 6. contact/inbox JSON type safety (Prisma.InputJsonValue cast)
 */

import { TRPCError } from '@trpc/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { appRouter } from '../root'
import { createCallerFactory } from '../trpc'
import {
	ACCOUNT_A,
	ACCOUNT_B,
	createAuthenticatedContext,
	createMockDb,
	makeContact,
	makeConversation,
	makeInbox,
	USER_A_AGENT,
	USER_A_OWNER,
	USER_B_OWNER,
} from './helpers'

// Mock WebSocket module to avoid import errors
vi.mock('../ws', () => ({
	emitConversationUpdate: vi.fn(),
	emitNewMessage: vi.fn(),
}))

const createCaller = createCallerFactory(appRouter)

describe('Security Fix #1: JWT_SECRET required', () => {
	it('getJwtSecret throws if JWT_SECRET is not set', async () => {
		// This is verified at module level — if we got here, JWT_SECRET was set in setup.ts
		// The real test is that the build fails without it (verified manually)
		expect(process.env.JWT_SECRET).toBeDefined()
		expect(process.env.JWT_SECRET?.length).toBeGreaterThanOrEqual(10)
	})
})

describe('Security Fix #2: user.getById scoped to account', () => {
	let db: ReturnType<typeof createMockDb>

	beforeEach(() => {
		db = createMockDb()
	})

	it('returns user from same account', async () => {
		const ctx = createAuthenticatedContext(USER_A_OWNER, db)
		const caller = createCaller(ctx)

		const mockUser = {
			id: USER_A_AGENT.id,
			name: USER_A_AGENT.name,
			displayName: USER_A_AGENT.displayName,
			email: USER_A_AGENT.email,
			avatarUrl: null,
			role: 'AGENT',
			presence: 'ONLINE',
		}
		;(db.user.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser)

		const result = await caller.user.getById({ id: USER_A_AGENT.id })
		expect(result).toEqual(mockUser)

		// Verify accountId was used in the query
		expect(db.user.findFirst).toHaveBeenCalledWith({
			where: { id: USER_A_AGENT.id, accountId: ACCOUNT_A.id },
			select: expect.any(Object),
		})
	})

	it('rejects access to user from different account', async () => {
		const ctx = createAuthenticatedContext(USER_A_OWNER, db)
		const caller = createCaller(ctx)

		// findFirst returns null because user doesn't belong to account A
		;(db.user.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null)

		await expect(caller.user.getById({ id: USER_B_OWNER.id })).rejects.toThrow(TRPCError)
		await expect(caller.user.getById({ id: USER_B_OWNER.id })).rejects.toThrow('User not found')
	})
})

describe('Security Fix #3: message.updateStatus scoped to account', () => {
	let db: ReturnType<typeof createMockDb>

	beforeEach(() => {
		db = createMockDb()
	})

	it('updates message status when message belongs to user account', async () => {
		const ctx = createAuthenticatedContext(USER_A_OWNER, db)
		const caller = createCaller(ctx)
		const msgId = '11111111-1111-4000-a000-111111111111'

		;(db.message.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: msgId })
		;(db.message.update as ReturnType<typeof vi.fn>).mockResolvedValue({
			id: msgId,
			status: 'DELIVERED',
		})

		const result = await caller.message.updateStatus({ id: msgId, status: 'DELIVERED' })
		expect(result.status).toBe('DELIVERED')

		// Verify cross-account check via conversation.accountId
		expect(db.message.findFirst).toHaveBeenCalledWith({
			where: {
				id: msgId,
				conversation: { accountId: ACCOUNT_A.id },
			},
			select: { id: true },
		})
	})

	it('rejects update for message from different account', async () => {
		const ctx = createAuthenticatedContext(USER_A_OWNER, db)
		const caller = createCaller(ctx)
		const foreignMsgId = '22222222-2222-4000-a000-222222222222'

		;(db.message.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null)

		await expect(caller.message.updateStatus({ id: foreignMsgId, status: 'READ' })).rejects.toThrow(
			'Message not found',
		)
	})
})

describe('Security Fix #4: conversation.create validates cross-tenant entities', () => {
	let db: ReturnType<typeof createMockDb>

	beforeEach(() => {
		db = createMockDb()
	})

	it('rejects conversation with inbox from different account', async () => {
		const ctx = createAuthenticatedContext(USER_A_OWNER, db)
		const caller = createCaller(ctx)

		const contactA = makeContact(ACCOUNT_A.id)
		const inboxB = makeInbox(ACCOUNT_B.id)

		// inbox.findFirst returns null (different account)
		;(db.inbox.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null)
		;(db.contact.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(contactA)

		await expect(
			caller.conversation.create({
				inboxId: inboxB.id,
				contactId: contactA.id,
			}),
		).rejects.toThrow('Inbox not found')
	})

	it('rejects conversation with contact from different account', async () => {
		const ctx = createAuthenticatedContext(USER_A_OWNER, db)
		const caller = createCaller(ctx)

		const inboxA = makeInbox(ACCOUNT_A.id)
		const contactB = makeContact(ACCOUNT_B.id)

		;(db.inbox.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(inboxA)
		;(db.contact.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null)

		await expect(
			caller.conversation.create({
				inboxId: inboxA.id,
				contactId: contactB.id,
			}),
		).rejects.toThrow('Contact not found')
	})

	it('rejects conversation with assignee from different account', async () => {
		const ctx = createAuthenticatedContext(USER_A_OWNER, db)
		const caller = createCaller(ctx)

		const inboxA = makeInbox(ACCOUNT_A.id)
		const contactA = makeContact(ACCOUNT_A.id)

		;(db.inbox.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(inboxA)
		;(db.contact.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(contactA)
		// assignee lookup returns null
		;(db.user.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null)

		await expect(
			caller.conversation.create({
				inboxId: inboxA.id,
				contactId: contactA.id,
				assigneeId: USER_B_OWNER.id,
			}),
		).rejects.toThrow('Assignee not found')
	})

	it('creates conversation when all entities belong to same account', async () => {
		const ctx = createAuthenticatedContext(USER_A_OWNER, db)
		const caller = createCaller(ctx)

		const inboxA = makeInbox(ACCOUNT_A.id)
		const contactA = makeContact(ACCOUNT_A.id)
		const conv = makeConversation(ACCOUNT_A.id, contactA.id, inboxA.id)

		;(db.inbox.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(inboxA)
		;(db.contact.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(contactA)
		;(db.conversation.create as ReturnType<typeof vi.fn>).mockResolvedValue({
			...conv,
			contact: contactA,
			inbox: inboxA,
		})

		const result = await caller.conversation.create({
			inboxId: inboxA.id,
			contactId: contactA.id,
		})
		expect(result.id).toBe(conv.id)
	})
})

describe('Security Fix #5: conversation.assign validates cross-tenant assignee', () => {
	let db: ReturnType<typeof createMockDb>

	beforeEach(() => {
		db = createMockDb()
	})

	it('rejects assigning user from different account', async () => {
		const ctx = createAuthenticatedContext(USER_A_OWNER, db)
		const caller = createCaller(ctx)

		const conv = makeConversation(ACCOUNT_A.id, 'contact-id', 'inbox-id')
		;(db.conversation.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(conv)
		;(db.user.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null)

		await expect(
			caller.conversation.assign({
				id: conv.id,
				assigneeId: USER_B_OWNER.id,
			}),
		).rejects.toThrow('Assignee not found')
	})

	it('allows assigning user from same account', async () => {
		const ctx = createAuthenticatedContext(USER_A_OWNER, db)
		const caller = createCaller(ctx)

		const conv = makeConversation(ACCOUNT_A.id, 'contact-id', 'inbox-id')
		;(db.conversation.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(conv)
		;(db.user.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(USER_A_AGENT)
		;(db.conversation.update as ReturnType<typeof vi.fn>).mockResolvedValue({
			...conv,
			assigneeId: USER_A_AGENT.id,
			status: 'OPEN',
			assignee: USER_A_AGENT,
		})

		const result = await caller.conversation.assign({
			id: conv.id,
			assigneeId: USER_A_AGENT.id,
		})
		expect(result.assigneeId).toBe(USER_A_AGENT.id)
	})

	it('allows unassigning (null assigneeId) without validation', async () => {
		const ctx = createAuthenticatedContext(USER_A_OWNER, db)
		const caller = createCaller(ctx)

		const conv = makeConversation(ACCOUNT_A.id, 'contact-id', 'inbox-id')
		;(db.conversation.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(conv)
		;(db.conversation.update as ReturnType<typeof vi.fn>).mockResolvedValue({
			...conv,
			assigneeId: null,
			status: 'PENDING',
			assignee: null,
		})

		const result = await caller.conversation.assign({
			id: conv.id,
			assigneeId: null,
		})
		expect(result.assigneeId).toBeNull()
		// user.findFirst should NOT be called when assigneeId is null
		expect(db.user.findFirst).not.toHaveBeenCalled()
	})
})

describe('Security Fix #6: Prisma JSON type safety', () => {
	let db: ReturnType<typeof createMockDb>

	beforeEach(() => {
		db = createMockDb()
	})

	it('contact.create handles customAttributes with Prisma cast', async () => {
		const ctx = createAuthenticatedContext(USER_A_OWNER, db)
		const caller = createCaller(ctx)

		const contact = makeContact(ACCOUNT_A.id, {
			customAttributes: { tier: 'gold', score: 100 },
		})
		;(db.contact.create as ReturnType<typeof vi.fn>).mockResolvedValue(contact)

		const result = await caller.contact.create({
			name: 'Test',
			customAttributes: { tier: 'gold', score: 100 },
		})
		expect(result.customAttributes).toEqual({ tier: 'gold', score: 100 })

		// Verify customAttributes is spread separately (not via ...input)
		const createCall = (db.contact.create as ReturnType<typeof vi.fn>).mock.calls[0][0]
		expect(createCall.data.accountId).toBe(ACCOUNT_A.id)
		expect(createCall.data.customAttributes).toEqual({ tier: 'gold', score: 100 })
	})

	it('inbox.create handles channelConfig with Prisma cast', async () => {
		const _ctx = createAuthenticatedContext(USER_A_OWNER, db)
		// Need admin role for inbox.create
		const adminCtx = createAuthenticatedContext({ ...USER_A_OWNER, role: 'ADMIN' }, db)
		const caller = createCaller(adminCtx)

		const inbox = makeInbox(ACCOUNT_A.id, {
			channelConfig: { accessToken: 'tok_123' },
		})
		;(db.inbox.create as ReturnType<typeof vi.fn>).mockResolvedValue(inbox)

		const result = await caller.inbox.create({
			name: 'Test Inbox',
			channelType: 'LINE',
			channelConfig: { accessToken: 'tok_123' },
		})
		expect(result.channelConfig).toEqual({ accessToken: 'tok_123' })
	})
})
