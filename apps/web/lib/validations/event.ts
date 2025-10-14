/**
 * Event Validation Schemas
 * Zod schemas for type-safe event operations
 */

import { z } from 'zod'

const baseEventSchema = z.object({
  church_id: z.string().uuid('Invalid church ID').nullable().optional(),
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().nullable().optional(),
  event_type: z.enum(['service', 'baptism', 'conference', 'social', 'other']),
  event_scope: z.enum(['national', 'field', 'district', 'church']).default('church'),
  scope_value: z.string().nullable().optional(),
  start_date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid start date',
  }),
  end_date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid end date',
  }).nullable().optional(),
  location: z.string().nullable().optional(),
  image_url: z.string().url('Invalid image URL').nullable().optional(),
  is_public: z.boolean().default(true),
})

export const createEventSchema = baseEventSchema.refine(
  (data) => {
    if (data.end_date && data.start_date) {
      return new Date(data.end_date) >= new Date(data.start_date)
    }
    return true
  },
  {
    message: 'End date must be after or equal to start date',
    path: ['end_date'],
  }
)

export const updateEventSchema = baseEventSchema.partial().extend({
  id: z.string().uuid('Invalid event ID'),
}).refine(
  (data) => {
    if (data.end_date && data.start_date) {
      return new Date(data.end_date) >= new Date(data.start_date)
    }
    return true
  },
  {
    message: 'End date must be after or equal to start date',
    path: ['end_date'],
  }
)

export const searchEventsSchema = z.object({
  query: z.string().optional(),
  church_id: z.string().uuid().optional(),
  event_type: z.enum(['service', 'baptism', 'conference', 'social', 'other']).optional(),
  is_public: z.boolean().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
})

export type CreateEventInput = z.infer<typeof createEventSchema>
export type UpdateEventInput = z.infer<typeof updateEventSchema>
export type SearchEventsInput = z.infer<typeof searchEventsSchema>
