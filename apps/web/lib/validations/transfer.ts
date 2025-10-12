/**
 * Transfer Request Validation Schemas
 * Zod schemas for type-safe transfer operations
 */

import { z } from 'zod'

export const createTransferRequestSchema = z.object({
  member_id: z.string().uuid('Invalid member ID'),
  from_church_id: z.string().uuid('Invalid source church ID'),
  to_church_id: z.string().uuid('Invalid destination church ID'),
  notes: z.string().nullable().optional(),
})

export const approveTransferSchema = z.object({
  transfer_request_id: z.string().uuid('Invalid transfer request ID'),
})

export const rejectTransferSchema = z.object({
  transfer_request_id: z.string().uuid('Invalid transfer request ID'),
  rejection_reason: z.string().min(10, 'Please provide a reason (min 10 characters)'),
})

export type CreateTransferRequestInput = z.infer<typeof createTransferRequestSchema>
export type ApproveTransferInput = z.infer<typeof approveTransferSchema>
export type RejectTransferInput = z.infer<typeof rejectTransferSchema>
