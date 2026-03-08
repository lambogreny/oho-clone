import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { protectedProcedure, router } from '../trpc'

export const messageRouter = router({
	list: protectedProcedure
		.input(
			z.object({
				conversationId: z.string().uuid(),
				cursor: z.string().uuid().optional(),
				limit: z.number().int().min(1).max(100).default(50),
			}),
		)
		.query(async ({ ctx, input }) => {
			const { conversationId, cursor, limit } = input

			// Verify conversation belongs to user's account
			const conversation = await ctx.db.conversation.findFirst({
				where: { id: conversationId, accountId: ctx.accountId },
				select: { id: true },
			})
			if (!conversation) {
				throw new TRPCError({ code: 'NOT_FOUND', message: 'Conversation not found' })
			}

			const messages = await ctx.db.message.findMany({
				where: { conversationId },
				take: limit + 1,
				...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
				orderBy: { createdAt: 'desc' },
				include: { attachments: true },
			})

			const hasMore = messages.length > limit
			const items = hasMore ? messages.slice(0, limit) : messages
			const nextCursor = hasMore ? items[items.length - 1]?.id : undefined

			return { items, nextCursor }
		}),

	send: protectedProcedure
		.input(
			z.object({
				conversationId: z.string().uuid(),
				content: z.string().min(1).max(10000),
				contentType: z.enum(['TEXT', 'IMAGE', 'VIDEO', 'FILE', 'AUDIO']).default('TEXT'),
				attachments: z
					.array(
						z.object({
							type: z.string(),
							url: z.string().url(),
							fileName: z.string().optional(),
							fileSize: z.number().int().optional(),
							mimeType: z.string().optional(),
						}),
					)
					.max(10)
					.optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			// Verify conversation belongs to user's account
			const conversation = await ctx.db.conversation.findFirst({
				where: { id: input.conversationId, accountId: ctx.accountId },
				select: { id: true },
			})
			if (!conversation) {
				throw new TRPCError({ code: 'NOT_FOUND', message: 'Conversation not found' })
			}

			const [message] = await ctx.db.$transaction([
				ctx.db.message.create({
					data: {
						conversationId: input.conversationId,
						content: input.content,
						contentType: input.contentType,
						direction: 'OUTBOUND',
						senderType: 'AGENT',
						senderId: ctx.user.id,
						status: 'SENT',
						...(input.attachments && {
							attachments: { create: input.attachments },
						}),
					},
					include: { attachments: true },
				}),
				ctx.db.conversation.update({
					where: { id: input.conversationId },
					data: { lastMessageAt: new Date() },
				}),
			])

			return message
		}),

	updateStatus: protectedProcedure
		.input(
			z.object({
				id: z.string().uuid(),
				status: z.enum(['SENT', 'DELIVERED', 'READ', 'FAILED']),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			return ctx.db.message.update({
				where: { id: input.id },
				data: { status: input.status },
			})
		}),
})
