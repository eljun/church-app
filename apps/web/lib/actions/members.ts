/**
 * Member Server Actions
 * Mutations for member data
 */

'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createMemberSchema, updateMemberSchema } from '@/lib/validations/member'
import type { CreateMemberInput, UpdateMemberInput } from '@/lib/validations/member'

/**
 * Create a new member
 */
export async function createMember(input: CreateMemberInput) {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { error: 'Unauthorized' }
    }

    // Get user's role and church
    const { data: userData } = await supabase
      .from('users')
      .select('role, church_id')
      .eq('id', user.id)
      .single()

    if (!userData) {
      return { error: 'User not found' }
    }

    // Validate input
    const validated = createMemberSchema.parse(input)

    // Check permissions
    if (userData.role === 'admin' && validated.church_id !== userData.church_id) {
      return { error: 'Forbidden: Cannot create member for another church' }
    }

    // Insert member
    const { data: member, error } = await supabase
      .from('members')
      .insert(validated)
      .select()
      .single()

    if (error) {
      return { error: error.message }
    }

    // Log action
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'created_member',
      table_name: 'members',
      record_id: member.id,
      new_values: validated,
    })

    revalidatePath('/dashboard/members')
    revalidatePath('/dashboard')

    return { data: member }
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message }
    }
    return { error: 'Failed to create member' }
  }
}

/**
 * Update a member
 */
export async function updateMember(input: UpdateMemberInput) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { error: 'Unauthorized' }
    }

    const { data: userData } = await supabase
      .from('users')
      .select('role, church_id')
      .eq('id', user.id)
      .single()

    if (!userData) {
      return { error: 'User not found' }
    }

    // Validate input
    const validated = updateMemberSchema.parse(input)
    const { id, ...updateData } = validated

    // Get current member data
    const { data: currentMember } = await supabase
      .from('members')
      .select('*')
      .eq('id', id)
      .single()

    if (!currentMember) {
      return { error: 'Member not found' }
    }

    // Check permissions
    if (userData.role === 'admin' && currentMember.church_id !== userData.church_id) {
      return { error: 'Forbidden: Cannot update member from another church' }
    }

    // Handle status-specific date fields to comply with database constraints
    // Clear dates that don't match the current status
    if (updateData.status) {
      if (updateData.status !== 'disfellowshipped') {
        updateData.disfellowship_date = null
      }
      if (updateData.status !== 'resigned') {
        updateData.resignation_date = null
      }
      if (updateData.status !== 'deceased') {
        updateData.date_of_death = null
        updateData.cause_of_death = null
      }
    }

    // Update member
    const { data: member, error } = await supabase
      .from('members')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return { error: error.message }
    }

    // Log action
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'updated_member',
      table_name: 'members',
      record_id: id,
      old_values: currentMember,
      new_values: updateData,
    })

    revalidatePath('/dashboard/members')
    revalidatePath(`/dashboard/members/${id}`)
    revalidatePath('/dashboard')

    return { data: member }
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message }
    }
    return { error: 'Failed to update member' }
  }
}

/**
 * Delete a member (soft delete by updating status)
 */
export async function deleteMember(id: string) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { error: 'Unauthorized' }
    }

    const { data: userData } = await supabase
      .from('users')
      .select('role, church_id')
      .eq('id', user.id)
      .single()

    if (!userData) {
      return { error: 'User not found' }
    }

    // Only superadmin can delete
    if (userData.role !== 'superadmin') {
      return { error: 'Forbidden: Only superadmin can delete members' }
    }

    // Get current member data
    const { data: currentMember } = await supabase
      .from('members')
      .select('*')
      .eq('id', id)
      .single()

    if (!currentMember) {
      return { error: 'Member not found' }
    }

    // Hard delete (only superadmin can do this)
    const { error } = await supabase
      .from('members')
      .delete()
      .eq('id', id)

    if (error) {
      return { error: error.message }
    }

    // Log action
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'deleted_member',
      table_name: 'members',
      record_id: id,
      old_values: currentMember,
    })

    revalidatePath('/dashboard/members')
    revalidatePath('/dashboard')

    return { success: true }
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message }
    }
    return { error: 'Failed to delete member' }
  }
}

/**
 * Bulk import members
 */
export async function bulkImportMembers(members: CreateMemberInput[]) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { error: 'Unauthorized' }
    }

    const { data: userData } = await supabase
      .from('users')
      .select('role, church_id')
      .eq('id', user.id)
      .single()

    if (!userData) {
      return { error: 'User not found' }
    }

    // Validate all members
    const validated = members.map(m => createMemberSchema.parse(m))

    // Check permissions for each member
    if (userData.role === 'admin') {
      const unauthorized = validated.some(m => m.church_id !== userData.church_id)
      if (unauthorized) {
        return { error: 'Forbidden: Cannot import members for other churches' }
      }
    }

    // Bulk insert
    const { data, error } = await supabase
      .from('members')
      .insert(validated)
      .select()

    if (error) {
      return { error: error.message }
    }

    // Log action
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'bulk_import_members',
      table_name: 'members',
      record_id: user.id,
      new_values: { count: validated.length },
    })

    revalidatePath('/dashboard/members')
    revalidatePath('/dashboard')

    return { data, count: data.length }
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message }
    }
    return { error: 'Failed to import members' }
  }
}
