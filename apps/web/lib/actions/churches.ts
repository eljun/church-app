/**
 * Church Server Actions
 * Mutations for church data
 */

'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createChurchSchema, updateChurchSchema } from '@/lib/validations/church'
import type { CreateChurchInput, UpdateChurchInput } from '@/lib/validations/church'

/**
 * Create a new church
 * Only superadmin can create churches
 */
export async function createChurch(input: CreateChurchInput) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { error: 'Unauthorized' }
    }

    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!userData || userData.role !== 'superadmin') {
      return { error: 'Forbidden: Only superadmin can create churches' }
    }

    // Validate input
    const validated = createChurchSchema.parse(input)

    // Insert church
    const { data: church, error } = await supabase
      .from('churches')
      .insert(validated)
      .select()
      .single()

    if (error) {
      return { error: error.message }
    }

    // Log action
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'created_church',
      table_name: 'churches',
      record_id: church.id,
      new_values: validated,
    })

    revalidatePath('/dashboard/churches')
    revalidatePath('/dashboard')

    return { data: church }
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message }
    }
    return { error: 'Failed to create church' }
  }
}

/**
 * Update a church
 * Only superadmin can update churches
 */
export async function updateChurch(input: UpdateChurchInput) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { error: 'Unauthorized' }
    }

    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!userData || userData.role !== 'superadmin') {
      return { error: 'Forbidden: Only superadmin can update churches' }
    }

    // Validate input
    const validated = updateChurchSchema.parse(input)
    const { id, ...updateData } = validated

    // Get current church data
    const { data: currentChurch } = await supabase
      .from('churches')
      .select('*')
      .eq('id', id)
      .single()

    if (!currentChurch) {
      return { error: 'Church not found' }
    }

    // Update church
    const { data: church, error } = await supabase
      .from('churches')
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
      action: 'updated_church',
      table_name: 'churches',
      record_id: id,
      old_values: currentChurch,
      new_values: updateData,
    })

    revalidatePath('/dashboard/churches')
    revalidatePath(`/dashboard/churches/${id}`)
    revalidatePath('/dashboard')

    return { data: church }
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message }
    }
    return { error: 'Failed to update church' }
  }
}

/**
 * Delete a church (soft delete by setting is_active = false)
 * Only superadmin can delete churches
 */
export async function deleteChurch(id: string) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { error: 'Unauthorized' }
    }

    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!userData || userData.role !== 'superadmin') {
      return { error: 'Forbidden: Only superadmin can delete churches' }
    }

    // Check if church has members
    const { count } = await supabase
      .from('members')
      .select('*', { count: 'exact', head: true })
      .eq('church_id', id)

    if (count && count > 0) {
      return { error: 'Cannot delete church with members. Please transfer members first.' }
    }

    // Get current church data
    const { data: currentChurch } = await supabase
      .from('churches')
      .select('*')
      .eq('id', id)
      .single()

    if (!currentChurch) {
      return { error: 'Church not found' }
    }

    // Soft delete
    const { error } = await supabase
      .from('churches')
      .update({ is_active: false })
      .eq('id', id)

    if (error) {
      return { error: error.message }
    }

    // Log action
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'deleted_church',
      table_name: 'churches',
      record_id: id,
      old_values: currentChurch,
    })

    revalidatePath('/dashboard/churches')
    revalidatePath('/dashboard')

    return { success: true }
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message }
    }
    return { error: 'Failed to delete church' }
  }
}
