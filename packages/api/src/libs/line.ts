import { createHmac } from 'node:crypto'

// ─── Types ───────────────────────────────────────────────────

export interface LineWebhookEvent {
	type: string
	message?: {
		id: string
		type: string
		text?: string
	}
	source: {
		type: string
		userId: string
		groupId?: string
		roomId?: string
	}
	replyToken?: string
	timestamp: number
	deliveryContext?: {
		isRedelivery: boolean
	}
}

export interface LineWebhookBody {
	destination: string
	events: LineWebhookEvent[]
}

interface LineMessage {
	type: 'text'
	text: string
}

interface LineProfile {
	displayName: string
	userId: string
	pictureUrl?: string
	statusMessage?: string
}

// ─── Signature Verification ──────────────────────────────────

export function verifyLineSignature(
	body: string,
	signature: string,
	channelSecret: string,
): boolean {
	const hash = createHmac('SHA256', channelSecret).update(body).digest('base64')
	return hash === signature
}

// ─── LINE Messaging API ─────────────────────────────────────

async function lineApiRequest(
	path: string,
	accessToken: string,
	options?: RequestInit,
): Promise<Response> {
	return fetch(`https://api.line.me/v2${path}`, {
		...options,
		headers: {
			Authorization: `Bearer ${accessToken}`,
			'Content-Type': 'application/json',
			...options?.headers,
		},
	})
}

export async function replyMessage(
	replyToken: string,
	messages: LineMessage[],
	accessToken: string,
): Promise<void> {
	const res = await lineApiRequest('/bot/message/reply', accessToken, {
		method: 'POST',
		body: JSON.stringify({ replyToken, messages }),
	})
	if (!res.ok) {
		const err = await res.text()
		throw new Error(`LINE reply failed: ${res.status} ${err}`)
	}
}

export async function pushMessage(
	to: string,
	messages: LineMessage[],
	accessToken: string,
): Promise<void> {
	const res = await lineApiRequest('/bot/message/push', accessToken, {
		method: 'POST',
		body: JSON.stringify({ to, messages }),
	})
	if (!res.ok) {
		const err = await res.text()
		throw new Error(`LINE push failed: ${res.status} ${err}`)
	}
}

export async function getProfile(userId: string, accessToken: string): Promise<LineProfile> {
	const res = await lineApiRequest(`/bot/profile/${userId}`, accessToken)
	if (!res.ok) {
		throw new Error(`LINE getProfile failed: ${res.status}`)
	}
	return res.json() as Promise<LineProfile>
}
