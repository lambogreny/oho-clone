import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { protectedProcedure, router } from '../trpc'
import { emitConversationUpdate } from '../ws'

export const conversationRouter = router({
	list: protectedProcedure
		.input(
			z.object({
				status: z.enum(['OPEN', 'PENDING', 'RESOLVED', 'SNOOZED']).optional(),
				assigneeId: z.string().uuid().optional(),
				inboxId: z.string().uuid().optional(),
				cursor: z.string().uuid().optional(),
				limit: z.number().int().min(1).max(50).default(20),
			}),
		)
		.query(async ({ ctx, input }) => {
			const { status, assigneeId, inboxId, cursor, limit } = input

			const conversations = await ctx.db.conversation.findMany({
				where: {
					accountId: ctx.accountId,
					...(status && { status }),
					...(assigneeId && { assigneeId }),
					...(inboxId && { inboxId }),
				},
				take: limit + 1,
				...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
				orderBy: { lastMessageAt: 'desc' },
				include: {
					contact: {
						select: { id: true, name: true, avatarUrl: true, email: true, phone: true },
					},
					assignee: {
						select: { id: true, name: true, displayName: true, avatarUrl: true },
					},
					inbox: {
						select: { id: true, name: true, channelType: true },
					},
					messages: {
						take: 1,
						orderBy: { createdAt: 'desc' },
						select: {
							id: true,
							content: true,
							contentType: true,
							createdAt: true,
							direction: true,
						},
					},
				},
			})

			const hasMore = conversations.length > limit
			const items = hasMore ? conversations.slice(0, limit) : conversations
			const nextCursor = hasMore ? items[items.length - 1]?.id : undefined

			return { items, nextCursor }
		}),

	getById: protectedProcedure
		.input(z.object({ id: z.string().uuid() }))
		.query(async ({ ctx, input }) => {
			const conversation = await ctx.db.conversation.findFirst({
				where: { id: input.id, accountId: ctx.accountId },
				include: {
					contact: true,
					assignee: {
						select: { id: true, name: true, displayName: true, avatarUrl: true },
					},
					inbox: { select: { id: true, name: true, channelType: true } },
					team: { select: { id: true, name: true } },
				},
			})

			if (!conversation) {
				throw new TRPCError({ code: 'NOT_FOUND', message: 'Conversation not found' })
			}

			return conversation
		}),

	create: protectedProcedure
		.input(
			z.object({
				inboxId: z.string().uuid(),
				contactId: z.string().uuid(),
				assigneeId: z.string().uuid().optional(),
				message: z
					.object({
						content: z.string().min(1).max(10000),
					})
					.optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			// Verify inbox and contact belong to the same account
			const [inbox, contact] = await Promise.all([
				ctx.db.inbox.findFirst({
					where: { id: input.inboxId, accountId: ctx.accountId },
					select: { id: true },
				}),
				ctx.db.contact.findFirst({
					where: { id: input.contactId, accountId: ctx.accountId },
					select: { id: true },
				}),
			])
			if (!inbox) {
				throw new TRPCError({ code: 'NOT_FOUND', message: 'Inbox not found' })
			}
			if (!contact) {
				throw new TRPCError({ code: 'NOT_FOUND', message: 'Contact not found' })
			}

			// Verify assignee belongs to the same account
			if (input.assigneeId) {
				const assignee = await ctx.db.user.findFirst({
					where: { id: input.assigneeId, accountId: ctx.accountId },
					select: { id: true },
				})
				if (!assignee) {
					throw new TRPCError({ code: 'NOT_FOUND', message: 'Assignee not found' })
				}
			}

			return ctx.db.conversation.create({
				data: {
					accountId: ctx.accountId,
					inboxId: input.inboxId,
					contactId: input.contactId,
					assigneeId: input.assigneeId,
					status: 'OPEN',
					lastMessageAt: new Date(),
					...(input.message && {
						messages: {
							create: {
								content: input.message.content,
								contentType: 'TEXT',
								direction: 'OUTBOUND',
								senderType: 'AGENT',
								senderId: ctx.user.id,
								status: 'SENT',
							},
						},
					}),
				},
				include: {
					contact: true,
					inbox: { select: { id: true, name: true, channelType: true } },
				},
			})
		}),

	updateStatus: protectedProcedure
		.input(
			z.object({
				id: z.string().uuid(),
				status: z.enum(['OPEN', 'PENDING', 'RESOLVED', 'SNOOZED']),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const existing = await ctx.db.conversation.findFirst({
				where: { id: input.id, accountId: ctx.accountId },
				select: { id: true },
			})
			if (!existing) {
				throw new TRPCError({ code: 'NOT_FOUND', message: 'Conversation not found' })
			}

			const updated = await ctx.db.conversation.update({
				where: { id: input.id },
				data: {
					status: input.status,
					...(input.status === 'RESOLVED' && { unreadCount: 0 }),
				},
			})

			emitConversationUpdate(ctx.accountId, {
				id: updated.id,
				status: updated.status,
				...(input.status === 'RESOLVED' && { unreadCount: 0 }),
			})

			return updated
		}),

	assign: protectedProcedure
		.input(
			z.object({
				id: z.string().uuid(),
				assigneeId: z.string().uuid().nullable(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const existing = await ctx.db.conversation.findFirst({
				where: { id: input.id, accountId: ctx.accountId },
				select: { id: true },
			})
			if (!existing) {
				throw new TRPCError({ code: 'NOT_FOUND', message: 'Conversation not found' })
			}

			// Verify assignee belongs to the same account
			if (input.assigneeId) {
				const assignee = await ctx.db.user.findFirst({
					where: { id: input.assigneeId, accountId: ctx.accountId },
					select: { id: true },
				})
				if (!assignee) {
					throw new TRPCError({ code: 'NOT_FOUND', message: 'Assignee not found' })
				}
			}

			const updated = await ctx.db.conversation.update({
				where: { id: input.id },
				data: {
					assigneeId: input.assigneeId,
					status: input.assigneeId ? 'OPEN' : 'PENDING',
				},
				include: {
					assignee: { select: { id: true, name: true, displayName: true, avatarUrl: true } },
				},
			})

			emitConversationUpdate(ctx.accountId, {
				id: updated.id,
				status: updated.status,
				assigneeId: updated.assigneeId,
			})

			return updated
		}),
})
