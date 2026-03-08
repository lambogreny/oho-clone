import { z } from 'zod'

export const channelTypeSchema = z.enum([
	'LINE',
	'FACEBOOK',
	'INSTAGRAM',
	'WHATSAPP',
	'TIKTOK',
	'WEBCHAT',
	'EMAIL',
])

export const createInboxSchema = z.object({
	name: z.string().min(1).max(100),
	channelType: channelTypeSchema,
	channelConfig: z.record(z.unknown()).default({}),
	greeting: z.string().max(500).optional(),
	autoAssignment: z.boolean().default(true),
})

export const updateInboxSchema = z.object({
	id: z.string().uuid(),
	name: z.string().min(1).max(100).optional(),
	channelConfig: z.record(z.unknown()).optional(),
	greeting: z.string().max(500).optional().nullable(),
	autoAssignment: z.boolean().optional(),
	isActive: z.boolean().optional(),
})

export type CreateInboxInput = z.infer<typeof createInboxSchema>
export type UpdateInboxInput = z.infer<typeof updateInboxSchema>
