import { z } from 'zod'

// Activity type enum
export const activityTypeSchema = z.enum([
  'phone_call',
  'home_visit',
  'bible_study',
  'follow_up_email',
  'text_message',
  'scheduled_visit',
  'other',
])

// Create visitor activity
export const createVisitorActivitySchema = z.object({
  visitor_id: z.string().uuid('Invalid visitor ID'),
  activity_type: activityTypeSchema,
  title: z.string().min(1, 'Title is required').max(255, 'Title is too long'),
  notes: z.string().optional().nullable(),
  scheduled_date: z.string().datetime().optional().nullable(),
  is_completed: z.boolean().default(false),
  completed_date: z.string().datetime().optional().nullable(),
  outcome: z.string().optional().nullable(),
}).refine(
  (data) => {
    // If completed, must have completed_date
    if (data.is_completed && !data.completed_date) {
      return false
    }
    return true
  },
  {
    message: 'Completed activities must have a completion date',
    path: ['completed_date'],
  }
)

// Update visitor activity
export const updateVisitorActivitySchema = z.object({
  id: z.string().uuid('Invalid activity ID'),
  activity_type: activityTypeSchema.optional(),
  title: z.string().min(1, 'Title is required').max(255, 'Title is too long').optional(),
  notes: z.string().optional().nullable(),
  scheduled_date: z.string().datetime().optional().nullable(),
  is_completed: z.boolean().optional(),
  completed_date: z.string().datetime().optional().nullable(),
  outcome: z.string().optional().nullable(),
})

// Complete an activity
export const completeActivitySchema = z.object({
  id: z.string().uuid('Invalid activity ID'),
  outcome: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

// Filter visitor activities
export const filterActivitiesSchema = z.object({
  visitor_id: z.string().uuid().optional(),
  user_id: z.string().uuid().optional(),
  activity_type: activityTypeSchema.optional(),
  is_completed: z.boolean().optional(),
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
})

// Type exports
export type CreateVisitorActivityInput = z.infer<typeof createVisitorActivitySchema>
export type UpdateVisitorActivityInput = z.infer<typeof updateVisitorActivitySchema>
export type CompleteActivityInput = z.infer<typeof completeActivitySchema>
export type FilterActivitiesInput = z.infer<typeof filterActivitiesSchema>
