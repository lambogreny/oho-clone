import { createHash } from 'node:crypto'
import {
	ChannelType,
	ContentType,
	ConversationStatus,
	MessageDirection,
	MessageStatus,
	Presence,
	PrismaClient,
	SenderType,
	UserRole,
} from '@prisma/client'

const prisma = new PrismaClient()

// Simple hash for seed — NOT for production auth
function hashPassword(password: string): string {
	return createHash('sha256').update(password).digest('hex')
}

async function main() {
	console.log('Seeding database...')

	// ─── Account ─────────────────────────────────────────────
	const account = await prisma.account.create({
		data: {
			name: 'OHO Demo',
			domain: 'demo.oho.test',
			plan: 'pro',
			settings: {
				locale: 'th',
				timezone: 'Asia/Bangkok',
			},
		},
	})
	console.log(`Created account: ${account.name}`)

	// ─── Admin User ──────────────────────────────────────────
	const admin = await prisma.user.create({
		data: {
			accountId: account.id,
			email: 'admin@oho.test',
			passwordHash: hashPassword('password123'),
			name: 'Admin User',
			displayName: 'Admin',
			role: UserRole.ADMIN,
			presence: Presence.ONLINE,
		},
	})
	console.log(`Created admin: ${admin.email}`)

	// ─── Inboxes ─────────────────────────────────────────────
	const lineInbox = await prisma.inbox.create({
		data: {
			accountId: account.id,
			name: 'LINE Official',
			channelType: ChannelType.LINE,
			channelConfig: {
				channelAccessToken: 'demo-line-token',
				channelSecret: 'demo-line-secret',
			},
			greeting: 'สวัสดีครับ! ยินดีให้บริการ',
		},
	})

	const facebookInbox = await prisma.inbox.create({
		data: {
			accountId: account.id,
			name: 'Facebook Page',
			channelType: ChannelType.FACEBOOK,
			channelConfig: {
				pageAccessToken: 'demo-fb-token',
				pageId: 'demo-page-id',
			},
			greeting: 'Welcome! How can we help?',
		},
	})
	console.log(`Created inboxes: LINE, Facebook`)

	// ─── Contacts ────────────────────────────────────────────
	const contact1 = await prisma.contact.create({
		data: {
			accountId: account.id,
			name: 'สมชาย ใจดี',
			email: 'somchai@example.com',
			phone: '+66812345678',
		},
	})

	const contact2 = await prisma.contact.create({
		data: {
			accountId: account.id,
			name: 'สมหญิง รักดี',
			email: 'somying@example.com',
			phone: '+66898765432',
		},
	})

	const _contact3 = await prisma.contact.create({
		data: {
			accountId: account.id,
			name: 'John Smith',
			email: 'john@example.com',
		},
	})
	console.log(`Created 3 contacts`)

	// ─── Contact Inboxes ─────────────────────────────────────
	await prisma.contactInbox.create({
		data: {
			contactId: contact1.id,
			inboxId: lineInbox.id,
			sourceId: 'U1234567890abcdef',
		},
	})

	await prisma.contactInbox.create({
		data: {
			contactId: contact2.id,
			inboxId: facebookInbox.id,
			sourceId: '9876543210',
		},
	})

	// ─── Conversations ───────────────────────────────────────
	const now = new Date()

	const conversation1 = await prisma.conversation.create({
		data: {
			accountId: account.id,
			inboxId: lineInbox.id,
			contactId: contact1.id,
			assigneeId: admin.id,
			status: ConversationStatus.OPEN,
			lastMessageAt: now,
			unreadCount: 1,
		},
	})

	const conversation2 = await prisma.conversation.create({
		data: {
			accountId: account.id,
			inboxId: facebookInbox.id,
			contactId: contact2.id,
			status: ConversationStatus.PENDING,
			lastMessageAt: now,
			unreadCount: 2,
		},
	})
	console.log(`Created 2 conversations`)

	// ─── Messages ────────────────────────────────────────────

	// Conversation 1 — LINE chat
	await prisma.message.create({
		data: {
			conversationId: conversation1.id,
			contentType: ContentType.TEXT,
			direction: MessageDirection.INBOUND,
			senderType: SenderType.CONTACT,
			senderId: contact1.id,
			content: 'สวัสดีครับ สนใจสินค้าตัวนี้ครับ',
			status: MessageStatus.READ,
			createdAt: new Date(now.getTime() - 60000 * 5),
		},
	})

	await prisma.message.create({
		data: {
			conversationId: conversation1.id,
			contentType: ContentType.TEXT,
			direction: MessageDirection.OUTBOUND,
			senderType: SenderType.AGENT,
			senderId: admin.id,
			content: 'สวัสดีครับ! สินค้าตัวนี้ราคา 1,500 บาทครับ ส่งฟรีทั่วประเทศ',
			status: MessageStatus.DELIVERED,
			createdAt: new Date(now.getTime() - 60000 * 3),
		},
	})

	await prisma.message.create({
		data: {
			conversationId: conversation1.id,
			contentType: ContentType.TEXT,
			direction: MessageDirection.INBOUND,
			senderType: SenderType.CONTACT,
			senderId: contact1.id,
			content: 'สั่งได้เลยครับ ส่ง EMS นะครับ',
			status: MessageStatus.DELIVERED,
			createdAt: now,
		},
	})

	// Conversation 2 — Facebook chat
	await prisma.message.create({
		data: {
			conversationId: conversation2.id,
			contentType: ContentType.TEXT,
			direction: MessageDirection.INBOUND,
			senderType: SenderType.CONTACT,
			senderId: contact2.id,
			content: 'Hi, I saw your ad on Facebook. Do you ship internationally?',
			status: MessageStatus.DELIVERED,
			createdAt: new Date(now.getTime() - 60000 * 10),
		},
	})

	await prisma.message.create({
		data: {
			conversationId: conversation2.id,
			contentType: ContentType.TEXT,
			direction: MessageDirection.INBOUND,
			senderType: SenderType.CONTACT,
			senderId: contact2.id,
			content: 'Also, what payment methods do you accept?',
			status: MessageStatus.DELIVERED,
			createdAt: new Date(now.getTime() - 60000 * 8),
		},
	})
	console.log(`Created messages for conversations`)

	console.log('Seed complete!')
}

main()
	.catch((e) => {
		console.error(e)
		process.exit(1)
	})
	.finally(async () => {
		await prisma.$disconnect()
	})
