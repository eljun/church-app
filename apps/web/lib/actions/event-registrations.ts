'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import {
  createRegistrationSchema,
  createBulkRegistrationsSchema,  
  confirmAttendanceSchema,
  finalConfirmationSchema,
  type CreateRegistrationInput,
  type CreateBulkRegistrationsInput,  
  type ConfirmAttendanceInput,
  type FinalConfirmationInput,
} from '@/lib/validations/event-registration'

/**
 * Register a single member for an event
 */
export async function registerMemberForEvent(input: CreateRegistrationInput) {
  try {
    const supabase = await createClient()

    // Validate input
    const validated = createRegistrationSchema.parse(input)

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { error: 'Unauthorized' }
    }

    // Check if already registered
    const { data: existing } = await supabase
      .from('event_registrations')
      .select('id, status')
      .eq('event_id', validated.event_id)
      .eq('member_id', validated.member_id)
      .in('status', ['registered', 'attended', 'confirmed'])
      .maybeSingle()

    if (existing) {
      return { error: 'Member is already registered for this event' }
    }

    // Create registration
    const { data, error } = await supabase
      .from('event_registrations')
      .insert({
        event_id: validated.event_id,
        member_id: validated.member_id,
        registered_by: user.id,
        status: 'registered',
        notes: validated.notes || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating registration:', error)
      return { error: `Failed to register member: ${error.message}` }
    }

    revalidatePath(`/events/${validated.event_id}`)
    return { data, error: null }
  } catch (error) {
    console.error('Error in registerMemberForEvent:', error)
    return { error: error instanceof Error ? error.message : 'An error occurred' }
  }
}

/**
 * Register multiple members for an event (bulk registration)
 */
export async function registerMembersForEventBulk(input: CreateBulkRegistrationsInput) {
  try {
    const supabase = await createClient()

    // Validate input
    const validated = createBulkRegistrationsSchema.parse(input)

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { error: 'Unauthorized' }
    }

    // Check for existing registrations
    const { data: existing } = await supabase
      .from('event_registrations')
      .select('member_id')
      .eq('event_id', validated.event_id)
      .in('member_id', validated.member_ids)
      .in('status', ['registered', 'attended', 'confirmed'])

    const existingMemberIds = new Set(existing?.map(r => r.member_id) || [])
    const newMemberIds = validated.member_ids.filter(id => !existingMemberIds.has(id))

    if (newMemberIds.length === 0) {
      return { error: 'All selected members are already registered' }
    }

    // Create registrations
    const registrations = newMemberIds.map(member_id => ({
      event_id: validated.event_id,
      member_id,
      registered_by: user.id,
      status: 'registered' as const,
      notes: validated.notes || null,
    }))

    const { data, error } = await supabase
      .from('event_registrations')
      .insert(registrations)
      .select()

    if (error) {
      console.error('Error creating bulk registrations:', error)
      return { error: `Failed to register members: ${error.message}` }
    }

    revalidatePath(`/events/${validated.event_id}`)
    return {
      data,
      error: null,
      registered: newMemberIds.length,
      skipped: existingMemberIds.size,
    }
  } catch (error) {
    console.error('Error in registerMembersForEventBulk:', error)
    return { error: error instanceof Error ? error.message : 'An error occurred' }
  }
}

/**
 * Cancel a registration
 */
export async function cancelRegistration(registrationId: string, reason?: string) {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { error: 'Unauthorized' }
    }

    // Get registration to verify ownership and get event_id
    const { data: registration } = await supabase
      .from('event_registrations')
      .select('event_id, registered_by, status')
      .eq('id', registrationId)
      .single()

    if (!registration) {
      return { error: 'Registration not found' }
    }

    // Only allow canceling if status is 'registered'
    if (registration.status !== 'registered') {
      return { error: 'Can only cancel registrations that are in "registered" status' }
    }

    // Update status to cancelled
    const { error } = await supabase
      .from('event_registrations')
      .update({
        status: 'cancelled',
        notes: reason ? `Cancelled: ${reason}` : 'Cancelled',
      })
      .eq('id', registrationId)

    if (error) {
      console.error('Error cancelling registration:', error)
      return { error: `Failed to cancel registration: ${error.message}` }
    }

    revalidatePath(`/events/${registration.event_id}`)
    return { error: null }
  } catch (error) {
    console.error('Error in cancelRegistration:', error)
    return { error: error instanceof Error ? error.message : 'An error occurred' }
  }
}

/**
 * Confirm attendance for multiple registrations (post-event)
 */
