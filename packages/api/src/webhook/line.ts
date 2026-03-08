import type { Prisma } from '@oho/db'
import { db } from '@oho/db'
import {
	getProfile,
	type LineWebhookBody,
	type LineWebhookEvent,
	verifyLineSignature,
} from '../libs/line'
import { emitNewMessage } from '../ws'

// ─── Types ───────────────────────────────────────────────────

interface WebhookResult {
	ok: boolean
	processed: number
	errors: string[]
}

// ─── Main Handler ────────────────────────────────────────────

export async function handleLineWebhook(
	rawBody: string,
	signature: string,
	inboxId: string,
): Promise<WebhookResult> {
	// Lookup inbox + channel config
	const inbox = await db.inbox.findUnique({
		where: { id: inboxId },
		select: {
			id: true,
			accountId: true,
			channelType: true,
			channelConfig: true,
			isActive: true,
		},
	})

	if (!inbox || inbox.channelType !== 'LINE' || !inbox.isActive) {
		return { ok: false, processed: 0, errors: ['Inbox not found or inactive'] }
	}

	const config = inbox.channelConfig as Record<string, string> | null
	const channelSecret = config?.channelSecret
	const accessToken = config?.channelAccessToken

	if (!channelSecret || !accessToken) {
		return { ok: false, processed: 0, errors: ['LINE channel not configured'] }
	}

	// Verify signature
	if (!verifyLineSignature(rawBody, signature, channelSecret)) {
		return { ok: false, processed: 0, errors: ['Invalid signature'] }
	}

	// Parse body
	const body: LineWebhookBody = JSON.parse(rawBody)
	const errors: string[] = []
	let processed = 0

	for (const event of body.events) {
		try {
			if (event.type === 'message' && event.message?.type === 'text') {
				await processTextMessage(event, inbox.id, inbox.accountId, accessToken)
				processed++
			}
		} catch (err) {
			const msg = err instanceof Error ? err.message : 'Unknown error'
			errors.push(msg)
		}
	}

	return { ok: true, processed, errors }
}

// ─── Process Text Message ────────────────────────────────────

async function processTextMessage(
	event: LineWebhookEvent,
	inboxId: string,
	accountId: string,
	accessToken: string,
): Promise<void> {
	const lineUserId = event.source.userId
	const text = event.message?.text ?? ''
	const messageId = event.message?.id ?? ''

	// Find or create contact
	const contact = await findOrCreateContact(lineUserId, accountId, accessToken)

	// Find or create ContactInbox link
	await db.contactInbox.upsert({
		where: {
			inboxId_sourceId: { inboxId, sourceId: lineUserId },
		},
		update: {},
		create: {
			contactId: contact.id,
			inboxId,
			sourceId: lineUserId,
		},
	})

	// Find open conversation or create new one
	let conversation = await db.conversation.findFirst({
		where: {
			accountId,
			contactId: contact.id,
			inboxId,
			status: { in: ['OPEN', 'PENDING'] },
		},
		select: { id: true },
	})

	if (!conversation) {
		conversation = await db.conversation.create({
			data: {
				accountId,
				contactId: contact.id,
				inboxId,
				status: 'PENDING',
				lastMessageAt: new Date(),
			},
		})

		// Emit new conversation to dashboard
		const io = (await import('../ws')).getSocketServer()
		if (io) {
			io.to(`account:${accountId}`).emit('conversation:new', {
				id: conversation.id,
				contactId: contact.id,
				inboxId,
				status: 'PENDING',
			})
		}
	}

	// Create message
	const message = await db.message.create({
		data: {
			conversationId: conversation.id,
			content: text,
			contentType: 'TEXT',
			direction: 'INBOUND',
			senderType: 'CONTACT',
			senderId: contact.id,
			status: 'DELIVERED',
			externalId: messageId,
		},
	})

	// Update conversation
	await db.conversation.update({
		where: { id: conversation.id },
		data: {
			lastMessageAt: new Date(),
			unreadCount: { increment: 1 },
		},
	})

	// Emit to WebSocket
	emitNewMessage(accountId, conversation.id, {
		id: message.id,
		conversationId: conversation.id,
		content: message.content,
		contentType: message.contentType,
		direction: message.direction,
		senderType: message.senderType,
		senderId: message.senderId,
		status: message.status,
		createdAt: message.createdAt.toISOString(),
		attachments: [],
	})
}

// ─── Find or Create Contact ──────────────────────────────────

async function findOrCreateContact(lineUserId: string, accountId: string, accessToken: string) {
	// Check if contact already exists via ContactInbox sourceId
	const existing = await db.contactInbox.findFirst({
		where: {
			sourceId: lineUserId,
			inbox: { accountId },
		},
		include: { contact: true },
	})

	if (existing) {
		return existing.contact
	}

	// Fetch LINE profile
	let name = `LINE User ${lineUserId.slice(-6)}`
	let avatarUrl: string | null = null

	try {
		const profile = await getProfile(lineUserId, accessToken)
		name = profile.displayName
		avatarUrl = profile.pictureUrl ?? null
	} catch {
		// Use fallback name if profile fetch fails
	}

	return db.contact.create({
		data: {
			accountId,
			name,
			avatarUrl,
			customAttributes: { lineUserId } as unknown as Prisma.InputJsonValue,
		},
	})
}
