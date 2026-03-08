import { z } from 'zod'

export const messageContentTypeSchema = z.enum([
	'TEXT',
	'IMAGE',
	'VIDEO',
	'AUDIO',
	'FILE',
	'LOCATION',
	'TEMPLATE',
	'INTERACTIVE',
])

export const listMessagesSchema = z.object({
	conversationId: z.string().uuid(),
	cursor: z.string().uuid().optional(),
	limit: z.number().int().min(1).max(100).default(30),
})

export const sendMessageSchema = z.object({
	conversationId: z.string().uuid(),
	content: z.string().min(1).max(10000),
	contentType: messageContentTypeSchema.default('TEXT'),
	attachments: z
		.array(
			z.object({
				type: z.string(),
				fileName: z.string().optional(),
				url: z.string().url(),
				fileSize: z.number().int().optional(),
				mimeType: z.string().optional(),
			}),
		)
		.max(10)
		.optional(),
})

export const updateMessageStatusSchema = z.object({
	id: z.string().uuid(),
	status: z.enum(['SENT', 'DELIVERED', 'READ', 'FAILED']),
})

export type ListMessagesInput = z.infer<typeof listMessagesSchema>
export type SendMessageInput = z.infer<typeof sendMessageSchema>
