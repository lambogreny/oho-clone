/**
 * Production Smoke Test
 *
 * Verifies the deployed oho-clone instance is healthy:
 * 1. App responds on /
 * 2. tRPC endpoint responds
 * 3. LINE webhook endpoint accepts GET (verification)
 * 4. Auth flow works (register/login/me)
 * 5. LINE API credentials are valid
 * 6. Database is connected (via auth flow)
 *
 * Usage:
 *   APP_URL=https://your-domain.com bunx tsx scripts/smoke-test.ts
 *   APP_URL=http://localhost:3000 bunx tsx scripts/smoke-test.ts
 */

const APP_URL = process.env.APP_URL || 'http://localhost:3000'
const LINE_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN

let passed = 0
let failed = 0
const results: { name: string; ok: boolean; detail: string }[] = []

async function test(name: string, fn: () => Promise<string>) {
	try {
		const detail = await fn()
		passed++
		results.push({ name, ok: true, detail })
		console.log(`  ✅ ${name}: ${detail}`)
	} catch (e) {
		failed++
		const detail = e instanceof Error ? e.message : String(e)
		results.push({ name, ok: false, detail })
		console.log(`  ❌ ${name}: ${detail}`)
	}
}

async function fetchJson(path: string, options?: RequestInit) {
	const res = await fetch(`${APP_URL}${path}`, {
		...options,
		headers: {
			'Content-Type': 'application/json',
			...options?.headers,
		},
	})
	return { res, body: await res.text() }
}

async function main() {
	console.log(`\nSmoke Test — ${APP_URL}`)
	console.log(`${'='.repeat(50)}\n`)

	// 1. Health check
	await test('App health', async () => {
		const { res } = await fetchJson('/')
		if (!res.ok && res.status !== 307) throw new Error(`HTTP ${res.status}`)
		return `HTTP ${res.status}`
	})

	// 2. LINE webhook GET (verification endpoint)
	await test('LINE webhook GET', async () => {
		const { res, body } = await fetchJson('/api/webhook/line?inboxId=test')
		if (!res.ok) throw new Error(`HTTP ${res.status}: ${body}`)
		return 'OK'
	})

	// 3. LINE webhook POST (missing signature → 401)
	await test('LINE webhook auth guard', async () => {
		const { res } = await fetchJson('/api/webhook/line?inboxId=test', {
			method: 'POST',
			body: '{}',
		})
		if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`)
		return '401 Unauthorized (correct)'
	})

	// 4. LINE webhook POST (missing inboxId → 400)
	await test('LINE webhook inboxId guard', async () => {
		const { res } = await fetchJson('/api/webhook/line', {
			method: 'POST',
			body: '{}',
			headers: { 'x-line-signature': 'test' },
		})
		if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`)
		return '400 Bad Request (correct)'
	})

	// 5. Auth: register test user
	const testEmail = `smoke-test-${Date.now()}@test.local`
	let authToken = ''

	await test('Auth register', async () => {
		const { res, body } = await fetchJson('/api/trpc/auth.register', {
			method: 'POST',
			body: JSON.stringify({
				json: {
					email: testEmail,
					password: 'SmokeTest123!',
					name: 'Smoke Test',
					accountName: 'Smoke Test Account',
				},
			}),
		})
		if (!res.ok) throw new Error(`HTTP ${res.status}: ${body}`)
		const data = JSON.parse(body)
		authToken = data?.result?.data?.json?.token
		if (!authToken) throw new Error('No token in response')
		return `Registered ${testEmail}`
	})

	// 6. Auth: me (verify token works)
	if (authToken) {
		await test('Auth me', async () => {
			const { res, body } = await fetchJson('/api/trpc/auth.me', {
				method: 'GET',
				headers: { Authorization: `Bearer ${authToken}` },
			})
			if (!res.ok) throw new Error(`HTTP ${res.status}: ${body}`)
			const data = JSON.parse(body)
			const email = data?.result?.data?.json?.email
			if (email !== testEmail) throw new Error(`Expected ${testEmail}, got ${email}`)
			return `Authenticated as ${email}`
		})
	}

	// 7. LINE API connectivity (if token provided)
	if (LINE_ACCESS_TOKEN) {
		await test('LINE API connectivity', async () => {
			const res = await fetch('https://api.line.me/v2/bot/info', {
				headers: { Authorization: `Bearer ${LINE_ACCESS_TOKEN}` },
			})
			if (!res.ok) throw new Error(`LINE API: ${res.status}`)
			const info = (await res.json()) as { displayName: string }
			return `Bot: "${info.displayName}"`
		})

		await test('LINE message quota', async () => {
			const res = await fetch('https://api.line.me/v2/bot/message/quota/consumption', {
				headers: { Authorization: `Bearer ${LINE_ACCESS_TOKEN}` },
			})
			if (!res.ok) throw new Error(`LINE API: ${res.status}`)
			const data = (await res.json()) as { totalUsage: number }
			return `${data.totalUsage} messages used this month`
		})
	} else {
		console.log('  ⏭️  LINE API tests skipped (no LINE_CHANNEL_ACCESS_TOKEN)')
	}

	// Summary
	console.log(`\n${'='.repeat(50)}`)
	console.log(`Results: ${passed} passed, ${failed} failed, ${passed + failed} total`)

	if (failed > 0) {
		console.log('\nFailed tests:')
		for (const r of results.filter((r) => !r.ok)) {
			console.log(`  - ${r.name}: ${r.detail}`)
		}
		process.exit(1)
	}

	console.log('\nAll smoke tests passed!')
}

main().catch((e) => {
	console.error('Smoke test crashed:', e)
	process.exit(1)
})
