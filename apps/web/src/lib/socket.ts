'use client'

import { useEffect, useRef } from 'react'
import { io, type Socket } from 'socket.io-client'
import { useAuthStore } from '@/stores/auth'

// ─── Types (matching backend ServerToClientEvents / ClientToServerEvents) ───

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

export type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>

// ─── Singleton Socket ──────────────────────────────────────

let socket: TypedSocket | null = null

function getSocketUrl(): string {
	if (typeof window === 'undefined') return ''
	return process.env.NEXT_PUBLIC_WS_URL || window.location.origin
}

export function getSocket(): TypedSocket | null {
	return socket
}

export function connectSocket(token: string): TypedSocket {
	if (socket?.connected) return socket

	if (socket) {
		socket.auth = { token }
		socket.connect()
		return socket
	}

	socket = io(getSocketUrl(), {
		auth: { token },
		transports: ['websocket', 'polling'],
		reconnection: true,
		reconnectionAttempts: 10,
		reconnectionDelay: 1000,
		reconnectionDelayMax: 5000,
	}) as TypedSocket

	socket.on('connect', () => {
		console.log('[WS] Connected:', socket?.id)
	})

	socket.on('disconnect', (reason) => {
		console.log('[WS] Disconnected:', reason)
	})

	socket.on('connect_error', (err) => {
		console.error('[WS] Connection error:', err.message)
	})

	return socket
}

export function disconnectSocket(): void {
	if (socket) {
		socket.disconnect()
		socket = null
	}
}

// ─── Hooks ─────────────────────────────────────────────────

/**
 * Connect to WebSocket when user is authenticated.
 * Place in dashboard layout — connects on mount, disconnects on unmount.
 */
export function useSocketConnection(): TypedSocket | null {
	const token = useAuthStore((s) => s.token)
	const socketRef = useRef<TypedSocket | null>(null)

	useEffect(() => {
		if (!token) {
			disconnectSocket()
			socketRef.current = null
			return
		}

		const s = connectSocket(token)
		socketRef.current = s

		return () => {
			disconnectSocket()
			socketRef.current = null
		}
	}, [token])

	return socketRef.current
}

/**
 * Subscribe to a typed socket event. Automatically cleans up on unmount.
 */
export function useSocketEvent<E extends keyof ServerToClientEvents>(
	event: E,
	handler: ServerToClientEvents[E],
): void {
	const handlerRef = useRef(handler)
	handlerRef.current = handler

	useEffect(() => {
		const s = getSocket()
		if (!s) return

		const wrapper = (...args: Parameters<ServerToClientEvents[E]>) => {
			// biome-ignore lint: handler ref is stable
			;(handlerRef.current as (...a: unknown[]) => void)(...args)
		}

		s.on(event, wrapper as never)
		return () => {
			s.off(event, wrapper as never)
		}
	}, [event])
}

/**
 * Join a conversation room. Leave on unmount or when conversationId changes.
 */
export function useConversationRoom(conversationId: string | null): void {
	useEffect(() => {
		const s = getSocket()
		if (!s || !conversationId) return

		s.emit('conversation:join', conversationId)

		return () => {
			s.emit('conversation:leave', conversationId)
		}
	}, [conversationId])
}
