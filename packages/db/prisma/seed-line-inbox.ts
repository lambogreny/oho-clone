/**
 * Production seed: Create LINE inbox with real credentials
 *
 * Usage:
 *   LINE_CHANNEL_SECRET=xxx LINE_CHANNEL_ACCESS_TOKEN=xxx bunx tsx prisma/seed-line-inbox.ts
 *
 * Or with .env loaded:
 *   bunx tsx prisma/seed-line-inbox.ts
 *
 * Idempotent — skips if LINE inbox already exists for the account.
 * Prints the inbox ID needed for LINE Developers Console webhook URL:
 *   https://{domain}/api/webhook/line?inboxId={inbox-id}
 */
import { ChannelType, PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
	const channelSecret = process.env.LINE_CHANNEL_SECRET
	const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN

	if (!channelSecret || !channelAccessToken) {
		console.error('Missing LINE_CHANNEL_SECRET or LINE_CHANNEL_ACCESS_TOKEN')
		console.error('Set them in .env or pass as environment variables')
		process.exit(1)
	}

	// Verify credentials against LINE API
	console.log('Verifying LINE credentials...')
	const botRes = await fetch('https://api.line.me/v2/bot/info', {
		headers: { Authorization: `Bearer ${channelAccessToken}` },
	})

	if (!botRes.ok) {
		const err = await botRes.text()
		console.error(`LINE API error: ${botRes.status} ${err}`)
		console.error('Check your LINE_CHANNEL_ACCESS_TOKEN')
		process.exit(1)
	}

	const botInfo = (await botRes.json()) as { displayName: string; userId: string }
	console.log(`LINE Bot: "${botInfo.displayName}" (${botInfo.userId})`)

	// Find or create account
	let account = await prisma.account.findFirst()
	if (!account) {
		account = await prisma.account.create({
			data: {
				name: 'OHO Production',
				plan: 'pro',
				settings: { locale: 'th', timezone: 'Asia/Bangkok' },
			},
		})
		console.log(`Created account: ${account.id}`)
	} else {
		console.log(`Using account: ${account.name} (${account.id})`)
	}

	// Check if LINE inbox already exists
	const existing = await prisma.inbox.findFirst({
		where: {
			accountId: account.id,
			channelType: ChannelType.LINE,
		},
	})

	if (existing) {
		console.log(`\nLINE inbox already exists: ${existing.id}`)
		console.log(`Name: ${existing.name}`)
		console.log(`\nWebhook URL: https://{domain}/api/webhook/line?inboxId=${existing.id}`)

		// Update credentials if they changed
		const config = existing.channelConfig as Record<string, string> | null
		if (
			config?.channelSecret !== channelSecret ||
			config?.channelAccessToken !== channelAccessToken
		) {
			await prisma.inbox.update({
				where: { id: existing.id },
				data: {
					channelConfig: { channelSecret, channelAccessToken },
				},
			})
			console.log('Updated LINE credentials')
		}
		return
	}

	// Create LINE inbox
	const inbox = await prisma.inbox.create({
		data: {
			accountId: account.id,
			name: `LINE: ${botInfo.displayName}`,
			channelType: ChannelType.LINE,
			channelConfig: {
				channelSecret,
				channelAccessToken,
			},
			greeting: 'สวัสดีครับ! ยินดีให้บริการ',
		},
	})

	console.log(`\nCreated LINE inbox: ${inbox.id}`)
	console.log(`Name: ${inbox.name}`)
	console.log(`\n${'='.repeat(60)}`)
	console.log(`WEBHOOK URL (set in LINE Developers Console):`)
	console.log(`https://{domain}/api/webhook/line?inboxId=${inbox.id}`)
	console.log(`${'='.repeat(60)}`)

	// Ensure admin user exists
	const adminExists = await prisma.user.findFirst({
		where: { accountId: account.id },
	})

	if (!adminExists) {
		const { hashSync } = await import('bcryptjs')
		const admin = await prisma.user.create({
			data: {
				accountId: account.id,
				email: 'admin@oho.chat',
				passwordHash: hashSync('admin123', 12),
				name: 'Admin',
				displayName: 'Admin',
				role: 'ADMIN',
			},
		})
		console.log(`\nCreated admin user: ${admin.email} (password: admin123)`)
		console.log('CHANGE THIS PASSWORD IMMEDIATELY IN PRODUCTION')
	}
}

main()
	.catch((e) => {
		console.error('Seed failed:', e)
		process.exit(1)
	})
	.finally(() => prisma.$disconnect())
