'use server'

/**
 * User Actions
 * Server actions for user management (superadmin only)
 */

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
  createUserSchema,
  updateUserSchema,
  deleteUserSchema,
  type CreateUserInput,
  type UpdateUserInput,
  type DeleteUserInput,
} from '@/lib/validations/user'

/**
 * Check if current user is superadmin
 */
async function checkSuperadmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Unauthorized' }
  }

  const { data: currentUser } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!currentUser || currentUser.role !== 'superadmin') {
    return { error: 'Unauthorized: Superadmin access required' }
  }

  return { user }
}

/**
 * Create a new user (superadmin only)
 */
export async function createUser(input: CreateUserInput) {
  try {
    // Check authorization
    const authCheck = await checkSuperadmin()
    if (authCheck.error) {
      return { error: authCheck.error }
    }

    // Validate input
    const validatedInput = createUserSchema.parse(input)

    const supabase = await createClient()

    // Create auth user via Supabase Admin API
    // Note: This requires service_role key in production
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: validatedInput.email,
      password: validatedInput.password,
      email_confirm: true, // Auto-confirm email
    })

    if (authError) {
      return { error: `Failed to create auth user: ${authError.message}` }
    }

    if (!authData.user) {
      return { error: 'Failed to create auth user: No user data returned' }
    }

    // Update user record in users table with role and assignments
    const { error: updateError } = await supabase
      .from('users')
      .update({
        role: validatedInput.role,
        church_id: validatedInput.church_id,
        district_id: validatedInput.district_id,
        field_id: validatedInput.field_id,
        assigned_church_ids: validatedInput.assigned_church_ids,
        assigned_member_ids: validatedInput.assigned_member_ids,
      })
      .eq('id', authData.user.id)

    if (updateError) {
      // Rollback: Delete auth user
      await supabase.auth.admin.deleteUser(authData.user.id)
      return { error: `Failed to update user record: ${updateError.message}` }
    }

    revalidatePath('/settings/users')
    return { success: true, data: { id: authData.user.id } }
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message }
    }
    return { error: 'Failed to create user' }
  }
}

/**
 * Update a user (superadmin only)
 */
export async function updateUser(input: UpdateUserInput) {
  try {
    // Check authorization
    const authCheck = await checkSuperadmin()
    if (authCheck.error) {
      return { error: authCheck.error }
    }

    // Validate input
    const validatedInput = updateUserSchema.parse(input)

    const supabase = await createClient()

    // Build update object (only include provided fields)
    const updateData: Record<string, unknown> = {}
    if (validatedInput.email !== undefined) updateData.email = validatedInput.email
    if (validatedInput.role !== undefined) updateData.role = validatedInput.role
    if (validatedInput.church_id !== undefined) updateData.church_id = validatedInput.church_id
    if (validatedInput.district_id !== undefined) updateData.district_id = validatedInput.district_id
    if (validatedInput.field_id !== undefined) updateData.field_id = validatedInput.field_id
    if (validatedInput.assigned_church_ids !== undefined) {
      updateData.assigned_church_ids = validatedInput.assigned_church_ids
    }
    if (validatedInput.assigned_member_ids !== undefined) {
      updateData.assigned_member_ids = validatedInput.assigned_member_ids
    }

    // Update user record
    const { error: updateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', validatedInput.id)

    if (updateError) {
      return { error: `Failed to update user: ${updateError.message}` }
    }

    // Update auth email if provided
    if (validatedInput.email) {
      const { error: authError } = await supabase.auth.admin.updateUserById(
        validatedInput.id,
        { email: validatedInput.email }
      )

      if (authError) {
        return { error: `Failed to update user email: ${authError.message}` }
      }
    }

    revalidatePath('/settings/users')
    return { success: true }
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message }
    }
    return { error: 'Failed to update user' }
  }
}

/**
 * Delete a user (superadmin only)
 */
export async function deleteUser(input: DeleteUserInput) {
  try {
    // Check authorization
    const authCheck = await checkSuperadmin()
    if (authCheck.error) {
      return { error: authCheck.error }
    }

    // Validate input
    const validatedInput = deleteUserSchema.parse(input)

    const supabase = await createClient()

    // Prevent deleting self
    if (authCheck.user?.id === validatedInput.id) {
      return { error: 'Cannot delete your own account' }
    }

    // Delete user from auth (this will cascade to users table via trigger)
    const { error: authError } = await supabase.auth.admin.deleteUser(validatedInput.id)

    if (authError) {
      return { error: `Failed to delete user: ${authError.message}` }
    }

    revalidatePath('/settings/users')
    return { success: true }
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message }
    }
    return { error: 'Failed to delete user' }
  }
}

/**
 * Reset user password (superadmin only)
 */
export async function resetUserPassword(userId: string, newPassword: string) {
  try {
    // Check authorization
    const authCheck = await checkSuperadmin()
    if (authCheck.error) {
      return { error: authCheck.error }
    }

    if (!userId || !newPassword) {
      return { error: 'User ID and password are required' }
    }

    if (newPassword.length < 8) {
      return { error: 'Password must be at least 8 characters' }
    }

    const supabase = await createClient()

    // Update password via Admin API
    const { error: authError } = await supabase.auth.admin.updateUserById(userId, {
      password: newPassword,
    })

    if (authError) {
      return { error: `Failed to reset password: ${authError.message}` }
    }

    return { success: true }
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message }
    }
    return { error: 'Failed to reset password' }
  }
}

/**
 * Get assignable members (wrapper for client-side calls)
 */
export async function getAssignableMembersAction(churchId?: string) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { error: 'Unauthorized', data: [] }
    }

    let query = supabase
      .from('members')
      .select('id, full_name, church_id, churches:church_id(name)')
      .eq('status', 'active')
      .order('full_name', { ascending: true })

    if (churchId) {
      query = query.eq('church_id', churchId)
    }

    const { data, error } = await query

    if (error) {
      return { error: error.message, data: [] }
    }

    return { data: data || [], error: null }
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message, data: [] }
    }
    return { error: 'Failed to fetch members', data: [] }
  }
}
