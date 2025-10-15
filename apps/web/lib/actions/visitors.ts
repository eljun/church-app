'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
  createVisitorSchema,
  updateVisitorSchema,
  registerVisitorForEventSchema,
  createAndRegisterVisitorSchema,
  updateFollowUpStatusSchema,
  type CreateVisitorInput,
  type UpdateVisitorInput,
  type RegisterVisitorForEventInput,
  type CreateAndRegisterVisitorInput,
  type UpdateFollowUpStatusInput,
} from '@/lib/validations/visitor'

/**
 * Create a new visitor
 */
export async function createVisitor(input: CreateVisitorInput) {
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
    const validatedData = createVisitorSchema.parse(input)

    // Insert visitor
    const { data, error } = await supabase
      .from('visitors')
      .insert([validatedData])
      .select()
      .single()

    if (error) {
      console.error('Error creating visitor:', error)
      return { error: `Failed to create visitor: ${error.message}` }
    }

    revalidatePath('/visitors')
    return { data }
  } catch (error) {
    console.error('Error in createVisitor:', error)
    if (error instanceof Error) {
      return { error: error.message }
    }
    return { error: 'Failed to create visitor' }
  }
}

/**
 * Update an existing visitor
 */
export async function updateVisitor(input: UpdateVisitorInput) {
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
    const validatedData = updateVisitorSchema.parse(input)
    const { id, ...updateData } = validatedData

    // Update visitor
    const { data, error } = await supabase
      .from('visitors')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating visitor:', error)
      return { error: `Failed to update visitor: ${error.message}` }
    }

    revalidatePath('/visitors')
    revalidatePath(`/visitors/${id}`)
    return { data }
  } catch (error) {
    console.error('Error in updateVisitor:', error)
    if (error instanceof Error) {
      return { error: error.message }
    }
    return { error: 'Failed to update visitor' }
  }
}

/**
 * Delete a visitor
 */
export async function deleteVisitor(visitorId: string) {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return { error: 'Unauthorized' }
    }

    // Delete visitor
    const { error } = await supabase
      .from('visitors')
      .delete()
      .eq('id', visitorId)

    if (error) {
      console.error('Error deleting visitor:', error)
      return { error: `Failed to delete visitor: ${error.message}` }
    }

    revalidatePath('/visitors')
    return { success: true }
  } catch (error) {
    console.error('Error in deleteVisitor:', error)
    if (error instanceof Error) {
      return { error: error.message }
    }
    return { error: 'Failed to delete visitor' }
  }
}

/**
 * Register an existing visitor for an event
 */
export async function registerVisitorForEvent(input: RegisterVisitorForEventInput) {
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
    const validatedData = registerVisitorForEventSchema.parse(input)

    // Check if already registered
    const { data: existing } = await supabase
      .from('event_registrations')
      .select('id')
      .eq('event_id', validatedData.event_id)
      .eq('visitor_id', validatedData.visitor_id)
      .in('status', ['registered', 'attended', 'confirmed'])
      .maybeSingle()

    if (existing) {
      return { error: 'This visitor is already registered for this event' }
    }

    // Register visitor for event
    const { data, error } = await supabase
      .from('event_registrations')
      .insert([
        {
          event_id: validatedData.event_id,
          visitor_id: validatedData.visitor_id,
          member_id: null,
          registered_by: user.id,
          notes: validatedData.notes,
          status: 'registered',
        },
      ])
      .select()
      .single()

    if (error) {
      console.error('Error registering visitor for event:', error)
      return { error: `Failed to register visitor: ${error.message}` }
    }

    revalidatePath(`/events/${validatedData.event_id}/registrations`)
    return { data }
  } catch (error) {
    console.error('Error in registerVisitorForEvent:', error)
    if (error instanceof Error) {
      return { error: error.message }
    }
    return { error: 'Failed to register visitor for event' }
  }
}

