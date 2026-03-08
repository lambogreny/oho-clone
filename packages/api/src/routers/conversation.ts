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
					...(input.status === 'RESOLVED' && { unreadCount: 0, resolvedAt: new Date() }),
					...(input.status === 'OPEN' && { resolvedAt: null }),
				},
			})

			emitConversationUpdate(ctx.accountId, {
				id: updated.id,
				status: updated.status,
				...(input.status === 'RESOLVED' && { unreadCount: 0 }),
			})

			return updated
		}),

	setPriority: protectedProcedure
		.input(
			z.object({
				id: z.string().uuid(),
				priority: z.enum(['URGENT', 'HIGH', 'MEDIUM', 'LOW']).nullable(),
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
			return ctx.db.conversation.update({
				where: { id: input.id },
				data: { priority: input.priority },
			})
		}),

	addLabel: protectedProcedure
		.input(
			z.object({
				id: z.string().uuid(),
				label: z.string().min(1).max(50),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const conv = await ctx.db.conversation.findFirst({
				where: { id: input.id, accountId: ctx.accountId },
				select: { id: true, labels: true },
			})
			if (!conv) {
				throw new TRPCError({ code: 'NOT_FOUND', message: 'Conversation not found' })
			}
			if (conv.labels.includes(input.label)) return conv
			return ctx.db.conversation.update({
				where: { id: input.id },
				data: { labels: { push: input.label } },
			})
		}),

	removeLabel: protectedProcedure
		.input(
			z.object({
				id: z.string().uuid(),
				label: z.string(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const conv = await ctx.db.conversation.findFirst({
				where: { id: input.id, accountId: ctx.accountId },
				select: { id: true, labels: true },
			})
			if (!conv) {
				throw new TRPCError({ code: 'NOT_FOUND', message: 'Conversation not found' })
			}
			return ctx.db.conversation.update({
				where: { id: input.id },
				data: { labels: { set: conv.labels.filter((l) => l !== input.label) } },
			})
		}),

	setCategory: protectedProcedure
		.input(
			z.object({
				id: z.string().uuid(),
				category: z.string().max(100).nullable(),
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
			return ctx.db.conversation.update({
				where: { id: input.id },
				data: { category: input.category },
			})
		}),

	search: protectedProcedure
		.input(
			z.object({
				query: z.string().min(1).max(200),
				status: z.enum(['OPEN', 'PENDING', 'RESOLVED', 'SNOOZED']).optional(),
				limit: z.number().int().min(1).max(50).default(20),
			}),
		)
		.query(async ({ ctx, input }) => {
			return ctx.db.conversation.findMany({
				where: {
					accountId: ctx.accountId,
					...(input.status && { status: input.status }),
					OR: [
						{ contact: { name: { contains: input.query, mode: 'insensitive' } } },
						{ contact: { email: { contains: input.query, mode: 'insensitive' } } },
						{ messages: { some: { content: { contains: input.query, mode: 'insensitive' } } } },
						{ labels: { has: input.query } },
						{ category: { contains: input.query, mode: 'insensitive' } },
					],
				},
				take: input.limit,
				orderBy: { lastMessageAt: 'desc' },
				include: {
					contact: {
						select: { id: true, name: true, avatarUrl: true },
					},
					assignee: {
						select: { id: true, name: true, displayName: true },
					},
					inbox: {
						select: { id: true, name: true, channelType: true },
					},
				},
			})
		}),

	assign: protectedProcedure
		.input(
			z.object({
				id: z.string().uuid(),
				assigneeId: z.string().uuid().nullable(),
				teamId: z.string().uuid().nullable().optional(),
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

			if (input.assigneeId) {
				const assignee = await ctx.db.user.findFirst({
					where: { id: input.assigneeId, accountId: ctx.accountId },
					select: { id: true },
				})
				if (!assignee) {
					throw new TRPCError({ code: 'NOT_FOUND', message: 'Assignee not found' })
				}
			}

			if (input.teamId) {
				const team = await ctx.db.team.findFirst({
					where: { id: input.teamId, accountId: ctx.accountId },
					select: { id: true },
				})
				if (!team) {
					throw new TRPCError({ code: 'NOT_FOUND', message: 'Team not found' })
				}
			}

			const updated = await ctx.db.conversation.update({
				where: { id: input.id },
				data: {
					assigneeId: input.assigneeId,
					...(input.teamId !== undefined && { teamId: input.teamId }),
					status: input.assigneeId ? 'OPEN' : 'PENDING',
				},
				include: {
					assignee: { select: { id: true, name: true, displayName: true, avatarUrl: true } },
					team: { select: { id: true, name: true } },
				},
			})

			emitConversationUpdate(ctx.accountId, {
				id: updated.id,
				status: updated.status,
				assigneeId: updated.assigneeId,
				teamId: updated.teamId,
			})

			return updated
		}),
})
