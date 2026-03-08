import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { adminProcedure, protectedProcedure, router } from '../trpc'

export const teamRouter = router({
	list: protectedProcedure.query(async ({ ctx }) => {
		return ctx.db.team.findMany({
			where: { accountId: ctx.accountId },
			include: {
				members: {
					include: {
						user: {
							select: {
								id: true,
								name: true,
								displayName: true,
								avatarUrl: true,
								role: true,
								presence: true,
							},
						},
					},
				},
				_count: { select: { conversations: true } },
			},
			orderBy: { name: 'asc' },
		})
	}),

	getById: protectedProcedure
		.input(z.object({ id: z.string().uuid() }))
		.query(async ({ ctx, input }) => {
			const team = await ctx.db.team.findFirst({
				where: { id: input.id, accountId: ctx.accountId },
				include: {
					members: {
						include: {
							user: {
								select: {
									id: true,
									name: true,
									displayName: true,
									avatarUrl: true,
									role: true,
									presence: true,
								},
							},
						},
					},
					_count: { select: { conversations: true } },
				},
			})
			if (!team) {
				throw new TRPCError({ code: 'NOT_FOUND', message: 'Team not found' })
			}
			return team
		}),

	create: adminProcedure
		.input(
			z.object({
				name: z.string().min(1).max(100),
				description: z.string().max(500).optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			return ctx.db.team.create({
				data: {
					accountId: ctx.accountId,
					name: input.name,
					description: input.description,
				},
			})
		}),

	update: adminProcedure
		.input(
			z.object({
				id: z.string().uuid(),
				name: z.string().min(1).max(100).optional(),
				description: z.string().max(500).optional().nullable(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const existing = await ctx.db.team.findFirst({
				where: { id: input.id, accountId: ctx.accountId },
				select: { id: true },
			})
			if (!existing) {
				throw new TRPCError({ code: 'NOT_FOUND', message: 'Team not found' })
			}
			const { id, ...data } = input
			return ctx.db.team.update({ where: { id }, data })
		}),

	delete: adminProcedure
		.input(z.object({ id: z.string().uuid() }))
		.mutation(async ({ ctx, input }) => {
			const existing = await ctx.db.team.findFirst({
				where: { id: input.id, accountId: ctx.accountId },
				select: { id: true },
			})
			if (!existing) {
				throw new TRPCError({ code: 'NOT_FOUND', message: 'Team not found' })
			}
			await ctx.db.team.delete({ where: { id: input.id } })
			return { success: true }
		}),

	addMember: adminProcedure
		.input(
			z.object({
				teamId: z.string().uuid(),
				userId: z.string().uuid(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const [team, user] = await Promise.all([
				ctx.db.team.findFirst({
					where: { id: input.teamId, accountId: ctx.accountId },
					select: { id: true },
				}),
				ctx.db.user.findFirst({
					where: { id: input.userId, accountId: ctx.accountId },
					select: { id: true },
				}),
			])
			if (!team) {
				throw new TRPCError({ code: 'NOT_FOUND', message: 'Team not found' })
			}
			if (!user) {
				throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' })
			}

			return ctx.db.teamMember.upsert({
				where: {
					teamId_userId: { teamId: input.teamId, userId: input.userId },
				},
				create: { teamId: input.teamId, userId: input.userId },
				update: {},
				include: {
					user: {
						select: {
							id: true,
							name: true,
							displayName: true,
							avatarUrl: true,
							role: true,
						},
					},
				},
			})
		}),

	removeMember: adminProcedure
		.input(
			z.object({
				teamId: z.string().uuid(),
				userId: z.string().uuid(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const team = await ctx.db.team.findFirst({
				where: { id: input.teamId, accountId: ctx.accountId },
				select: { id: true },
			})
			if (!team) {
				throw new TRPCError({ code: 'NOT_FOUND', message: 'Team not found' })
			}

			await ctx.db.teamMember.deleteMany({
				where: { teamId: input.teamId, userId: input.userId },
			})
			return { success: true }
		}),
})