/**
 * Create a new visitor and register them for an event in one action
 */
export async function createAndRegisterVisitor(input: CreateAndRegisterVisitorInput) {
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
    const validatedData = createAndRegisterVisitorSchema.parse(input)

    // Step 1: Create visitor
    const { data: visitor, error: visitorError } = await supabase
      .from('visitors')
      .insert([validatedData.visitor])
      .select()
      .single()

    if (visitorError) {
      console.error('Error creating visitor:', visitorError)
      return { error: `Failed to create visitor: ${visitorError.message}` }
    }

    // Step 2: Register visitor for event
    const { data: registration, error: regError } = await supabase
      .from('event_registrations')
      .insert([
        {
          event_id: validatedData.event_id,
          visitor_id: visitor.id,
          member_id: null,
          registered_by: user.id,
          notes: validatedData.notes,
          status: 'registered',
        },
      ])
      .select()
      .single()

    if (regError) {
      console.error('Error registering visitor for event:', regError)
      // Visitor was created but registration failed
      return {
        error: `Visitor created but failed to register for event: ${regError.message}`,
        visitor,
      }
    }

    revalidatePath(`/events/${validatedData.event_id}/registrations`)
    revalidatePath('/visitors')
    return { data: { visitor, registration } }
  } catch (error) {
    console.error('Error in createAndRegisterVisitor:', error)
    if (error instanceof Error) {
      return { error: error.message }
    }
    return { error: 'Failed to create and register visitor' }
  }
}

/**
 * Bulk register multiple visitors for an event
 */
export async function registerVisitorsForEventBulk(input: {
  event_id: string
  visitor_ids: string[]
  notes?: string
}) {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return { error: 'Unauthorized' }
    }

    if (input.visitor_ids.length === 0) {
      return { error: 'No visitors selected' }
    }

    // Check for already registered visitors
    const { data: existing } = await supabase
      .from('event_registrations')
      .select('visitor_id')
      .eq('event_id', input.event_id)
      .in('visitor_id', input.visitor_ids)
      .in('status', ['registered', 'attended', 'confirmed'])

    const existingVisitorIds = new Set(existing?.map(r => r.visitor_id) || [])
    const visitorsToRegister = input.visitor_ids.filter(id => !existingVisitorIds.has(id))

    if (visitorsToRegister.length === 0) {
      return { error: 'All selected visitors are already registered' }
    }

    // Create registration records
    const registrations = visitorsToRegister.map(visitor_id => ({
      event_id: input.event_id,
      visitor_id,
      member_id: null,
      registered_by: user.id,
      notes: input.notes || null,
      status: 'registered' as const,
    }))

    const { data, error } = await supabase
      .from('event_registrations')
      .insert(registrations)
      .select()

    if (error) {
      console.error('Error bulk registering visitors:', error)
      return { error: `Failed to register visitors: ${error.message}` }
    }

    revalidatePath(`/events/${input.event_id}/registrations`)
    return {
      registered: data.length,
      skipped: existingVisitorIds.size,
      data,
    }
  } catch (error) {
    console.error('Error in registerVisitorsForEventBulk:', error)
    if (error instanceof Error) {
      return { error: error.message }
    }
    return { error: 'Failed to register visitors for event' }
  }
}

/**
 * Update follow-up status for a visitor
 */
export async function updateFollowUpStatus(input: UpdateFollowUpStatusInput) {
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
    const validatedData = updateFollowUpStatusSchema.parse(input)

    // Update visitor follow-up status
    const { data, error } = await supabase
      .from('visitors')
      .update({
        follow_up_status: validatedData.follow_up_status,
        follow_up_notes: validatedData.follow_up_notes,
        assigned_to_user_id: validatedData.assigned_to_user_id,
      })
      .eq('id', validatedData.visitor_id)
      .select()
      .single()

    if (error) {
      console.error('Error updating follow-up status:', error)
      return { error: `Failed to update follow-up status: ${error.message}` }
    }

    revalidatePath('/visitors')
    revalidatePath(`/visitors/${validatedData.visitor_id}`)
    return { data }
  } catch (error) {
    console.error('Error in updateFollowUpStatus:', error)
    if (error instanceof Error) {
      return { error: error.message }
    }
    return { error: 'Failed to update follow-up status' }
  }
}

