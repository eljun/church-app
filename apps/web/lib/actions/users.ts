'use server'

/**
 * User Actions
 * Server actions for user management (superadmin only)
 */

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
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
    console.log('CreateUser Input:', JSON.stringify(input, null, 2))
    const validatedInput = createUserSchema.parse(input)
    console.log('Validated Input:', JSON.stringify(validatedInput, null, 2))

    const adminClient = createAdminClient()

    // Create auth user via Supabase Admin API
    // Note: This requires service_role key
    console.log('Creating auth user...')
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email: validatedInput.email,
      password: validatedInput.password,
      email_confirm: true, // Auto-confirm email
    })

    if (authError) {
      console.error('Auth creation error:', authError)
      return { error: `Failed to create auth user: ${authError.message}` }
    }

    if (!authData.user) {
      console.error('No user data returned from auth creation')
      return { error: 'Failed to create auth user: No user data returned' }
    }

    console.log('Auth user created:', authData.user.id)

    // Update user record in users table with role and assignments
    // Use admin client to bypass RLS and ensure update succeeds
    const updateData = {
      role: validatedInput.role,
      church_id: validatedInput.church_id,
      district_id: validatedInput.district_id,
      field_id: validatedInput.field_id,
      assigned_church_ids: validatedInput.assigned_church_ids,
      assigned_member_ids: validatedInput.assigned_member_ids,
    }
    console.log('Updating user record with:', JSON.stringify(updateData, null, 2))

    const { error: updateError } = await (
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      adminClient.from('users') as any
    )
      .update(updateData)
      .eq('id', authData.user.id)

    if (updateError) {
      console.error('User record update error:', updateError)
      // Rollback: Delete auth user
      await adminClient.auth.admin.deleteUser(authData.user.id)
      return { error: `Failed to update user record: ${updateError.message}` }
    }

    console.log('User record updated successfully')
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

    const adminClient = createAdminClient()

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

    // Update user record - use admin client to bypass RLS
    const { error: updateError } = await (
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      adminClient.from('users') as any
    )
      .update(updateData)
      .eq('id', validatedInput.id)

    if (updateError) {
      return { error: `Failed to update user: ${updateError.message}` }
    }

    // Update auth email if provided
    if (validatedInput.email) {
      const { error: authError } = await adminClient.auth.admin.updateUserById(
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
 * Deactivate a user (soft delete - superadmin only)
 * Sets is_active = false, preserving all historical data
 */
export async function deactivateUser(input: DeleteUserInput) {
  try {
    // Check authorization
    const authCheck = await checkSuperadmin()
    if (authCheck.error) {
      return { error: authCheck.error }
    }

    // Validate input
    const validatedInput = deleteUserSchema.parse(input)

    const adminClient = createAdminClient()

    // Prevent deactivating self
    if (authCheck.user?.id === validatedInput.id) {
      return { error: 'Cannot deactivate your own account' }
    }

    // Soft delete: Set is_active = false
    const { error: updateError } = await (
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      adminClient.from('users') as any
    )
      .update({ is_active: false })
      .eq('id', validatedInput.id)

    if (updateError) {
      return { error: `Failed to deactivate user: ${updateError.message}` }
    }

    revalidatePath('/settings/users')
    return { success: true }
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message }
    }
    return { error: 'Failed to deactivate user' }
  }
}

/**
 * Reactivate a user (superadmin only)
 */
export async function reactivateUser(userId: string) {
  try {
    // Check authorization
    const authCheck = await checkSuperadmin()
    if (authCheck.error) {
      return { error: authCheck.error }
    }

    const adminClient = createAdminClient()

    // Set is_active = true
    const { error: updateError } = await (
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      adminClient.from('users') as any
    )
      .update({ is_active: true })
      .eq('id', userId)

    if (updateError) {
      return { error: `Failed to reactivate user: ${updateError.message}` }
    }

    revalidatePath('/settings/users')
    return { success: true }
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message }
    }
    return { error: 'Failed to reactivate user' }
  }
}

/**
 * Delete a user permanently (superadmin only)
 * WARNING: This permanently deletes the user and auth account.
 * Use deactivateUser() instead to preserve historical data.
 * This will fail if user has related records (events, reports, etc.)
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

    const adminClient = createAdminClient()

    // Prevent deleting self
    if (authCheck.user?.id === validatedInput.id) {
      return { error: 'Cannot delete your own account' }
    }

    // Delete user from auth (this will cascade to users table via trigger)
    const { error: authError } = await adminClient.auth.admin.deleteUser(validatedInput.id)

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

    const adminClient = createAdminClient()

    // Update password via Admin API
    const { error: authError } = await adminClient.auth.admin.updateUserById(userId, {
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