export async function confirmAttendanceBulk(input: ConfirmAttendanceInput) {
  try {
    const supabase = await createClient()

    // Validate input
    const validated = confirmAttendanceSchema.parse(input)

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { error: 'Unauthorized' }
    }

    // Update registrations
    const { data, error } = await supabase
      .from('event_registrations')
      .update({
        status: validated.status,
        attendance_confirmed_at: new Date().toISOString(),
        attendance_confirmed_by: user.id,
      })
      .in('id', validated.registration_ids)
      .select()

    if (error) {
      console.error('Error confirming attendance:', error)
      return { error: `Failed to confirm attendance: ${error.message}` }
    }

    // Revalidate the event page
    if (data && data.length > 0) {
      revalidatePath(`/events/${data[0].event_id}`)
      revalidatePath(`/events/${data[0].event_id}/attendance`)
    }

    return { data, error: null }
  } catch (error) {
    console.error('Error in confirmAttendanceBulk:', error)
    return { error: error instanceof Error ? error.message : 'An error occurred' }
  }
}

/**
 * Update a single registration's attendance status
 */
export async function updateRegistrationAttendance(
  registrationId: string,
  status: 'attended' | 'no_show' | 'registered'
) {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { error: 'Unauthorized' }
    }

    // Get registration to get event_id
    const { data: registration } = await supabase
      .from('event_registrations')
      .select('event_id')
      .eq('id', registrationId)
      .single()

    if (!registration) {
      return { error: 'Registration not found' }
    }

    // Update registration
    const updateData: {
      status: 'attended' | 'no_show' | 'registered'
      attendance_confirmed_at?: string | null
      attendance_confirmed_by?: string | null
    } = {
      status,
    }

    // If changing to attended or no_show, record confirmation details
    if (status === 'attended' || status === 'no_show') {
      updateData.attendance_confirmed_at = new Date().toISOString()
      updateData.attendance_confirmed_by = user.id
    } else if (status === 'registered') {
      // Reset confirmation if changing back to registered
      updateData.attendance_confirmed_at = null
      updateData.attendance_confirmed_by = null
    }

    const { error } = await supabase
      .from('event_registrations')
      .update(updateData)
      .eq('id', registrationId)

    if (error) {
      console.error('Error updating registration attendance:', error)
      return { error: `Failed to update attendance: ${error.message}` }
    }

    revalidatePath(`/events/${registration.event_id}`)
    revalidatePath(`/events/${registration.event_id}/attendance`)
    return { error: null }
  } catch (error) {
    console.error('Error in updateRegistrationAttendance:', error)
    return { error: error instanceof Error ? error.message : 'An error occurred' }
  }
}

/**
 * Delete a registration (admin only, before event)
 */
export async function deleteRegistration(registrationId: string) {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { error: 'Unauthorized' }
    }

    // Get registration to get event_id
    const { data: registration } = await supabase
      .from('event_registrations')
      .select('event_id, status')
      .eq('id', registrationId)
      .single()

    if (!registration) {
      return { error: 'Registration not found' }
    }

    // Only allow deleting if status is 'registered' or 'cancelled'
    if (!['registered', 'cancelled'].includes(registration.status)) {
      return { error: 'Can only delete registrations that are not yet confirmed' }
    }

    const { error } = await supabase
      .from('event_registrations')
      .delete()
      .eq('id', registrationId)

    if (error) {
      console.error('Error deleting registration:', error)
      return { error: `Failed to delete registration: ${error.message}` }
    }

    revalidatePath(`/events/${registration.event_id}`)
    return { error: null }
  } catch (error) {
    console.error('Error in deleteRegistration:', error)
    return { error: error instanceof Error ? error.message : 'An error occurred' }
  }
}

/**
 * Final confirmation by superadmin - locks all attended/no_show records for an event
 */
export async function finalizeEventAttendance(input: FinalConfirmationInput) {
  try {
    const supabase = await createClient()

    // Validate input
    const validated = finalConfirmationSchema.parse(input)

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { error: 'Unauthorized' }
    }

    // Verify user is superadmin or coordinator
    const { data: currentUser } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!currentUser || (currentUser.role !== 'superadmin' && currentUser.role !== 'coordinator')) {
      return { error: 'Only superadmins and coordinators can finalize event attendance' }
    }

    // Update all attended and no_show registrations - add finalization metadata but keep original status
    const { data, error } = await supabase
      .from('event_registrations')
      .update({
        final_confirmed_at: new Date().toISOString(),
        final_confirmed_by: user.id,
      })
      .eq('event_id', validated.event_id)
      .in('status', ['attended', 'no_show'])
      .select()

    if (error) {
      console.error('Error finalizing attendance:', error)
      return { error: `Failed to finalize attendance: ${error.message}` }
    }

    // Revalidate the event pages
    revalidatePath(`/events/${validated.event_id}`)
    revalidatePath(`/events/${validated.event_id}/attendance`)
    revalidatePath(`/events/${validated.event_id}/registrations`)

    return {
      data,
      error: null,
      count: data?.length || 0
    }
  } catch (error) {
    console.error('Error in finalizeEventAttendance:', error)
    return { error: error instanceof Error ? error.message : 'An error occurred' }
  }
}
