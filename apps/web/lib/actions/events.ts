/**
 * Event Server Actions
 * Mutations for event data
 */

'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createEventSchema, updateEventSchema } from '@/lib/validations/event'
import type { CreateEventInput, UpdateEventInput } from '@/lib/validations/event'

/**
 * Create a new event
 */
export async function createEvent(input: CreateEventInput) {
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
    const validated = createEventSchema.parse(input)

    // Check permissions based on event scope
    if (userData.role === 'admin') {
      if (!userData.church_id) {
        return { error: 'Admin must be assigned to a church' }
      }

      // For church-level events, force admin's church_id
      if (validated.event_scope === 'church') {
        validated.church_id = userData.church_id
        validated.scope_value = userData.church_id
      }
      // For non-church scopes (national, field, district), admins should not have church_id set
      else {
        validated.church_id = null
      }
    }

    // For church scope, ensure scope_value matches church_id
    if (validated.event_scope === 'church' && validated.church_id) {
      validated.scope_value = validated.church_id
    }

    // Insert event with created_by
    const { data: event, error } = await supabase
      .from('events')
      .insert({
        ...validated,
        created_by: user.id,
      })
      .select()
      .single()

    if (error) {
      return { error: error.message }
    }

    // Log action
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'created_event',
      table_name: 'events',
      record_id: event.id,
      new_values: validated,
    })

    revalidatePath('/events')
    revalidatePath('/dashboard')

    return { data: event }
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message }
    }
    return { error: 'Failed to create event' }
  }
}

/**
 * Update an event
 */
export async function updateEvent(input: UpdateEventInput) {
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
    const validated = updateEventSchema.parse(input)
    const { id, ...updateData } = validated

    // Get current event data
    const { data: currentEvent } = await supabase
      .from('events')
      .select('*')
      .eq('id', id)
      .single()

    if (!currentEvent) {
      return { error: 'Event not found' }
    }

    // Check permissions based on scope
    if (userData.role === 'admin') {
      // Admins can update church-level events only from their church
      if (currentEvent.event_scope === 'church' && currentEvent.church_id !== userData.church_id) {
        return { error: 'Forbidden: Cannot update event from another church' }
      }
      // Admins cannot update events they didn't create for non-church scopes
      if (currentEvent.event_scope !== 'church' && currentEvent.created_by !== user.id) {
        return { error: 'Forbidden: Cannot update events from higher organizational levels' }
      }
    }

    // For church scope, ensure scope_value matches church_id
    if (updateData.event_scope === 'church' && updateData.church_id) {
      updateData.scope_value = updateData.church_id
    }

    // Update event
    const { data: event, error } = await supabase
      .from('events')
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
      action: 'updated_event',
      table_name: 'events',
      record_id: id,
      old_values: currentEvent,
      new_values: updateData,
    })

    revalidatePath('/events')
    revalidatePath(`/events/${id}`)
    revalidatePath('/dashboard')

    return { data: event }
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message }
    }
    return { error: 'Failed to update event' }
  }
}

/**
 * Delete an event
 */
export async function deleteEvent(id: string) {
  try {
    console.log('🗑️ Delete event called with id:', id)
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      console.log('❌ No user found')
      return { error: 'Unauthorized' }
    }
    console.log('✅ User authenticated:', user.id)

    const { data: userData } = await supabase
      .from('users')
      .select('role, church_id')
      .eq('id', user.id)
      .single()

    if (!userData) {
      console.log('❌ User data not found')
      return { error: 'User not found' }
    }
    console.log('✅ User role:', userData.role)

    // Get current event data
    const { data: currentEvent, error: fetchError } = await supabase
      .from('events')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError) {
      console.log('❌ Error fetching event:', fetchError)
      return { error: fetchError.message }
    }

    if (!currentEvent) {
      console.log('❌ Event not found')
      return { error: 'Event not found' }
    }
    console.log('✅ Event found:', currentEvent.title)

    // Check permissions based on scope
    if (userData.role === 'admin') {
      // Admins can delete church-level events only from their church
      if (currentEvent.event_scope === 'church' && currentEvent.church_id !== userData.church_id) {
        console.log('❌ Admin cannot delete event from another church')
        return { error: 'Forbidden: Cannot delete event from another church' }
      }
      // For non-church scopes, only event creator can delete
      if (currentEvent.event_scope !== 'church' && currentEvent.created_by !== user.id) {
        console.log('❌ Admin cannot delete higher-level events they did not create')
        return { error: 'Forbidden: Cannot delete events from higher organizational levels' }
      }
    }

    // Only superadmin or event creator can delete
    if (userData.role !== 'superadmin' && currentEvent.created_by !== user.id) {
      console.log('❌ Not superadmin or event creator')
      return { error: 'Forbidden: Only event creator or superadmin can delete events' }
    }
    console.log('✅ Permission check passed')

    // Delete event
    console.log('🗑️ Attempting to delete event...')
    const { error: deleteError } = await supabase
      .from('events')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.log('❌ Delete error:', deleteError)
      return { error: deleteError.message }
    }
    console.log('✅ Event deleted successfully')

    // Log action
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'deleted_event',
      table_name: 'events',
      record_id: id,
      old_values: currentEvent,
    })
    console.log('✅ Audit log created')

    revalidatePath('/events')
    revalidatePath('/dashboard')
    console.log('✅ Paths revalidated')

    return { success: true }
  } catch (error) {
    console.log('❌ Exception caught:', error)
    if (error instanceof Error) {
      return { error: error.message }
    }
    return { error: 'Failed to delete event' }
  }
}
