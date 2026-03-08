/**
 * tRPC Router Tests — All Routers
 *
 * Tests happy path + edge cases for:
 * - contact (list, getById, create, update)
 * - conversation (list, getById, create, updateStatus, assign)
 * - message (list, send, updateStatus)
 * - inbox (list, getById, create, update)
 * - user (list, getById, updatePresence, updateProfile)
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { appRouter } from '../root'
import { createCallerFactory } from '../trpc'
import {
	ACCOUNT_A,
	createAuthenticatedContext,
	createMockDb,
	createUnauthenticatedContext,
	makeContact,
	makeConversation,
	makeInbox,
	makeMessage,
	USER_A_AGENT,
	USER_A_OWNER,
} from './helpers'

vi.mock('../ws', () => ({
	emitConversationUpdate: vi.fn(),
	emitNewMessage: vi.fn(),
}))

vi.mock('../libs/auth', async () => {
	const original = await vi.importActual<typeof import('../libs/auth')>('../libs/auth')
	return {
		...original,
		hashPassword: vi.fn().mockResolvedValue('$2a$12$hashedpassword'),
		verifyPassword: vi.fn(),
		createToken: vi.fn().mockResolvedValue('jwt-token-123'),
		generateSessionToken: vi.fn().mockReturnValue('session-token-abc'),
		getSessionExpirationDate: vi.fn().mockReturnValue(new Date('2026-03-15')),
	}
})

const createCaller = createCallerFactory(appRouter)

// ═══════════════════════════════════════════════════════════════
// CONTACT ROUTER
// ═══════════════════════════════════════════════════════════════

describe('contact router', () => {
	let db: ReturnType<typeof createMockDb>

	beforeEach(() => {
		db = createMockDb()
	})

	describe('list', () => {
		it('returns paginated contacts', async () => {
			const ctx = createAuthenticatedContext(USER_A_OWNER, db)
			const caller = createCaller(ctx)

			const contacts = [makeContact(ACCOUNT_A.id), makeContact(ACCOUNT_A.id)]
			;(db.contact.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(contacts)

			const result = await caller.contact.list({ limit: 20 })
			expect(result.items).toHaveLength(2)
			expect(result.nextCursor).toBeUndefined()
		})

		it('returns nextCursor when more items exist', async () => {
			const ctx = createAuthenticatedContext(USER_A_OWNER, db)
			const caller = createCaller(ctx)

			// Return limit + 1 items to signal more exist
			const contacts = Array.from({ length: 3 }, () => makeContact(ACCOUNT_A.id))
			;(db.contact.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(contacts)

			const result = await caller.contact.list({ limit: 2 })
			expect(result.items).toHaveLength(2)
			expect(result.nextCursor).toBeDefined()
		})

		it('filters by search term', async () => {
			const ctx = createAuthenticatedContext(USER_A_OWNER, db)
			const caller = createCaller(ctx)

			;(db.contact.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([])

			await caller.contact.list({ search: 'john', limit: 20 })

			const callArgs = (db.contact.findMany as ReturnType<typeof vi.fn>).mock.calls[0][0]
			expect(callArgs.where.OR).toBeDefined()
			expect(callArgs.where.OR).toHaveLength(3) // name, email, phone
		})

		it('requires authentication', async () => {
			const ctx = createUnauthenticatedContext(db)
			const caller = createCaller(ctx)

			await expect(caller.contact.list({ limit: 20 })).rejects.toThrow('Not authenticated')
		})
	})

	describe('getById', () => {
		it('returns contact with inboxes and conversations', async () => {
			const ctx = createAuthenticatedContext(USER_A_OWNER, db)
			const caller = createCaller(ctx)

			const contact = {
				...makeContact(ACCOUNT_A.id),
				contactInboxes: [],
				conversations: [],
			}
			;(db.contact.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(contact)

			const result = await caller.contact.getById({ id: contact.id })
			expect(result.id).toBe(contact.id)
		})

		it('throws NOT_FOUND for non-existent contact', async () => {
			const ctx = createAuthenticatedContext(USER_A_OWNER, db)
			const caller = createCaller(ctx)

			;(db.contact.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null)

			await expect(
				caller.contact.getById({ id: '99999999-9999-4000-a000-999999999999' }),
			).rejects.toThrow('Contact not found')
		})
	})

	describe('create', () => {
		it('creates contact with customAttributes', async () => {
			const ctx = createAuthenticatedContext(USER_A_OWNER, db)
			const caller = createCaller(ctx)

			const contact = makeContact(ACCOUNT_A.id, {
				customAttributes: { vip: true },
			})
			;(db.contact.create as ReturnType<typeof vi.fn>).mockResolvedValue(contact)

			const result = await caller.contact.create({
				name: 'VIP Customer',
				customAttributes: { vip: true },
			})
			expect(result.customAttributes).toEqual({ vip: true })
		})

		it('creates contact without optional fields', async () => {
			const ctx = createAuthenticatedContext(USER_A_OWNER, db)
			const caller = createCaller(ctx)

			const contact = makeContact(ACCOUNT_A.id)
			;(db.contact.create as ReturnType<typeof vi.fn>).mockResolvedValue(contact)

			const result = await caller.contact.create({ name: 'Simple Contact' })
			expect(result.id).toBeDefined()
		})

		it('rejects empty name', async () => {
			const ctx = createAuthenticatedContext(USER_A_OWNER, db)
			const caller = createCaller(ctx)

			await expect(caller.contact.create({ name: '' })).rejects.toThrow()
		})

		it('rejects invalid email format', async () => {
			const ctx = createAuthenticatedContext(USER_A_OWNER, db)
			const caller = createCaller(ctx)

			await expect(caller.contact.create({ name: 'Test', email: 'not-email' })).rejects.toThrow()
		})
	})

	describe('update', () => {
		it('updates existing contact', async () => {
			const ctx = createAuthenticatedContext(USER_A_OWNER, db)
			const caller = createCaller(ctx)

			const contact = makeContact(ACCOUNT_A.id)
			;(db.contact.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(contact)
			;(db.contact.update as ReturnType<typeof vi.fn>).mockResolvedValue({
				...contact,
				name: 'Updated',
			})

			const result = await caller.contact.update({ id: contact.id, name: 'Updated' })
			expect(result.name).toBe('Updated')
		})

		it('rejects update for non-existent contact', async () => {
			const ctx = createAuthenticatedContext(USER_A_OWNER, db)
			const caller = createCaller(ctx)

			;(db.contact.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null)

			await expect(
				caller.contact.update({
					id: '99999999-9999-4000-a000-999999999999',
					name: 'Updated',
				}),
			).rejects.toThrow('Contact not found')
		})
	})
})

// ═══════════════════════════════════════════════════════════════
// CONVERSATION ROUTER
// ═══════════════════════════════════════════════════════════════

describe('conversation router', () => {
	let db: ReturnType<typeof createMockDb>

	beforeEach(() => {
		db = createMockDb()
	})

	describe('list', () => {
		it('returns conversations with includes', async () => {
			const ctx = createAuthenticatedContext(USER_A_OWNER, db)
			const caller = createCaller(ctx)

			;(db.conversation.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([])

			const result = await caller.conversation.list({ limit: 20 })
			expect(result.items).toEqual([])
		})

		it('filters by status', async () => {
			const ctx = createAuthenticatedContext(USER_A_OWNER, db)
			const caller = createCaller(ctx)

			;(db.conversation.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([])

			await caller.conversation.list({ status: 'OPEN', limit: 20 })

			const callArgs = (db.conversation.findMany as ReturnType<typeof vi.fn>).mock.calls[0][0]
			expect(callArgs.where.status).toBe('OPEN')
		})

		it('filters by assigneeId', async () => {
			const ctx = createAuthenticatedContext(USER_A_OWNER, db)
			const caller = createCaller(ctx)

			;(db.conversation.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([])

			await caller.conversation.list({
				assigneeId: USER_A_AGENT.id,
				limit: 20,
			})

			const callArgs = (db.conversation.findMany as ReturnType<typeof vi.fn>).mock.calls[0][0]
			expect(callArgs.where.assigneeId).toBe(USER_A_AGENT.id)
		})
	})

	describe('getById', () => {
		it('returns conversation with relations', async () => {
			const ctx = createAuthenticatedContext(USER_A_OWNER, db)
			const caller = createCaller(ctx)

			const conv = makeConversation(ACCOUNT_A.id, 'c1', 'i1')
			;(db.conversation.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
				...conv,
				contact: {},
				assignee: null,
				inbox: {},
				team: null,
			})

			const result = await caller.conversation.getById({ id: conv.id })
			expect(result.id).toBe(conv.id)
		})

		it('throws NOT_FOUND for conversation from another account', async () => {
			const ctx = createAuthenticatedContext(USER_A_OWNER, db)
			const caller = createCaller(ctx)

			;(db.conversation.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null)

			await expect(
				caller.conversation.getById({ id: '99999999-9999-4000-a000-999999999999' }),
			).rejects.toThrow('Conversation not found')
		})
	})

	describe('updateStatus', () => {
		it('resolves conversation and resets unreadCount', async () => {
			const ctx = createAuthenticatedContext(USER_A_OWNER, db)
			const caller = createCaller(ctx)

			const conv = makeConversation(ACCOUNT_A.id, 'c1', 'i1')
			;(db.conversation.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(conv)
			;(db.conversation.update as ReturnType<typeof vi.fn>).mockResolvedValue({
				...conv,
				status: 'RESOLVED',
				unreadCount: 0,
			})

			const result = await caller.conversation.updateStatus({
				id: conv.id,
				status: 'RESOLVED',
			})
			expect(result.status).toBe('RESOLVED')
			expect(result.unreadCount).toBe(0)
		})

		it('does not reset unreadCount for non-RESOLVED status', async () => {
			const ctx = createAuthenticatedContext(USER_A_OWNER, db)
			const caller = createCaller(ctx)

			const conv = makeConversation(ACCOUNT_A.id, 'c1', 'i1', { unreadCount: 5 })
			;(db.conversation.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(conv)
			;(db.conversation.update as ReturnType<typeof vi.fn>).mockResolvedValue({
				...conv,
				status: 'OPEN',
			})

			await caller.conversation.updateStatus({ id: conv.id, status: 'OPEN' })

			const updateCall = (db.conversation.update as ReturnType<typeof vi.fn>).mock.calls[0][0]
			expect(updateCall.data.unreadCount).toBeUndefined()
		})
	})

	describe('assign', () => {
		it('sets status to OPEN when assigning', async () => {
			const ctx = createAuthenticatedContext(USER_A_OWNER, db)
			const caller = createCaller(ctx)

			const conv = makeConversation(ACCOUNT_A.id, 'c1', 'i1')
			;(db.conversation.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(conv)
			;(db.user.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(USER_A_AGENT)
			;(db.conversation.update as ReturnType<typeof vi.fn>).mockResolvedValue({
				...conv,
				assigneeId: USER_A_AGENT.id,
				status: 'OPEN',
				assignee: USER_A_AGENT,
			})

			const _result = await caller.conversation.assign({
				id: conv.id,
				assigneeId: USER_A_AGENT.id,
			})

			const updateCall = (db.conversation.update as ReturnType<typeof vi.fn>).mock.calls[0][0]
			expect(updateCall.data.status).toBe('OPEN')
		})

		it('sets status to PENDING when unassigning', async () => {
			const ctx = createAuthenticatedContext(USER_A_OWNER, db)
			const caller = createCaller(ctx)

			const conv = makeConversation(ACCOUNT_A.id, 'c1', 'i1')
			;(db.conversation.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(conv)
			;(db.conversation.update as ReturnType<typeof vi.fn>).mockResolvedValue({
				...conv,
				assigneeId: null,
				status: 'PENDING',
				assignee: null,
			})

			await caller.conversation.assign({ id: conv.id, assigneeId: null })

			const updateCall = (db.conversation.update as ReturnType<typeof vi.fn>).mock.calls[0][0]
			expect(updateCall.data.status).toBe('PENDING')
		})
	})
})

// ═══════════════════════════════════════════════════════════════
// MESSAGE ROUTER
// ═══════════════════════════════════════════════════════════════

describe('message router', () => {
	let db: ReturnType<typeof createMockDb>

	beforeEach(() => {
		db = createMockDb()
	})

	describe('list', () => {
		it('returns messages for conversation in same account', async () => {
			const ctx = createAuthenticatedContext(USER_A_OWNER, db)
			const caller = createCaller(ctx)

			const convId = '11111111-1111-4000-a000-111111111111'
			;(db.conversation.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: convId })
			;(db.message.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([])

			const result = await caller.message.list({ conversationId: convId, limit: 50 })
			expect(result.items).toEqual([])
		})

		it('rejects listing messages from another account conversation', async () => {
			const ctx = createAuthenticatedContext(USER_A_OWNER, db)
			const caller = createCaller(ctx)

			;(db.conversation.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null)

			await expect(
				caller.message.list({
					conversationId: '22222222-2222-4000-a000-222222222222',
					limit: 50,
				}),
			).rejects.toThrow('Conversation not found')
		})
	})

	describe('send', () => {
		it('creates message and updates lastMessageAt', async () => {
			const ctx = createAuthenticatedContext(USER_A_OWNER, db)
			const caller = createCaller(ctx)

			const convId = '11111111-1111-4000-a000-111111111111'
			const msg = makeMessage(convId)

			;(db.conversation.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: convId })
			;(db.$transaction as ReturnType<typeof vi.fn>).mockResolvedValue([msg, {}])

			const result = await caller.message.send({
				conversationId: convId,
				content: 'Hello!',
			})
			expect(result.content).toBe('Hello')
		})

		it('rejects empty message content', async () => {
			const ctx = createAuthenticatedContext(USER_A_OWNER, db)
			const caller = createCaller(ctx)

			await expect(
				caller.message.send({
					conversationId: '11111111-1111-4000-a000-111111111111',
					content: '',
				}),
			).rejects.toThrow()
		})

		it('rejects more than 10 attachments', async () => {
			const ctx = createAuthenticatedContext(USER_A_OWNER, db)
			const caller = createCaller(ctx)

			const attachments = Array.from({ length: 11 }, (_, i) => ({
				type: 'image',
				url: `https://example.com/img${i}.jpg`,
			}))

			await expect(
				caller.message.send({
					conversationId: '11111111-1111-4000-a000-111111111111',
					content: 'Too many files',
					attachments,
				}),
			).rejects.toThrow()
		})
	})
})

// ═══════════════════════════════════════════════════════════════
// INBOX ROUTER
// ═══════════════════════════════════════════════════════════════

describe('inbox router', () => {
	let db: ReturnType<typeof createMockDb>

	beforeEach(() => {
		db = createMockDb()
	})

	describe('list', () => {
		it('returns inboxes with conversation counts', async () => {
			const ctx = createAuthenticatedContext(USER_A_OWNER, db)
			const caller = createCaller(ctx)

			const inbox = { ...makeInbox(ACCOUNT_A.id), _count: { conversations: 5 } }
			;(db.inbox.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([inbox])

			const result = await caller.inbox.list()
			expect(result).toHaveLength(1)
			expect(result[0]._count.conversations).toBe(5)
		})
	})

	describe('create', () => {
		it('requires admin role', async () => {
			const ctx = createAuthenticatedContext(USER_A_AGENT, db) // AGENT, not ADMIN
			const caller = createCaller(ctx)

			await expect(caller.inbox.create({ name: 'Test', channelType: 'LINE' })).rejects.toThrow(
				'Admin access required',
			)
		})

		it('creates inbox with admin role', async () => {
			const ctx = createAuthenticatedContext(USER_A_OWNER, db) // OWNER = admin
			const caller = createCaller(ctx)

			const inbox = makeInbox(ACCOUNT_A.id)
			;(db.inbox.create as ReturnType<typeof vi.fn>).mockResolvedValue(inbox)

			const result = await caller.inbox.create({
				name: 'LINE Support',
				channelType: 'LINE',
			})
			expect(result.channelType).toBe('LINE')
		})

		it('rejects invalid channel type', async () => {
			const ctx = createAuthenticatedContext(USER_A_OWNER, db)
			const caller = createCaller(ctx)

			await expect(
				// @ts-expect-error — testing invalid input
				caller.inbox.create({ name: 'Test', channelType: 'INVALID' }),
			).rejects.toThrow()
		})
	})

	describe('update', () => {
		it('requires admin role', async () => {
			const ctx = createAuthenticatedContext(USER_A_AGENT, db)
			const caller = createCaller(ctx)

			await expect(
				caller.inbox.update({
					id: '11111111-1111-4000-a000-111111111111',
					name: 'Updated',
				}),
			).rejects.toThrow('Admin access required')
		})

		it('rejects update for non-existent inbox', async () => {
			const ctx = createAuthenticatedContext(USER_A_OWNER, db)
			const caller = createCaller(ctx)

			;(db.inbox.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null)

			await expect(
				caller.inbox.update({
					id: '99999999-9999-4000-a000-999999999999',
					name: 'Updated',
				}),
			).rejects.toThrow('Inbox not found')
		})
	})
})

// ═══════════════════════════════════════════════════════════════
// USER ROUTER
// ═══════════════════════════════════════════════════════════════

describe('user router', () => {
	let db: ReturnType<typeof createMockDb>

	beforeEach(() => {
		db = createMockDb()
	})

	describe('list', () => {
		it('returns users from same account', async () => {
			const ctx = createAuthenticatedContext(USER_A_OWNER, db)
			const caller = createCaller(ctx)

			;(db.user.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
				{ id: USER_A_OWNER.id, name: 'Owner', role: 'OWNER' },
				{ id: USER_A_AGENT.id, name: 'Agent', role: 'AGENT' },
			])

			const result = await caller.user.list()
			expect(result).toHaveLength(2)

			// Verify accountId filter
			const callArgs = (db.user.findMany as ReturnType<typeof vi.fn>).mock.calls[0][0]
			expect(callArgs.where.accountId).toBe(ACCOUNT_A.id)
		})
	})

	describe('updatePresence', () => {
		it('updates own presence', async () => {
			const ctx = createAuthenticatedContext(USER_A_OWNER, db)
			const caller = createCaller(ctx)

			;(db.user.update as ReturnType<typeof vi.fn>).mockResolvedValue({
				...USER_A_OWNER,
				presence: 'AWAY',
			})

			const result = await caller.user.updatePresence({ presence: 'AWAY' })
			expect(result.presence).toBe('AWAY')

			// Verify it updates own user, not arbitrary
			const callArgs = (db.user.update as ReturnType<typeof vi.fn>).mock.calls[0][0]
			expect(callArgs.where.id).toBe(USER_A_OWNER.id)
		})

		it('rejects invalid presence value', async () => {
			const ctx = createAuthenticatedContext(USER_A_OWNER, db)
			const caller = createCaller(ctx)

			await expect(
				// @ts-expect-error — testing invalid input
				caller.user.updatePresence({ presence: 'INVISIBLE' }),
			).rejects.toThrow()
		})
	})

	describe('updateProfile', () => {
		it('updates own profile', async () => {
			const ctx = createAuthenticatedContext(USER_A_OWNER, db)
			const caller = createCaller(ctx)

			;(db.user.update as ReturnType<typeof vi.fn>).mockResolvedValue({
				id: USER_A_OWNER.id,
				name: 'New Name',
				displayName: 'Display',
				avatarUrl: null,
			})

			const result = await caller.user.updateProfile({
				name: 'New Name',
				displayName: 'Display',
			})
			expect(result.name).toBe('New Name')
		})

		it('allows nullable displayName and avatarUrl', async () => {
			const ctx = createAuthenticatedContext(USER_A_OWNER, db)
			const caller = createCaller(ctx)

			;(db.user.update as ReturnType<typeof vi.fn>).mockResolvedValue({
				id: USER_A_OWNER.id,
				name: 'Owner',
				displayName: null,
				avatarUrl: null,
			})

			const result = await caller.user.updateProfile({
				displayName: null,
				avatarUrl: null,
			})
			expect(result.displayName).toBeNull()
		})
	})
})
