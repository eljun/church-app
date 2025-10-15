import { z } from 'zod'

// Service type enum
export const serviceTypeSchema = z.enum(['sabbath_morning', 'sabbath_afternoon', 'prayer_meeting', 'other'])

// Record single attendance
export const recordAttendanceSchema = z.object({
  church_id: z.string().uuid('Invalid church ID'),
  member_id: z.string().uuid('Invalid member ID').optional().nullable(),
  visitor_id: z.string().uuid('Invalid visitor ID').optional().nullable(),
  attendance_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  service_type: serviceTypeSchema,
  attended: z.boolean().default(true),
  notes: z.string().optional().nullable(),
}).refine(
  (data) => (data.member_id && !data.visitor_id) || (!data.member_id && data.visitor_id),
  {
    message: 'Must provide either member_id or visitor_id, not both',
  }
)

// Record bulk attendance (multiple members/visitors at once)
export const recordBulkAttendanceSchema = z.object({
  church_id: z.string().uuid('Invalid church ID'),
  attendance_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  service_type: serviceTypeSchema,
  member_ids: z.array(z.string().uuid()).optional().default([]),
  visitor_ids: z.array(z.string().uuid()).optional().default([]),
  notes: z.string().optional().nullable(),
}).refine(
  (data) => data.member_ids.length > 0 || data.visitor_ids.length > 0,
  {
    message: 'Must provide at least one member or visitor',
  }
)

// Update attendance record
export const updateAttendanceSchema = z.object({
  id: z.string().uuid('Invalid attendance ID'),
  attended: z.boolean().optional(),
  notes: z.string().optional().nullable(),
})

// Filter attendance records
export const filterAttendanceSchema = z.object({
  church_id: z.string().uuid('Invalid church ID').optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  service_type: serviceTypeSchema.optional(),
  member_id: z.string().uuid().optional(),
  visitor_id: z.string().uuid().optional(),
  attended: z.boolean().optional(),
})

// Type exports
export type RecordAttendanceInput = z.infer<typeof recordAttendanceSchema>
export type RecordBulkAttendanceInput = z.infer<typeof recordBulkAttendanceSchema>
export type UpdateAttendanceInput = z.infer<typeof updateAttendanceSchema>
export type FilterAttendanceInput = z.infer<typeof filterAttendanceSchema>
