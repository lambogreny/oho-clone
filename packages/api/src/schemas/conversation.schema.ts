import { z } from 'zod'

export const conversationStatusSchema = z.enum(['PENDING', 'OPEN', 'RESOLVED', 'SNOOZED'])
export const conversationPrioritySchema = z.enum(['URGENT', 'HIGH', 'MEDIUM', 'LOW'])

export const listConversationsSchema = z.object({
	status: conversationStatusSchema.optional(),
	inboxId: z.string().uuid().optional(),
	assigneeId: z.string().uuid().optional(),
	teamId: z.string().uuid().optional(),
	cursor: z.string().uuid().optional(),
	limit: z.number().int().min(1).max(50).default(20),
})

export const createConversationSchema = z.object({
	inboxId: z.string().uuid(),
	contactId: z.string().uuid(),
	assigneeId: z.string().uuid().optional(),
	teamId: z.string().uuid().optional(),
	status: conversationStatusSchema.default('OPEN'),
	priority: conversationPrioritySchema.optional(),
	message: z
		.object({
			content: z.string().min(1).max(10000),
			private: z.boolean().default(false),
		})
		.optional(),
})

export const updateConversationSchema = z.object({
	id: z.string().uuid(),
	status: conversationStatusSchema.optional(),
	priority: conversationPrioritySchema.optional().nullable(),
	assigneeId: z.string().uuid().optional().nullable(),
	teamId: z.string().uuid().optional().nullable(),
	customAttributes: z.record(z.unknown()).optional(),
})

export const assignConversationSchema = z.object({
	id: z.string().uuid(),
	assigneeId: z.string().uuid().nullable(),
})

export type ListConversationsInput = z.infer<typeof listConversationsSchema>
export type CreateConversationInput = z.infer<typeof createConversationSchema>
export type UpdateConversationInput = z.infer<typeof updateConversationSchema>
