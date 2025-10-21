import { z } from 'zod'

/**
 * User role enum (updated for Phase 11: RBAC Overhaul)
 */
export const userRoleSchema = z.enum([
  'superadmin',
  'field_secretary',
  'pastor',
  'church_secretary',
  'coordinator',
  'bibleworker',
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
  assigned_church_ids: z.array(z.string().uuid()).default([]),
  assigned_member_ids: z.array(z.string().uuid()).default([]),
}).refine(
  (data) => {
    // Church Secretary must have a church_id
    if (data.role === 'church_secretary' && !data.church_id) {
      return false
    }
    return true
  },
  {
    message: 'Church Secretary must be assigned to a church',
    path: ['church_id'],
  }
).refine(
  (data) => {
    // Field Secretary must have a field_id
    if (data.role === 'field_secretary' && !data.field_id) {
      return false
    }
    return true
  },
  {
    message: 'Field Secretary must be assigned to a field (Luzon, Visayan, or Mindanao)',
    path: ['field_id'],
  }
).refine(
  (data) => {
    // Pastor must have a district_id
    if (data.role === 'pastor' && !data.district_id) {
      return false
    }
    return true
  },
  {
    message: 'Pastor must be assigned to a district',
    path: ['district_id'],
  }
).refine(
  (data) => {
    // Bibleworker should have at least one church assigned
    if (data.role === 'bibleworker' && data.assigned_church_ids.length === 0) {
      return false
    }
    return true
  },
  {
    message: 'Bible worker must be assigned to at least one church',
    path: ['assigned_church_ids'],
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
  assigned_church_ids: z.array(z.string().uuid()).optional(),
  assigned_member_ids: z.array(z.string().uuid()).optional(),
}).refine(
  (data) => {
    // Church Secretary must have a church_id
    if (data.role === 'church_secretary' && data.church_id === null) {
      return false
    }
    return true
  },
  {
    message: 'Church Secretary must be assigned to a church',
    path: ['church_id'],
  }
).refine(
  (data) => {
    // Field Secretary must have a field_id
    if (data.role === 'field_secretary' && data.field_id === null) {
      return false
    }
    return true
  },
  {
    message: 'Field Secretary must be assigned to a field',
    path: ['field_id'],
  }
).refine(
  (data) => {
    // Pastor must have a district_id
    if (data.role === 'pastor' && data.district_id === null) {
      return false
    }
    return true
  },
  {
    message: 'Pastor must be assigned to a district',
    path: ['district_id'],
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

/**
 * Change password schema
 */
export const changePasswordSchema = z.object({
  user_id: z.string().uuid(),
  new_password: z.string().min(8, 'Password must be at least 8 characters'),
})

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>

/**
 * Assign territory to pastor
 */
export const assignPastorTerritorySchema = z.object({
  user_id: z.string().uuid(),
  district_id: z.string().nullable().optional(),
  field_id: z.string().nullable().optional(),
}).refine((data) => {
  return data.district_id || data.field_id
}, {
  message: 'Must assign either a district or field',
  path: ['district_id']
})

export type AssignPastorTerritoryInput = z.infer<typeof assignPastorTerritorySchema>

/**
 * Assign members to bibleworker
 */
export const assignMembersSchema = z.object({
  user_id: z.string().uuid(),
  member_ids: z.array(z.string().uuid()).min(1, 'Must assign at least one member'),
})

export type AssignMembersInput = z.infer<typeof assignMembersSchema>
