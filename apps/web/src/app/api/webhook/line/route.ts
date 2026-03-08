import { handleLineWebhook } from '@oho/api'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
	const rawBody = await request.text()
	const signature = request.headers.get('x-line-signature')

	if (!signature) {
		return NextResponse.json({ error: 'Missing signature' }, { status: 401 })
	}

	// LINE webhook URL format: /api/webhook/line?inboxId=xxx
	const url = new URL(request.url)
	const inboxId = url.searchParams.get('inboxId')

	if (!inboxId) {
		return NextResponse.json({ error: 'Missing inboxId' }, { status: 400 })
	}

	try {
		const result = await handleLineWebhook(rawBody, signature, inboxId)
		return NextResponse.json(result)
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Unknown error'
		console.error('[LINE Webhook] Error:', message)
		return NextResponse.json({ error: message }, { status: 500 })
	}
}

// LINE sends GET to verify webhook URL
export async function GET() {
	return NextResponse.json({ status: 'ok' })
}
