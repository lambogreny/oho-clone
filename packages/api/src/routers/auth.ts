import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import {
	createToken,
	generateSessionToken,
	getSessionExpirationDate,
	hashPassword,
	verifyPassword,
} from '../libs/auth'
import { protectedProcedure, publicProcedure, router } from '../trpc'

export const authRouter = router({
	/**
	 * Register a new account + owner user
	 */
	register: publicProcedure
		.input(
			z.object({
				accountName: z.string().min(1, 'Account name is required').max(100),
				name: z.string().min(1, 'Name is required').max(100),
				email: z.string().email('Invalid email'),
				password: z.string().min(8, 'Password must be at least 8 characters').max(128),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			// Check if email already exists
			const existing = await ctx.db.user.findUnique({
				where: { email: input.email },
				select: { id: true },
			})
			if (existing) {
				throw new TRPCError({
					code: 'CONFLICT',
					message: 'Email already registered',
				})
			}

			const passwordHash = await hashPassword(input.password)

			// Transaction: create account + user + session
			const result = await ctx.db.$transaction(async (tx) => {
				const account = await tx.account.create({
					data: {
						name: input.accountName,
						settings: { locale: 'th', timezone: 'Asia/Bangkok' },
					},
				})

				const user = await tx.user.create({
					data: {
						accountId: account.id,
						email: input.email,
						passwordHash,
						name: input.name,
						displayName: input.name,
						role: 'OWNER',
						presence: 'ONLINE',
					},
				})

				const sessionToken = generateSessionToken()
				await tx.session.create({
					data: {
						userId: user.id,
						token: sessionToken,
						ipAddress: ctx.ip,
						userAgent: ctx.headers.get('user-agent'),
						expiresAt: getSessionExpirationDate(),
					},
				})

				const token = await createToken(sessionToken)

				return {
					token,
					user: {
						id: user.id,
						accountId: account.id,
						email: user.email,
						name: user.name,
						displayName: user.displayName,
						role: user.role,
					},
				}
			})

			return result
		}),

	/**
	 * Sign in with email + password
	 */
	signIn: publicProcedure
		.input(
			z.object({
				email: z.string().email('Invalid email'),
				password: z.string().min(1, 'Password is required'),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const user = await ctx.db.user.findUnique({
				where: { email: input.email },
				select: {
					id: true,
					accountId: true,
					email: true,
					name: true,
					displayName: true,
					role: true,
					passwordHash: true,
					presence: true,
				},
			})

			if (!user) {
				throw new TRPCError({
					code: 'UNAUTHORIZED',
					message: 'Invalid email or password',
				})
			}

			const valid = await verifyPassword(input.password, user.passwordHash)
			if (!valid) {
				throw new TRPCError({
					code: 'UNAUTHORIZED',
					message: 'Invalid email or password',
				})
			}

			// Create session
			const sessionToken = generateSessionToken()
			await ctx.db.session.create({
				data: {
					userId: user.id,
					token: sessionToken,
					ipAddress: ctx.ip,
					userAgent: ctx.headers.get('user-agent'),
					expiresAt: getSessionExpirationDate(),
				},
			})

			// Set presence to online
			await ctx.db.user.update({
				where: { id: user.id },
				data: { presence: 'ONLINE' },
			})

			const token = await createToken(sessionToken)

			return {
				token,
				user: {
					id: user.id,
					accountId: user.accountId,
					email: user.email,
					name: user.name,
					displayName: user.displayName,
					role: user.role,
				},
			}
		}),

	/**
	 * Sign out — invalidate current session
	 */
	signOut: protectedProcedure.mutation(async ({ ctx }) => {
		if (ctx.sessionToken) {
			await ctx.db.session.deleteMany({
				where: { token: ctx.sessionToken },
			})
		}

		// Set presence to offline
		await ctx.db.user.update({
			where: { id: ctx.user.id },
			data: { presence: 'OFFLINE' },
		})

		return { success: true }
	}),

	/**
	 * Get current user session info
	 */
	me: protectedProcedure.query(async ({ ctx }) => {
		const user = await ctx.db.user.findUniqueOrThrow({
			where: { id: ctx.user.id },
			select: {
				id: true,
				accountId: true,
				email: true,
				name: true,
				displayName: true,
				avatarUrl: true,
				role: true,
				presence: true,
				account: {
					select: {
						id: true,
						name: true,
						plan: true,
						settings: true,
					},
				},
			},
		})

		return user
	}),

	/**
	 * Change password
	 */
	changePassword: protectedProcedure
		.input(
			z.object({
				currentPassword: z.string().min(1),
				newPassword: z.string().min(8).max(128),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const user = await ctx.db.user.findUniqueOrThrow({
				where: { id: ctx.user.id },
				select: { passwordHash: true },
			})

			const valid = await verifyPassword(input.currentPassword, user.passwordHash)
			if (!valid) {
				throw new TRPCError({
					code: 'BAD_REQUEST',
					message: 'Current password is incorrect',
				})
			}

			const newHash = await hashPassword(input.newPassword)

			// Update password and revoke all other sessions
			await ctx.db.$transaction([
				ctx.db.user.update({
					where: { id: ctx.user.id },
					data: { passwordHash: newHash },
				}),
				ctx.db.session.deleteMany({
					where: {
						userId: ctx.user.id,
						token: { not: ctx.sessionToken ?? '' },
					},
				}),
			])

			return { success: true }
		}),
})
