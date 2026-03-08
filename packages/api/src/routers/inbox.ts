import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { adminProcedure, protectedProcedure, router } from '../trpc'

export const inboxRouter = router({
	list: protectedProcedure.query(async ({ ctx }) => {
		return ctx.db.inbox.findMany({
			where: { accountId: ctx.accountId },
			orderBy: { createdAt: 'desc' },
			include: {
				_count: { select: { conversations: true } },
			},
		})
	}),

	getById: protectedProcedure
		.input(z.object({ id: z.string().uuid() }))
		.query(async ({ ctx, input }) => {
			const inbox = await ctx.db.inbox.findFirst({
				where: { id: input.id, accountId: ctx.accountId },
				include: {
					inboxMembers: true,
					_count: { select: { conversations: true } },
				},
			})

			if (!inbox) {
				throw new TRPCError({ code: 'NOT_FOUND', message: 'Inbox not found' })
			}

			return inbox
		}),

	create: adminProcedure
		.input(
			z.object({
				name: z.string().min(1).max(100),
				channelType: z.enum([
					'LINE',
					'FACEBOOK',
					'INSTAGRAM',
					'WHATSAPP',
					'TIKTOK',
					'WEBCHAT',
					'EMAIL',
				]),
				channelConfig: z.record(z.unknown()).default({}),
				greeting: z.string().max(500).optional(),
				autoAssignment: z.boolean().default(true),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { channelConfig, ...rest } = input
			return ctx.db.inbox.create({
				data: {
					accountId: ctx.accountId,
					...rest,
					channelConfig: channelConfig as Record<string, unknown>,
				},
			})
		}),

	update: adminProcedure
		.input(
			z.object({
				id: z.string().uuid(),
				name: z.string().min(1).max(100).optional(),
				channelConfig: z.record(z.unknown()).optional(),
				greeting: z.string().max(500).optional().nullable(),
				autoAssignment: z.boolean().optional(),
				isActive: z.boolean().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { id, channelConfig, ...rest } = input

			const existing = await ctx.db.inbox.findFirst({
				where: { id, accountId: ctx.accountId },
				select: { id: true },
			})
			if (!existing) {
				throw new TRPCError({ code: 'NOT_FOUND', message: 'Inbox not found' })
			}

			return ctx.db.inbox.update({
				where: { id },
				data: {
					...rest,
					...(channelConfig !== undefined && {
						channelConfig: channelConfig as Record<string, unknown>,
					}),
				},
			})
		}),
})
