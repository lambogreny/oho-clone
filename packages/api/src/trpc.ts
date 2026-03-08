import { db } from '@oho/db'
import { initTRPC, TRPCError } from '@trpc/server'
import superjson from 'superjson'
import { verifyToken } from './libs/auth'

// ─── Context ─────────────────────────────────────────────────

export interface SessionUser {
	id: string
	accountId: string
	email: string
	name: string
	displayName: string | null
	role: string
}

export interface TRPCContext {
	db: typeof db
	headers: Headers
	ip: string
	user: SessionUser | null
	sessionToken: string | null
}

export const createTRPCContext = async (opts: { headers: Headers }): Promise<TRPCContext> => {
	const { headers } = opts

	// Extract IP
	const ip =
		headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
		headers.get('cf-connecting-ip') ??
		headers.get('x-real-ip') ??
		'127.0.0.1'

	// Extract user from JWT
	let user: SessionUser | null = null
	let sessionToken: string | null = null

	const authorization = headers.get('authorization')
	if (authorization?.startsWith('Bearer ')) {
		const token = authorization.slice(7)
		const payload = await verifyToken(token)

		if (payload?.sessionToken) {
			sessionToken = payload.sessionToken

			// Validate session in DB
			const session = await db.session.findUnique({
				where: { token: payload.sessionToken },
				include: {
					user: {
						select: {
							id: true,
							accountId: true,
							email: true,
							name: true,
							displayName: true,
							role: true,
						},
					},
				},
			})

			if (session && session.expiresAt > new Date()) {
				user = session.user

				// Fire-and-forget: update lastActiveAt
				db.session
					.update({
						where: { id: session.id },
						data: { lastActiveAt: new Date() },
					})
					.catch((err) => console.error('[Auth] Failed to update lastActiveAt:', err.message))
			}
		}
	}

	return { db, headers, ip, user, sessionToken }
}

// ─── tRPC Init ───────────────────────────────────────────────

const t = initTRPC.context<TRPCContext>().create({
	transformer: superjson,
	errorFormatter({ shape, error }) {
		if (process.env.NODE_ENV === 'development') {
			console.error('🔴 tRPC Error:', error.message)
			if (error.cause) console.error('🔴 Cause:', error.cause)
		}
		return shape
	},
})

// ─── Middleware ───────────────────────────────────────────────

const isAuthed = t.middleware(({ ctx, next }) => {
	if (!ctx.user) {
		throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not authenticated' })
	}
	return next({
		ctx: {
			user: ctx.user,
			accountId: ctx.user.accountId,
		},
	})
})

const isAdmin = t.middleware(({ ctx, next }) => {
	if (!ctx.user) {
		throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not authenticated' })
	}
	if (!['ADMIN', 'OWNER'].includes(ctx.user.role)) {
		throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' })
	}
	return next({
		ctx: {
			user: ctx.user,
			accountId: ctx.user.accountId,
		},
	})
})

// ─── Exports ─────────────────────────────────────────────────

export const router = t.router
export const publicProcedure = t.procedure
export const protectedProcedure = t.procedure.use(isAuthed)
export const adminProcedure = t.procedure.use(isAdmin)
export const createCallerFactory = t.createCallerFactory
