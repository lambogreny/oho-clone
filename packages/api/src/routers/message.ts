import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { pushMessage } from '../libs/line'
import { protectedProcedure, router } from '../trpc'
import { emitNewMessage } from '../ws'

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
				select: {
					id: true,
					contactId: true,
					inboxId: true,
					inbox: { select: { channelType: true, channelConfig: true } },
				},
			})
			if (!conversation) {
				throw new TRPCError({ code: 'NOT_FOUND', message: 'Conversation not found' })
			}

			const now = new Date()
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
					data: { lastMessageAt: now },
				}),
			])

			// Emit to WebSocket clients
			emitNewMessage(ctx.accountId, input.conversationId, {
				id: message.id,
				conversationId: message.conversationId,
				content: message.content,
				contentType: message.contentType,
				direction: message.direction,
				senderType: message.senderType,
				senderId: message.senderId,
				status: message.status,
				createdAt: message.createdAt.toISOString(),
				attachments: message.attachments.map((a) => ({
					id: a.id,
					type: a.type,
					url: a.url,
					fileName: a.fileName,
				})),
			})

			// Deliver to LINE channel (fire-and-forget)
			if (conversation.inbox.channelType === 'LINE') {
				const config = conversation.inbox.channelConfig as Record<string, string> | null
				const accessToken = config?.channelAccessToken
				if (accessToken) {
					const contactInbox = await ctx.db.contactInbox.findFirst({
						where: { contactId: conversation.contactId, inboxId: conversation.inboxId },
						select: { sourceId: true },
					})
					if (contactInbox?.sourceId) {
						pushMessage(
							contactInbox.sourceId,
							[{ type: 'text', text: input.content }],
							accessToken,
						).catch((err) => {
							console.error('[LINE] Failed to send:', err)
							ctx.db.message
								.update({ where: { id: message.id }, data: { status: 'FAILED' } })
								.catch(() => {})
						})
					}
				}
			}

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
			// Verify message belongs to a conversation in user's account
			const message = await ctx.db.message.findFirst({
				where: {
					id: input.id,
					conversation: { accountId: ctx.accountId },
				},
				select: { id: true },
			})
			if (!message) {
				throw new TRPCError({ code: 'NOT_FOUND', message: 'Message not found' })
			}

			return ctx.db.message.update({
				where: { id: input.id },
				data: { status: input.status },
			})
		}),
})
