'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
  createVisitorActivitySchema,
  updateVisitorActivitySchema,
  completeActivitySchema,
  type CreateVisitorActivityInput,
  type UpdateVisitorActivityInput,
  type CompleteActivityInput,
} from '@/lib/validations/visitor-activity'

/**
 * Create a new visitor activity
 */
export async function createVisitorActivity(input: CreateVisitorActivityInput) {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return { error: 'Unauthorized' }
    }

    // Validate input
    const validatedData = createVisitorActivitySchema.parse(input)

    // Insert activity
    const { data, error } = await supabase
      .from('visitor_activities')
      .insert([
        {
          ...validatedData,
          user_id: user.id,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error('Error creating visitor activity:', error)
      return { error: `Failed to create activity: ${error.message}` }
    }

    revalidatePath(`/visitors/${validatedData.visitor_id}`)
    revalidatePath('/visitors')
    return { data }
  } catch (error) {
    console.error('Error in createVisitorActivity:', error)
    if (error instanceof Error) {
      return { error: error.message }
    }
    return { error: 'An unexpected error occurred' }
  }
}

/**
 * Update a visitor activity
 */
export async function updateVisitorActivity(input: UpdateVisitorActivityInput) {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return { error: 'Unauthorized' }
    }

    // Validate input
    const validatedData = updateVisitorActivitySchema.parse(input)

    const { id, ...updates } = validatedData

    // Update activity
    const { data, error } = await supabase
      .from('visitor_activities')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating visitor activity:', error)
      return { error: `Failed to update activity: ${error.message}` }
    }

    revalidatePath(`/visitors/${data.visitor_id}`)
    revalidatePath('/visitors')
    return { data }
  } catch (error) {
    console.error('Error in updateVisitorActivity:', error)
    if (error instanceof Error) {
      return { error: error.message }
    }
    return { error: 'An unexpected error occurred' }
  }
}

/**
 * Mark an activity as completed
 */
export async function completeActivity(input: CompleteActivityInput) {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return { error: 'Unauthorized' }
    }

    // Validate input
    const validatedData = completeActivitySchema.parse(input)

    // Update activity
    const { data, error } = await supabase
      .from('visitor_activities')
      .update({
        is_completed: true,
        completed_date: new Date().toISOString(),
        outcome: validatedData.outcome,
        notes: validatedData.notes || undefined,
      })
      .eq('id', validatedData.id)
      .select()
      .single()

    if (error) {
      console.error('Error completing activity:', error)
      return { error: `Failed to complete activity: ${error.message}` }
    }

    revalidatePath(`/visitors/${data.visitor_id}`)
    revalidatePath('/visitors')
    return { data }
  } catch (error) {
    console.error('Error in completeActivity:', error)
    if (error instanceof Error) {
      return { error: error.message }
    }
    return { error: 'An unexpected error occurred' }
  }
}

/**
 * Delete a visitor activity
 */
export async function deleteVisitorActivity(activityId: string) {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return { error: 'Unauthorized' }
    }

    // Get visitor_id before deleting for revalidation
    const { data: activity } = await supabase
      .from('visitor_activities')
      .select('visitor_id')
      .eq('id', activityId)
      .single()

    // Delete activity
    const { error } = await supabase
      .from('visitor_activities')
      .delete()
      .eq('id', activityId)

    if (error) {
      console.error('Error deleting visitor activity:', error)
      return { error: `Failed to delete activity: ${error.message}` }
    }

    if (activity) {
      revalidatePath(`/visitors/${activity.visitor_id}`)
    }
    revalidatePath('/visitors')
    return { success: true }
  } catch (error) {
    console.error('Error in deleteVisitorActivity:', error)
    if (error instanceof Error) {
      return { error: error.message }
    }
    return { error: 'An unexpected error occurred' }
  }
}
