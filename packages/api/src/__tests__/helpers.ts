import type { SessionUser, TRPCContext } from '../trpc'

// ─── Mock Data Factories ─────────────────────────────────────

let counter = 0
function uuid() {
	counter++
	return `00000000-0000-4000-a000-${String(counter).padStart(12, '0')}`
}

export function resetCounter() {
	counter = 0
}

export const ACCOUNT_A = {
	id: uuid(),
	name: 'Account A',
	domain: null,
	settings: {},
	plan: 'free',
	createdAt: new Date(),
	updatedAt: new Date(),
}

export const ACCOUNT_B = {
	id: uuid(),
	name: 'Account B',
	domain: null,
	settings: {},
	plan: 'free',
	createdAt: new Date(),
	updatedAt: new Date(),
}

export const USER_A_OWNER: SessionUser = {
	id: uuid(),
	accountId: ACCOUNT_A.id,
	email: 'owner@a.com',
	name: 'Owner A',
	displayName: 'Owner A',
	role: 'OWNER',
}

export const USER_A_AGENT: SessionUser = {
	id: uuid(),
	accountId: ACCOUNT_A.id,
	email: 'agent@a.com',
	name: 'Agent A',
	displayName: 'Agent A',
	role: 'AGENT',
}

export const USER_B_OWNER: SessionUser = {
	id: uuid(),
	accountId: ACCOUNT_B.id,
	email: 'owner@b.com',
	name: 'Owner B',
	displayName: 'Owner B',
	role: 'OWNER',
}

export function makeContact(accountId: string, overrides: Record<string, unknown> = {}) {
	return {
		id: uuid(),
		accountId,
		name: 'Test Contact',
		email: 'contact@test.com',
		phone: '+66812345678',
		avatarUrl: null,
		customAttributes: null,
		createdAt: new Date(),
		updatedAt: new Date(),
		...overrides,
	}
}

export function makeInbox(accountId: string, overrides: Record<string, unknown> = {}) {
	return {
		id: uuid(),
		accountId,
		name: 'LINE Inbox',
		channelType: 'LINE' as const,
		channelConfig: {},
		greeting: null,
		autoAssignment: true,
		settings: {},
		isActive: true,
		createdAt: new Date(),
		updatedAt: new Date(),
		...overrides,
	}
}

export function makeConversation(
	accountId: string,
	contactId: string,
	inboxId: string,
	overrides: Record<string, unknown> = {},
) {
	return {
		id: uuid(),
		accountId,
		contactId,
		inboxId,
		assigneeId: null,
		teamId: null,
		status: 'PENDING' as const,
		priority: null,
		labels: [],
		customAttributes: null,
		lastMessageAt: new Date(),
		unreadCount: 0,
		createdAt: new Date(),
		updatedAt: new Date(),
		...overrides,
	}
}

export function makeMessage(conversationId: string, overrides: Record<string, unknown> = {}) {
	return {
		id: uuid(),
		conversationId,
		contentType: 'TEXT' as const,
		direction: 'OUTBOUND' as const,
		senderType: 'AGENT' as const,
		senderId: USER_A_OWNER.id,
		content: 'Hello',
		metadata: null,
		externalId: null,
		status: 'SENT' as const,
		createdAt: new Date(),
		updatedAt: new Date(),
		attachments: [],
		...overrides,
	}
}

// ─── Mock DB Builder ─────────────────────────────────────────

export function createMockDb() {
	return {
		account: {
			create: vi.fn(),
			findUnique: vi.fn(),
			findFirst: vi.fn(),
			findMany: vi.fn(),
			update: vi.fn(),
		},
		user: {
			create: vi.fn(),
			findUnique: vi.fn(),
			findUniqueOrThrow: vi.fn(),
			findFirst: vi.fn(),
			findMany: vi.fn(),
			update: vi.fn(),
		},
		session: {
			create: vi.fn(),
			findUnique: vi.fn(),
			findFirst: vi.fn(),
			delete: vi.fn(),
			deleteMany: vi.fn(),
			update: vi.fn(),
		},
		contact: {
			create: vi.fn(),
			findFirst: vi.fn(),
			findMany: vi.fn(),
			update: vi.fn(),
		},
		inbox: {
			create: vi.fn(),
			findFirst: vi.fn(),
			findMany: vi.fn(),
			update: vi.fn(),
		},
		conversation: {
			create: vi.fn(),
			findFirst: vi.fn(),
			findMany: vi.fn(),
			update: vi.fn(),
		},
		message: {
			create: vi.fn(),
			findFirst: vi.fn(),
			findMany: vi.fn(),
			update: vi.fn(),
		},
		$transaction: vi.fn(),
	} as unknown as TRPCContext['db']
}

// ─── Context Builders ────────────────────────────────────────

export function createAuthenticatedContext(user: SessionUser, db?: TRPCContext['db']): TRPCContext {
	return {
		db: db ?? createMockDb(),
		headers: new Headers(),
		ip: '127.0.0.1',
		user,
		sessionToken: 'test-session-token',
	}
}

export function createUnauthenticatedContext(db?: TRPCContext['db']): TRPCContext {
	return {
		db: db ?? createMockDb(),
		headers: new Headers(),
		ip: '127.0.0.1',
		user: null,
		sessionToken: null,
	}
}
