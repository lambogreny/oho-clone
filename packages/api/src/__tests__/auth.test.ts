/**
 * Auth Flow Tests
 *
 * Tests register, signIn, signOut, me, changePassword
 * Uses the real auth module (JWT_SECRET set in setup.ts)
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { appRouter } from '../root'
import { createCallerFactory } from '../trpc'
import {
	ACCOUNT_A,
	createAuthenticatedContext,
	createMockDb,
	createUnauthenticatedContext,
	USER_A_OWNER,
} from './helpers'

vi.mock('../ws', () => ({
	emitConversationUpdate: vi.fn(),
	emitNewMessage: vi.fn(),
}))

// Mock bcryptjs at the npm module level
vi.mock('bcryptjs', () => ({
	hash: vi.fn().mockResolvedValue('$2a$12$hashedpassword'),
	compare: vi.fn(),
}))

import { compare } from 'bcryptjs'

const createCaller = createCallerFactory(appRouter)

describe('auth.register', () => {
	let db: ReturnType<typeof createMockDb>

	beforeEach(() => {
		db = createMockDb()
		vi.clearAllMocks()
	})

	it('creates account, user, and session in transaction', async () => {
		const ctx = createUnauthenticatedContext(db)
		const caller = createCaller(ctx)

		;(db.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null)

		;(db.$transaction as ReturnType<typeof vi.fn>).mockImplementation(
			async (fn: (tx: unknown) => Promise<unknown>) => {
				const tx = {
					account: {
						create: vi.fn().mockResolvedValue({ id: 'new-account-id', name: 'New Acct' }),
					},
					user: {
						create: vi.fn().mockResolvedValue({
							id: 'new-user-id',
							accountId: 'new-account-id',
							email: 'new@test.com',
							name: 'New User',
							displayName: 'New User',
							role: 'OWNER',
						}),
					},
					session: { create: vi.fn().mockResolvedValue({}) },
				}
				return fn(tx)
			},
		)

		const result = await caller.auth.register({
			accountName: 'New Acct',
			name: 'New User',
			email: 'new@test.com',
			password: 'securepassword123',
		})

		expect(result.token).toBeDefined()
		expect(result.user.email).toBe('new@test.com')
		expect(result.user.role).toBe('OWNER')
	})

	it('rejects duplicate email', async () => {
		const ctx = createUnauthenticatedContext(db)
		const caller = createCaller(ctx)

		;(db.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'existing' })

		await expect(
			caller.auth.register({
				accountName: 'Acct',
				name: 'User',
				email: 'existing@test.com',
				password: 'password123',
			}),
		).rejects.toThrow('Email already registered')
	})

	it('rejects weak password (less than 8 chars)', async () => {
		const ctx = createUnauthenticatedContext(db)
		const caller = createCaller(ctx)

		await expect(
			caller.auth.register({
				accountName: 'Acct',
				name: 'User',
				email: 'test@test.com',
				password: 'short',
			}),
		).rejects.toThrow()
	})

	it('rejects empty account name', async () => {
		const ctx = createUnauthenticatedContext(db)
		const caller = createCaller(ctx)

		await expect(
			caller.auth.register({
				accountName: '',
				name: 'User',
				email: 'test@test.com',
				password: 'password123',
			}),
		).rejects.toThrow()
	})

	it('rejects invalid email format', async () => {
		const ctx = createUnauthenticatedContext(db)
		const caller = createCaller(ctx)

		await expect(
			caller.auth.register({
				accountName: 'Acct',
				name: 'User',
				email: 'not-an-email',
				password: 'password123',
			}),
		).rejects.toThrow()
	})
})

describe('auth.signIn', () => {
	let db: ReturnType<typeof createMockDb>

	beforeEach(() => {
		db = createMockDb()
		vi.clearAllMocks()
	})

	it('returns token on valid credentials', async () => {
		const ctx = createUnauthenticatedContext(db)
		const caller = createCaller(ctx)

		;(db.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
			id: USER_A_OWNER.id,
			accountId: ACCOUNT_A.id,
			email: USER_A_OWNER.email,
			name: USER_A_OWNER.name,
			displayName: USER_A_OWNER.displayName,
			role: 'OWNER',
			passwordHash: '$2a$12$hashed',
			presence: 'OFFLINE',
		})
		;(compare as ReturnType<typeof vi.fn>).mockResolvedValue(true)
		;(db.session.create as ReturnType<typeof vi.fn>).mockResolvedValue({})
		;(db.user.update as ReturnType<typeof vi.fn>).mockResolvedValue({})

		const result = await caller.auth.signIn({
			email: USER_A_OWNER.email,
			password: 'correctpassword',
		})

		expect(result.token).toBeDefined()
		expect(result.user.id).toBe(USER_A_OWNER.id)
	})

	it('rejects non-existent email', async () => {
		const ctx = createUnauthenticatedContext(db)
		const caller = createCaller(ctx)

		;(db.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null)

		await expect(
			caller.auth.signIn({ email: 'nobody@test.com', password: 'whatever' }),
		).rejects.toThrow('Invalid email or password')
	})

	it('rejects wrong password', async () => {
		const ctx = createUnauthenticatedContext(db)
		const caller = createCaller(ctx)

		;(db.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
			id: 'user-id',
			accountId: 'acct-id',
			email: 'test@test.com',
			name: 'Test',
			displayName: 'Test',
			role: 'AGENT',
			passwordHash: '$2a$12$hashed',
			presence: 'OFFLINE',
		})
		;(compare as ReturnType<typeof vi.fn>).mockResolvedValue(false)

		await expect(
			caller.auth.signIn({ email: 'test@test.com', password: 'wrongpassword' }),
		).rejects.toThrow('Invalid email or password')
	})

	it('sets user presence to ONLINE after successful login', async () => {
		const ctx = createUnauthenticatedContext(db)
		const caller = createCaller(ctx)

		;(db.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
			id: 'user-id',
			accountId: 'acct-id',
			email: 'test@test.com',
			name: 'Test',
			displayName: 'Test',
			role: 'AGENT',
			passwordHash: '$2a$12$hashed',
			presence: 'OFFLINE',
		})
		;(compare as ReturnType<typeof vi.fn>).mockResolvedValue(true)
		;(db.session.create as ReturnType<typeof vi.fn>).mockResolvedValue({})
		;(db.user.update as ReturnType<typeof vi.fn>).mockResolvedValue({})

		await caller.auth.signIn({ email: 'test@test.com', password: 'correct' })

		expect(db.user.update).toHaveBeenCalledWith({
			where: { id: 'user-id' },
			data: { presence: 'ONLINE' },
		})
	})
})

describe('auth.signOut', () => {
	let db: ReturnType<typeof createMockDb>

	beforeEach(() => {
		db = createMockDb()
		vi.clearAllMocks()
	})

	it('deletes session and sets presence to OFFLINE', async () => {
		const ctx = createAuthenticatedContext(USER_A_OWNER, db)
		const caller = createCaller(ctx)

		;(db.session.deleteMany as ReturnType<typeof vi.fn>).mockResolvedValue({ count: 1 })
		;(db.user.update as ReturnType<typeof vi.fn>).mockResolvedValue({})

		const result = await caller.auth.signOut()
		expect(result.success).toBe(true)

		expect(db.session.deleteMany).toHaveBeenCalledWith({
			where: { token: 'test-session-token' },
		})
		expect(db.user.update).toHaveBeenCalledWith({
			where: { id: USER_A_OWNER.id },
			data: { presence: 'OFFLINE' },
		})
	})

	it('requires authentication', async () => {
		const ctx = createUnauthenticatedContext(db)
		const caller = createCaller(ctx)

		await expect(caller.auth.signOut()).rejects.toThrow('Not authenticated')
	})
})

describe('auth.me', () => {
	let db: ReturnType<typeof createMockDb>

	beforeEach(() => {
		db = createMockDb()
		vi.clearAllMocks()
	})

	it('returns current user with account info', async () => {
		const ctx = createAuthenticatedContext(USER_A_OWNER, db)
		const caller = createCaller(ctx)

		const mockUser = {
			id: USER_A_OWNER.id,
			accountId: ACCOUNT_A.id,
			email: USER_A_OWNER.email,
			name: USER_A_OWNER.name,
			displayName: USER_A_OWNER.displayName,
			avatarUrl: null,
			role: 'OWNER',
			presence: 'ONLINE',
			account: {
				id: ACCOUNT_A.id,
				name: ACCOUNT_A.name,
				plan: 'free',
				settings: {},
			},
		}
		;(db.user.findUniqueOrThrow as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser)

		const result = await caller.auth.me()
		expect(result.email).toBe(USER_A_OWNER.email)
		expect(result.account.name).toBe(ACCOUNT_A.name)
	})

	it('requires authentication', async () => {
		const ctx = createUnauthenticatedContext(db)
		const caller = createCaller(ctx)

		await expect(caller.auth.me()).rejects.toThrow('Not authenticated')
	})
})

describe('auth.changePassword', () => {
	let db: ReturnType<typeof createMockDb>

	beforeEach(() => {
		db = createMockDb()
		vi.clearAllMocks()
	})

	it('changes password and revokes other sessions', async () => {
		const ctx = createAuthenticatedContext(USER_A_OWNER, db)
		const caller = createCaller(ctx)

		;(db.user.findUniqueOrThrow as ReturnType<typeof vi.fn>).mockResolvedValue({
			passwordHash: '$2a$12$oldhash',
		})
		;(compare as ReturnType<typeof vi.fn>).mockResolvedValue(true)
		;(db.$transaction as ReturnType<typeof vi.fn>).mockResolvedValue([])

		const result = await caller.auth.changePassword({
			currentPassword: 'oldpassword',
			newPassword: 'newpassword123',
		})
		expect(result.success).toBe(true)
	})

	it('rejects wrong current password', async () => {
		const ctx = createAuthenticatedContext(USER_A_OWNER, db)
		const caller = createCaller(ctx)

		;(db.user.findUniqueOrThrow as ReturnType<typeof vi.fn>).mockResolvedValue({
			passwordHash: '$2a$12$oldhash',
		})
		;(compare as ReturnType<typeof vi.fn>).mockResolvedValue(false)

		await expect(
			caller.auth.changePassword({
				currentPassword: 'wrongpassword',
				newPassword: 'newpassword123',
			}),
		).rejects.toThrow('Current password is incorrect')
	})

	it('rejects new password shorter than 8 chars', async () => {
		const ctx = createAuthenticatedContext(USER_A_OWNER, db)
		const caller = createCaller(ctx)

		await expect(
			caller.auth.changePassword({
				currentPassword: 'oldpassword',
				newPassword: 'short',
			}),
		).rejects.toThrow()
	})
})
