import type { Prisma } from '@oho/db'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { protectedProcedure, router } from '../trpc'

export const contactRouter = router({
	list: protectedProcedure
		.input(
			z.object({
				search: z.string().optional(),
				cursor: z.string().uuid().optional(),
				limit: z.number().int().min(1).max(50).default(20),
			}),
		)
		.query(async ({ ctx, input }) => {
			const { search, cursor, limit } = input

			const contacts = await ctx.db.contact.findMany({
				where: {
					accountId: ctx.accountId,
					...(search && {
						OR: [
							{ name: { contains: search, mode: 'insensitive' } },
							{ email: { contains: search, mode: 'insensitive' } },
							{ phone: { contains: search, mode: 'insensitive' } },
						],
					}),
				},
				take: limit + 1,
				...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
				orderBy: { updatedAt: 'desc' },
			})

			const hasMore = contacts.length > limit
			const items = hasMore ? contacts.slice(0, limit) : contacts
			const nextCursor = hasMore ? items[items.length - 1]?.id : undefined

			return { items, nextCursor }
		}),

	getById: protectedProcedure
		.input(z.object({ id: z.string().uuid() }))
		.query(async ({ ctx, input }) => {
			const contact = await ctx.db.contact.findFirst({
				where: { id: input.id, accountId: ctx.accountId },
				include: {
					contactInboxes: {
						include: { inbox: { select: { id: true, name: true, channelType: true } } },
					},
					conversations: {
						take: 5,
						orderBy: { updatedAt: 'desc' },
						select: { id: true, status: true, lastMessageAt: true },
					},
				},
			})

			if (!contact) {
				throw new TRPCError({ code: 'NOT_FOUND', message: 'Contact not found' })
			}

			return contact
		}),

	create: protectedProcedure
		.input(
			z.object({
				name: z.string().min(1).max(255),
				email: z.string().email().optional(),
				phone: z.string().max(20).optional(),
				avatarUrl: z.string().url().optional(),
				customAttributes: z.record(z.unknown()).optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const data: Prisma.ContactUncheckedCreateInput = {
				accountId: ctx.accountId,
				name: input.name,
				email: input.email,
				phone: input.phone,
				avatarUrl: input.avatarUrl,
			}
			if (input.customAttributes) {
				data.customAttributes = input.customAttributes as Prisma.InputJsonValue
			}
			return ctx.db.contact.create({ data })
		}),

	update: protectedProcedure
		.input(
			z.object({
				id: z.string().uuid(),
				name: z.string().min(1).max(255).optional(),
				email: z.string().email().optional(),
				phone: z.string().max(20).optional(),
				avatarUrl: z.string().url().optional(),
				customAttributes: z.record(z.unknown()).optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { id, customAttributes, ...rest } = input

			const existing = await ctx.db.contact.findFirst({
				where: { id, accountId: ctx.accountId },
				select: { id: true },
			})
			if (!existing) {
				throw new TRPCError({ code: 'NOT_FOUND', message: 'Contact not found' })
			}

			const data: Prisma.ContactUncheckedUpdateInput = { ...rest }
			if (customAttributes !== undefined) {
				data.customAttributes = customAttributes as Prisma.InputJsonValue
			}
			return ctx.db.contact.update({ where: { id }, data })
		}),
})
