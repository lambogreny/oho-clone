import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { protectedProcedure, router } from '../trpc'

export const noteRouter = router({
	list: protectedProcedure
		.input(
			z.object({
				conversationId: z.string().uuid(),
			}),
		)
		.query(async ({ ctx, input }) => {
			const conversation = await ctx.db.conversation.findFirst({
				where: { id: input.conversationId, accountId: ctx.accountId },
				select: { id: true },
			})
			if (!conversation) {
				throw new TRPCError({ code: 'NOT_FOUND', message: 'Conversation not found' })
			}

			return ctx.db.conversationNote.findMany({
				where: { conversationId: input.conversationId },
				include: {
					user: {
						select: { id: true, name: true, displayName: true, avatarUrl: true },
					},
				},
				orderBy: { createdAt: 'desc' },
			})
		}),

	create: protectedProcedure
		.input(
			z.object({
				conversationId: z.string().uuid(),
				content: z.string().min(1).max(5000),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const conversation = await ctx.db.conversation.findFirst({
				where: { id: input.conversationId, accountId: ctx.accountId },
				select: { id: true },
			})
			if (!conversation) {
				throw new TRPCError({ code: 'NOT_FOUND', message: 'Conversation not found' })
			}

			return ctx.db.conversationNote.create({
				data: {
					conversationId: input.conversationId,
					userId: ctx.user.id,
					content: input.content,
				},
				include: {
					user: {
						select: { id: true, name: true, displayName: true, avatarUrl: true },
					},
				},
			})
		}),

	delete: protectedProcedure
		.input(z.object({ id: z.string().uuid() }))
		.mutation(async ({ ctx, input }) => {
			const note = await ctx.db.conversationNote.findFirst({
				where: { id: input.id },
				include: {
					conversation: { select: { accountId: true } },
				},
			})
			if (!note || note.conversation.accountId !== ctx.accountId) {
				throw new TRPCError({ code: 'NOT_FOUND', message: 'Note not found' })
			}
			if (note.userId !== ctx.user.id && !['ADMIN', 'OWNER'].includes(ctx.user.role)) {
				throw new TRPCError({ code: 'FORBIDDEN', message: 'Can only delete own notes' })
			}

			await ctx.db.conversationNote.delete({ where: { id: input.id } })
			return { success: true }
		}),
})
