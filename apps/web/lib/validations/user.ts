import { z } from 'zod'

/**
 * User role enum
 */
export const userRoleSchema = z.enum([
  'superadmin',
  'coordinator',
  'pastor',
  'bibleworker',
  'admin',
  'member',
])

export type UserRole = z.infer<typeof userRoleSchema>

/**
 * Create user schema
 */
export const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: userRoleSchema,
  church_id: z.string().uuid().nullable(),
  district_id: z.string().nullable(),
  field_id: z.string().nullable(),
  assigned_member_ids: z.array(z.string().uuid()).default([]),
}).refine(
  (data) => {
    // Admin must have a church_id
    if (data.role === 'admin' && !data.church_id) {
      return false
    }
    return true
  },
  {
    message: 'Admin users must be assigned to a church',
    path: ['church_id'],
  }
).refine(
  (data) => {
    // Pastor should have either district_id or field_id
    if (data.role === 'pastor' && !data.district_id && !data.field_id) {
      return false
    }
    return true
  },
  {
    message: 'Pastor must be assigned to a district or field',
    path: ['district_id'],
  }
).refine(
  (data) => {
    // Bibleworker should have assigned members
    if (data.role === 'bibleworker' && data.assigned_member_ids.length === 0) {
      return false
    }
    return true
  },
  {
    message: 'Bibleworker must be assigned to at least one member',
    path: ['assigned_member_ids'],
  }
)

export type CreateUserInput = z.infer<typeof createUserSchema>

/**
 * Update user schema
 */
export const updateUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email('Invalid email address').optional(),
  role: userRoleSchema.optional(),
  church_id: z.string().uuid().nullable().optional(),
  district_id: z.string().nullable().optional(),
  field_id: z.string().nullable().optional(),
  assigned_member_ids: z.array(z.string().uuid()).optional(),
}).refine(
  (data) => {
    // Admin must have a church_id
    if (data.role === 'admin' && data.church_id === null) {
      return false
    }
    return true
  },
  {
    message: 'Admin users must be assigned to a church',
    path: ['church_id'],
  }
)

export type UpdateUserInput = z.infer<typeof updateUserSchema>

/**
 * Delete user schema
 */
export const deleteUserSchema = z.object({
  id: z.string().uuid(),
})

export type DeleteUserInput = z.infer<typeof deleteUserSchema>

/**
 * Search users schema
 */
export const searchUsersSchema = z.object({
  query: z.string().optional(),
  role: userRoleSchema.optional(),
  church_id: z.string().uuid().optional(),
  limit: z.number().int().positive().default(50),
  offset: z.number().int().nonnegative().default(0),
})

export type SearchUsersInput = z.infer<typeof searchUsersSchema>
