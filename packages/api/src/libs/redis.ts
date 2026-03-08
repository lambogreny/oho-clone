import Redis from 'ioredis'

const globalForRedis = globalThis as unknown as { redis: Redis | undefined }

function createRedisClient(): Redis {
	const client = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
		maxRetriesPerRequest: 3,
		lazyConnect: false,
		retryStrategy(times) {
			return Math.min(times * 50, 2000) // exponential backoff, max 2s
		},
		reconnectOnError(err) {
			return err.message.includes('READONLY')
		},
	})

	client.on('connect', () => console.log('[Redis] Connected'))
	client.on('error', (err) => console.error('[Redis] Error:', err.message))

	return client
}

if (!globalForRedis.redis) {
	globalForRedis.redis = createRedisClient()
}

export const redis = globalForRedis.redis
