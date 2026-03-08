import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { hashPassword } from '../libs/auth'
import { adminProcedure, protectedProcedure, router } from '../trpc'

export const userRouter = router({
	list: protectedProcedure.query(async ({ ctx }) => {
		return ctx.db.user.findMany({
			where: { accountId: ctx.accountId },
			select: {
				id: true,
				name: true,
				displayName: true,
				email: true,
				avatarUrl: true,
				role: true,
				presence: true,
			},
			orderBy: { name: 'asc' },
		})
	}),

	getById: protectedProcedure
		.input(z.object({ id: z.string().uuid() }))
		.query(async ({ ctx, input }) => {
			const user = await ctx.db.user.findFirst({
				where: { id: input.id, accountId: ctx.accountId },
				select: {
					id: true,
					name: true,
					displayName: true,
					email: true,
					avatarUrl: true,
					role: true,
					presence: true,
				},
			})
			if (!user) {
				throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' })
			}
			return user
		}),

	updatePresence: protectedProcedure
		.input(
			z.object({
				presence: z.enum(['ONLINE', 'OFFLINE', 'AWAY', 'BUSY']),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			return ctx.db.user.update({
				where: { id: ctx.user.id },
				data: { presence: input.presence },
			})
		}),

	updateProfile: protectedProcedure
		.input(
			z.object({
				name: z.string().min(1).max(100).optional(),
				displayName: z.string().max(100).optional().nullable(),
				avatarUrl: z.string().url().optional().nullable(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			return ctx.db.user.update({
				where: { id: ctx.user.id },
				data: input,
				select: {
					id: true,
					name: true,
					displayName: true,
					avatarUrl: true,
				},
			})
		}),

	invite: adminProcedure
		.input(
			z.object({
				email: z.string().email(),
				name: z.string().min(1).max(100),
				password: z.string().min(8).max(100),
				role: z.enum(['ADMIN', 'AGENT']).default('AGENT'),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const existing = await ctx.db.user.findUnique({
				where: { email: input.email },
				select: { id: true },
			})
			if (existing) {
				throw new TRPCError({ code: 'CONFLICT', message: 'Email already in use' })
			}

			const passwordHash = await hashPassword(input.password)
			return ctx.db.user.create({
				data: {
					accountId: ctx.accountId,
					email: input.email,
					name: input.name,
					passwordHash,
					role: input.role,
				},
				select: {
					id: true,
					email: true,
					name: true,
					role: true,
					createdAt: true,
				},
			})
		}),

	updateRole: adminProcedure
		.input(
			z.object({
				userId: z.string().uuid(),
				role: z.enum(['ADMIN', 'AGENT']),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			if (ctx.user.role !== 'OWNER') {
				throw new TRPCError({ code: 'FORBIDDEN', message: 'Only OWNER can change roles' })
			}

			const target = await ctx.db.user.findFirst({
				where: { id: input.userId, accountId: ctx.accountId },
				select: { id: true, role: true },
			})
			if (!target) {
				throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' })
			}
			if (target.role === 'OWNER') {
				throw new TRPCError({ code: 'FORBIDDEN', message: 'Cannot change OWNER role' })
			}

			return ctx.db.user.update({
				where: { id: input.userId },
				data: { role: input.role },
				select: { id: true, email: true, name: true, role: true },
			})
		}),

	remove: adminProcedure
		.input(z.object({ userId: z.string().uuid() }))
		.mutation(async ({ ctx, input }) => {
			if (ctx.user.role !== 'OWNER') {
				throw new TRPCError({ code: 'FORBIDDEN', message: 'Only OWNER can remove users' })
			}
			if (input.userId === ctx.user.id) {
				throw new TRPCError({ code: 'BAD_REQUEST', message: 'Cannot remove yourself' })
			}

			const target = await ctx.db.user.findFirst({
				where: { id: input.userId, accountId: ctx.accountId },
				select: { id: true, role: true },
			})
			if (!target) {
				throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' })
			}
			if (target.role === 'OWNER') {
				throw new TRPCError({ code: 'FORBIDDEN', message: 'Cannot remove OWNER' })
			}

			await ctx.db.user.delete({ where: { id: input.userId } })
			return { success: true }
		}),
})
