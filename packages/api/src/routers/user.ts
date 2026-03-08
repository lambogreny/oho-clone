import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { protectedProcedure, router } from '../trpc'

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
})
