/**
 * Member Validation Schemas
 * Zod schemas for type-safe member operations
 */

import { z } from 'zod'

export const createMemberSchema = z.object({
  church_id: z.string().uuid('Invalid church ID'),
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  birthday: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  age: z.coerce.number().int().min(0).max(150),
  gender: z.enum(['male', 'female']).optional(),
  date_of_baptism: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  baptized_by: z.string().nullable().optional(),
  physical_condition: z.enum(['fit', 'sickly']).default('fit'),
  illness_description: z.string().nullable().optional(),
  spiritual_condition: z.enum(['active', 'inactive']).default('active'),
  status: z.enum(['active', 'transferred_out', 'resigned', 'disfellowshipped', 'deceased']).default('active'),
  sp: z.string().nullable().optional(),
  disfellowship_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  resignation_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  date_of_death: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  cause_of_death: z.string().nullable().optional(),
})

export const updateMemberSchema = createMemberSchema.partial().extend({
  id: z.string().uuid('Invalid member ID'),
})

export const transferMemberSchema = z.object({
  member_id: z.string().uuid('Invalid member ID'),
  from_church_id: z.string().uuid('Invalid source church ID'),
  to_church_id: z.string().uuid('Invalid destination church ID'),
  notes: z.string().nullable().optional(),
})

export const searchMembersSchema = z.object({
  query: z.string().optional(),
  church_id: z.string().uuid().optional(),
  spiritual_condition: z.enum(['active', 'inactive']).optional(),
  status: z.enum(['active', 'transferred_out', 'resigned', 'disfellowshipped', 'deceased']).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
})

export type CreateMemberInput = z.infer<typeof createMemberSchema>
export type UpdateMemberInput = z.infer<typeof updateMemberSchema>
export type TransferMemberInput = z.infer<typeof transferMemberSchema>
export type SearchMembersInput = z.infer<typeof searchMembersSchema>
