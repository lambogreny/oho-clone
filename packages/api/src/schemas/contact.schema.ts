import { z } from 'zod'

export const createContactSchema = z.object({
	name: z.string().max(255).optional(),
	email: z.string().email().optional(),
	phone: z.string().max(20).optional(),
	avatarUrl: z.string().url().optional(),
	customAttributes: z.record(z.unknown()).optional(),
})

export const updateContactSchema = z.object({
	id: z.string().uuid(),
	name: z.string().max(255).optional(),
	email: z.string().email().optional(),
	phone: z.string().max(20).optional(),
	avatarUrl: z.string().url().optional(),
	customAttributes: z.record(z.unknown()).optional(),
})

export const listContactsSchema = z.object({
	search: z.string().max(100).optional(),
	cursor: z.string().uuid().optional(),
	limit: z.number().int().min(1).max(50).default(20),
})

export type CreateContactInput = z.infer<typeof createContactSchema>
export type UpdateContactInput = z.infer<typeof updateContactSchema>
