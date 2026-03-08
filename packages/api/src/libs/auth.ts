import { randomBytes } from 'node:crypto'
import { compare, hash } from 'bcryptjs'
import { jwtVerify, SignJWT } from 'jose'

const SALT_ROUNDS = 12
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET ?? 'change-me-in-production')
const SESSION_DURATION = '7d'

// ─── Password ────────────────────────────────────────────────

export async function hashPassword(password: string): Promise<string> {
	return hash(password, SALT_ROUNDS)
}

export async function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
	return compare(password, passwordHash)
}

// ─── Session Token ───────────────────────────────────────────

export function generateSessionToken(): string {
	return randomBytes(32).toString('hex')
}

export function getSessionExpirationDate(): Date {
	return getExpirationDate(SESSION_DURATION)
}

// ─── JWT ─────────────────────────────────────────────────────

export async function createToken(sessionToken: string): Promise<string> {
	return new SignJWT({ sessionToken })
		.setProtectedHeader({ alg: 'HS256' })
		.setIssuedAt()
		.setExpirationTime(SESSION_DURATION)
		.sign(JWT_SECRET)
}

export async function verifyToken(token: string): Promise<{ sessionToken: string } | null> {
	try {
		const { payload } = await jwtVerify(token, JWT_SECRET)
		return payload as { sessionToken: string }
	} catch {
		return null
	}
}

// ─── Helpers ─────────────────────────────────────────────────

function getExpirationDate(duration: string): Date {
	const match = duration.match(/^(\d+)([dhms])$/)
	if (!match) return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

	const value = parseInt(match[1], 10)
	const unit = match[2]

	const ms: Record<string, number> = {
		d: 24 * 60 * 60 * 1000,
		h: 60 * 60 * 1000,
		m: 60 * 1000,
		s: 1000,
	}

	return new Date(Date.now() + value * (ms[unit] ?? ms.d))
}
