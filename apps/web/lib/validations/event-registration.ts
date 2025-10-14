import { z } from 'zod'

// Status enum
export const eventRegistrationStatusEnum = z.enum([
  'registered',
  'attended',
  'no_show',
  'confirmed',
  'cancelled',
])

// Create single registration
export const createRegistrationSchema = z.object({
  event_id: z.string().uuid('Invalid event ID'),
  member_id: z.string().uuid('Invalid member ID'),
  notes: z.string().optional(),
})

// Create bulk registrations
export const createBulkRegistrationsSchema = z.object({
  event_id: z.string().uuid('Invalid event ID'),
  member_ids: z.array(z.string().uuid('Invalid member ID')).min(1, 'Select at least one member'),
  notes: z.string().optional(),
})

// Update registration status
export const updateRegistrationStatusSchema = z.object({
  status: eventRegistrationStatusEnum,
  notes: z.string().optional(),
})

// Confirm attendance (bulk)
export const confirmAttendanceSchema = z.object({
  registration_ids: z.array(z.string().uuid()).min(1, 'Select at least one registration'),
  status: z.enum(['attended', 'no_show']),
})

// Cancel registration
export const cancelRegistrationSchema = z.object({
  reason: z.string().optional(),
})

// Final confirmation by superadmin
export const finalConfirmationSchema = z.object({
  event_id: z.string().uuid('Invalid event ID'),
})

// Types
export type CreateRegistrationInput = z.infer<typeof createRegistrationSchema>
export type CreateBulkRegistrationsInput = z.infer<typeof createBulkRegistrationsSchema>
export type UpdateRegistrationStatusInput = z.infer<typeof updateRegistrationStatusSchema>
export type ConfirmAttendanceInput = z.infer<typeof confirmAttendanceSchema>
export type CancelRegistrationInput = z.infer<typeof cancelRegistrationSchema>
export type FinalConfirmationInput = z.infer<typeof finalConfirmationSchema>
