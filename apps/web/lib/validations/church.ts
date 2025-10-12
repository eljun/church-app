/**
 * Church Validation Schemas
 * Zod schemas for type-safe church operations
 */

import { z } from 'zod'

export const createChurchSchema = z.object({
  name: z.string().min(2, 'Church name must be at least 2 characters'),
  field: z.string().min(1, 'Field is required'),
  district: z.string().min(1, 'District is required'),
  city: z.string().nullable().optional(),
  province: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  latitude: z.coerce.number().min(-90).max(90).nullable().optional(),
  longitude: z.coerce.number().min(-180).max(180).nullable().optional(),
  image_url: z.string().url('Invalid image URL').nullable().optional(),
  images: z.array(z.string().url('Invalid image URL')).default([]),
  is_active: z.boolean().default(true),
  established_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
})

export const updateChurchSchema = createChurchSchema.partial().extend({
  id: z.string().uuid('Invalid church ID'),
})

export const searchChurchesSchema = z.object({
  query: z.string().optional(),
  field: z.string().optional(),
  district: z.string().optional(),
  is_active: z.boolean().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
})

export type CreateChurchInput = z.infer<typeof createChurchSchema>
export type UpdateChurchInput = z.infer<typeof updateChurchSchema>
export type SearchChurchesInput = z.infer<typeof searchChurchesSchema>