/**
 * Convert a visitor to a member
 * This creates a new member record and updates the visitor's follow-up status to 'converted'
 */
export async function convertVisitorToMember(input: {
  visitor_id: string
  church_id: string
  baptism_date?: string
  baptized_by?: string
}) {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return { error: 'Unauthorized' }
    }

    // Get user role and church
    const { data: userData } = await supabase
      .from('users')
      .select('role, church_id')
      .eq('id', user.id)
      .single()

    if (!userData) {
      return { error: 'User not found' }
    }

    // Only admin and superadmin can convert visitors
    if (userData.role !== 'admin' && userData.role !== 'superadmin') {
      return { error: 'You do not have permission to convert visitors to members' }
    }

    // Get visitor data
    const { data: visitor, error: visitorError } = await supabase
      .from('visitors')
      .select('*')
      .eq('id', input.visitor_id)
      .single()

    if (visitorError || !visitor) {
      return { error: 'Visitor not found' }
    }

    // For admins, verify the visitor is associated with their church
    if (userData.role === 'admin') {
      if (visitor.associated_church_id !== userData.church_id) {
        return { error: 'You can only convert visitors associated with your church' }
      }
      // Verify the church_id matches their church
      if (input.church_id !== userData.church_id) {
        return { error: 'You can only add members to your own church' }
      }
    }

    // Validate required fields for member conversion
    if (!visitor.birthday) {
      return { error: 'Visitor must have a birthday before conversion. Please update the visitor record first.' }
    }

    if (!visitor.gender) {
      return { error: 'Visitor must have a gender before conversion. Please update the visitor record first.' }
    }

    // Calculate age from birthday if not provided
    let age = visitor.age || 0
    if (visitor.birthday && (!visitor.age || visitor.age === 0)) {
      const birthDate = new Date(visitor.birthday)
      const today = new Date()
      age = today.getFullYear() - birthDate.getFullYear()
      const monthDiff = today.getMonth() - birthDate.getMonth()
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--
      }
    }

    // Create member record
    const { data: member, error: memberError } = await supabase
      .from('members')
      .insert([
        {
          church_id: input.church_id,
          sp: null, // SP (Spiritual Plan) field - to be filled later
          full_name: visitor.full_name,
          birthday: visitor.birthday,
          age: age,
          date_of_baptism: input.baptism_date || visitor.date_of_baptism || null,
          baptized_by: input.baptized_by || visitor.baptized_at_church || null,
          physical_condition: 'fit',
          spiritual_condition: 'active',
          status: 'active',
          gender: visitor.gender,
        },
      ])
      .select()
      .single()

    if (memberError) {
      console.error('Error creating member:', memberError)
      return { error: `Failed to create member: ${memberError.message}` }
    }

    // Update visitor status to converted
    const { error: updateError } = await supabase
      .from('visitors')
      .update({
        follow_up_status: 'converted',
        follow_up_notes: `Converted to member on ${new Date().toISOString()}`,
      })
      .eq('id', input.visitor_id)

    if (updateError) {
      console.error('Error updating visitor status:', updateError)
      // Member was created but visitor status update failed - not critical
    }

    revalidatePath('/members')
    revalidatePath('/visitors')
    revalidatePath(`/visitors/${input.visitor_id}`)
    return { data: member }
  } catch (error) {
    console.error('Error in convertVisitorToMember:', error)
    if (error instanceof Error) {
      return { error: error.message }
    }
    return { error: 'Failed to convert visitor to member' }
  }
}
