import type { Prisma } from '@oho/db'
import { db } from '@oho/db'
import {
	getProfile,
	type LineWebhookBody,
	type LineWebhookEvent,
	verifyLineSignature,
} from '../libs/line'
import { emitNewMessage } from '../ws'

// ─── Main Handler ────────────────────────────────────────────

export async function handleLineWebhook(
	rawBody: string,
	signature: string,
	inboxId: string,
): Promise<{ ok: boolean; processed: number; errors: string[] }> {
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

	if (!verifyLineSignature(rawBody, signature, channelSecret)) {
		return { ok: false, processed: 0, errors: ['Invalid signature'] }
	}

	const body: LineWebhookBody = JSON.parse(rawBody)
	const errors: string[] = []
	let processed = 0

	for (const event of body.events) {
		try {
			if (event.type === 'message' && event.message) {
				await processMessage(event, inbox.id, inbox.accountId, accessToken)
				processed++
			} else if (event.type === 'follow') {
				await processFollow(event, inbox.id, inbox.accountId, accessToken)
				processed++
			}
		} catch (err) {
			errors.push(err instanceof Error ? err.message : 'Unknown error')
		}
	}

	return { ok: true, processed, errors }
}

// ─── Process Message ─────────────────────────────────────────

async function processMessage(
	event: LineWebhookEvent,
	inboxId: string,
	accountId: string,
	accessToken: string,
): Promise<void> {
	const lineUserId = event.source.userId
	const text = event.message?.text ?? `[${event.message?.type ?? 'unknown'}]`
	const messageId = event.message?.id ?? ''

	// Deduplicate by external ID
	const existing = await db.message.findFirst({
		where: { externalId: messageId },
		select: { id: true },
	})
	if (existing) return

	const contact = await findOrCreateContact(lineUserId, accountId, accessToken)

	// Ensure ContactInbox link
	const existingLink = await db.contactInbox.findFirst({
		where: { contactId: contact.id, inboxId },
	})
	if (!existingLink) {
		await db.contactInbox.create({
			data: { contactId: contact.id, inboxId, sourceId: lineUserId },
		})
	}

	// Find or create conversation
	let conversation = await db.conversation.findFirst({
		where: {
			accountId,
			contactId: contact.id,
			inboxId,
			status: { in: ['OPEN', 'PENDING'] },
		},
		select: { id: true, status: true },
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

		// Emit new conversation
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

	// Map content type
	const contentType =
		event.message?.type === 'text'
			? 'TEXT'
			: event.message?.type === 'image'
				? 'IMAGE'
				: event.message?.type === 'video'
					? 'VIDEO'
					: event.message?.type === 'audio'
						? 'AUDIO'
						: 'TEXT'

	// Create message
	const message = await db.message.create({
		data: {
			conversationId: conversation.id,
			content: text,
			contentType,
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
			...(conversation.status === 'RESOLVED' && { status: 'OPEN' }),
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

// ─── Process Follow ──────────────────────────────────────────

async function processFollow(
	event: LineWebhookEvent,
	inboxId: string,
	accountId: string,
	accessToken: string,
): Promise<void> {
	const lineUserId = event.source.userId
	const contact = await findOrCreateContact(lineUserId, accountId, accessToken)

	const existingLink = await db.contactInbox.findFirst({
		where: { contactId: contact.id, inboxId },
	})
	if (!existingLink) {
		await db.contactInbox.create({
			data: { contactId: contact.id, inboxId, sourceId: lineUserId },
		})
	}
}

// ─── Find or Create Contact ──────────────────────────────────

async function findOrCreateContact(lineUserId: string, accountId: string, accessToken: string) {
	const existing = await db.contactInbox.findFirst({
		where: { sourceId: lineUserId, inbox: { accountId } },
		include: { contact: true },
	})

	if (existing) return existing.contact

	let name = `LINE User ${lineUserId.slice(-6)}`
	let avatarUrl: string | null = null

	try {
		const profile = await getProfile(lineUserId, accessToken)
		name = profile.displayName
		avatarUrl = profile.pictureUrl ?? null
	} catch {
		// Use fallback name
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
