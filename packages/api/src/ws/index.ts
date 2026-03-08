import type { Server as HTTPServer } from 'node:http'
import { db } from '@oho/db'
import { Server } from 'socket.io'
import { verifyToken } from '../libs/auth'
import type { SessionUser } from '../trpc'

// ─── Types ───────────────────────────────────────────────────

export interface ServerToClientEvents {
	'message:new': (data: {
		id: string
		conversationId: string
		content: string | null
		contentType: string
		direction: string
		senderType: string
		senderId: string
		status: string
		createdAt: string
		attachments: Array<{ id: string; type: string; url: string; fileName: string | null }>
	}) => void
	'message:status': (data: { id: string; status: string }) => void
	'conversation:update': (data: {
		id: string
		status?: string
		assigneeId?: string | null
		unreadCount?: number
		lastMessageAt?: string
	}) => void
	'conversation:new': (data: {
		id: string
		contactId: string
		inboxId: string
		status: string
	}) => void
	'presence:update': (data: { userId: string; presence: string }) => void
	'typing:indicator': (data: { conversationId: string; userId: string; isTyping: boolean }) => void
	error: (data: { message: string }) => void
}

export interface ClientToServerEvents {
	'conversation:join': (conversationId: string) => void
	'conversation:leave': (conversationId: string) => void
	'typing:start': (conversationId: string) => void
	'typing:stop': (conversationId: string) => void
	'message:read': (data: { conversationId: string; messageId: string }) => void
}

interface SocketData {
	user: SessionUser
	accountId: string
}

export type OhoSocket = ReturnType<typeof createSocketServer>

// ─── Socket Server ───────────────────────────────────────────

export function createSocketServer(httpServer: HTTPServer) {
	const io = new Server<
		ClientToServerEvents,
		ServerToClientEvents,
		Record<string, never>,
		SocketData
	>(httpServer, {
		cors: {
			origin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
			credentials: true,
		},
		transports: ['websocket', 'polling'],
	})

	// ─── Auth Middleware ───────────────────────────────────────

	io.use(async (socket, next) => {
		const token = socket.handshake.auth.token as string | undefined
		if (!token) {
			return next(new Error('Authentication required'))
		}

		const payload = await verifyToken(token)
		if (!payload?.sessionToken) {
			return next(new Error('Invalid token'))
		}

		const session = await db.session.findUnique({
			where: { token: payload.sessionToken },
			include: {
				user: {
					select: {
						id: true,
						accountId: true,
						email: true,
						name: true,
						displayName: true,
						role: true,
					},
				},
			},
		})

		if (!session || session.expiresAt < new Date()) {
			return next(new Error('Session expired'))
		}

		socket.data.user = session.user
		socket.data.accountId = session.user.accountId
		next()
	})

	// ─── Connection Handler ──────────────────────────────────

	io.on('connection', (socket) => {
		const { user, accountId } = socket.data

		// Join account room (for account-wide broadcasts)
		socket.join(`account:${accountId}`)
		// Join personal room (for direct notifications)
		socket.join(`user:${user.id}`)

		console.log(`[WS] ${user.name} connected (${socket.id})`)

		// Broadcast presence
		io.to(`account:${accountId}`).emit('presence:update', {
			userId: user.id,
			presence: 'ONLINE',
		})

		// Update presence in DB (fire-and-forget)
		db.user
			.update({
				where: { id: user.id },
				data: { presence: 'ONLINE' },
			})
			.catch(() => {})

		// ─── Join/Leave Conversations ──────────────────────────

		socket.on('conversation:join', (conversationId) => {
			socket.join(`conversation:${conversationId}`)
		})

		socket.on('conversation:leave', (conversationId) => {
			socket.leave(`conversation:${conversationId}`)
		})

		// ─── Typing Indicators ─────────────────────────────────

		socket.on('typing:start', (conversationId) => {
			socket.to(`conversation:${conversationId}`).emit('typing:indicator', {
				conversationId,
				userId: user.id,
				isTyping: true,
			})
		})

		socket.on('typing:stop', (conversationId) => {
			socket.to(`conversation:${conversationId}`).emit('typing:indicator', {
				conversationId,
				userId: user.id,
				isTyping: false,
			})
		})

		// ─── Message Read ──────────────────────────────────────

		socket.on('message:read', async (data) => {
			try {
				// Mark message as read
				await db.message.update({
					where: { id: data.messageId },
					data: { status: 'READ' },
				})

				// Reset unread count
				await db.conversation.update({
					where: { id: data.conversationId },
					data: { unreadCount: 0 },
				})

				// Broadcast to conversation room
				io.to(`conversation:${data.conversationId}`).emit('message:status', {
					id: data.messageId,
					status: 'READ',
				})

				io.to(`conversation:${data.conversationId}`).emit('conversation:update', {
					id: data.conversationId,
					unreadCount: 0,
				})
			} catch {
				socket.emit('error', { message: 'Failed to mark message as read' })
			}
		})

		// ─── Disconnect ────────────────────────────────────────

		socket.on('disconnect', () => {
			console.log(`[WS] ${user.name} disconnected (${socket.id})`)

			io.to(`account:${accountId}`).emit('presence:update', {
				userId: user.id,
				presence: 'OFFLINE',
			})

			db.user
				.update({
					where: { id: user.id },
					data: { presence: 'OFFLINE' },
				})
				.catch(() => {})
		})
	})

	return io
}

// ─── Emitter Helpers (for use from tRPC routers) ─────────────

let _io: Server<
	ClientToServerEvents,
	ServerToClientEvents,
	Record<string, never>,
	SocketData
> | null = null

export function setSocketServer(
	io: Server<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>,
) {
	_io = io
}

export function getSocketServer() {
	return _io
}

export function emitNewMessage(
	accountId: string,
	conversationId: string,
	message: ServerToClientEvents['message:new'] extends (data: infer D) => void ? D : never,
) {
	if (!_io) return
	_io.to(`conversation:${conversationId}`).emit('message:new', message)
	_io.to(`account:${accountId}`).emit('conversation:update', {
		id: conversationId,
		lastMessageAt: message.createdAt,
	})
}

export function emitConversationUpdate(
	accountId: string,
	data: ServerToClientEvents['conversation:update'] extends (data: infer D) => void ? D : never,
) {
	if (!_io) return
	_io.to(`account:${accountId}`).emit('conversation:update', data)
	_io.to(`conversation:${data.id}`).emit('conversation:update', data)
}
