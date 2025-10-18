import { createClient } from '@/lib/supabase/server'
import type { EventRegistration } from '@church-app/database'

// Extended type with joined data (supports both members and visitors)
export interface EventRegistrationWithDetails extends EventRegistration {
  members: {
    id: string
    full_name: string
    church_id: string
    churches: {
      id: string
      name: string
      district: string
      field: string
    }
  } | null
  visitors: {
    id: string
    full_name: string
    phone: string | null
    visitor_type: string
    is_baptized: boolean
    associated_church: {
      id: string
      name: string
      district: string
      field: string
    } | null
  } | null
  registered_by_user: {
    id: string
    email: string
  } | null
  attendance_confirmed_by_user?: {
    id: string
    email: string
  } | null
}

/**
 * Get all registrations for a specific event with pagination
 */
export async function getEventRegistrations(
  eventId: string,
  options?: { limit?: number; offset?: number }
) {
  const supabase = await createClient()
  const limit = options?.limit || 20
  const offset = options?.offset || 0

  // Get total count
  const { count, error: countError } = await supabase
    .from('event_registrations')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', eventId)

  if (countError) {
    console.error('Error counting event registrations:', countError)
    throw new Error(`Failed to count event registrations: ${countError.message}`)
  }

  // Get paginated data (supports both members and visitors)
  const { data, error } = await supabase
    .from('event_registrations')
    .select(`
      *,
      members:member_id (
        id,
        full_name,
        church_id,
        churches:church_id (
          id,
          name,
          district,
          field
        )
      ),
      visitors:visitor_id (
        id,
        full_name,
        phone,
        visitor_type,
        is_baptized,
        associated_church:associated_church_id (
          id,
          name,
          district,
          field
        )
      ),
      registered_by_user:registered_by (
        id,
        email
      ),
      attendance_confirmed_by_user:attendance_confirmed_by (
        id,
        email
      )
    `)
    .eq('event_id', eventId)
    .order('registered_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    console.error('Error fetching event registrations:', error)
    throw new Error(`Failed to fetch event registrations: ${error.message}`)
  }

  return {
    data: (data || []) as EventRegistrationWithDetails[],
    count: count || 0,
  }
}

/**
 * Get registration statistics for an event
 */
export async function getEventRegistrationStats(eventId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('event_registrations')
    .select('status')
    .eq('event_id', eventId)

  if (error) {
    console.error('Error fetching registration stats:', error)
    throw new Error(`Failed to fetch registration stats: ${error.message}`)
  }

  const stats = {
    total: data.length,
    registered: data.filter(r => r.status === 'registered').length,
    attended: data.filter(r => r.status === 'attended').length,
    no_show: data.filter(r => r.status === 'no_show').length,
    confirmed: data.filter(r => r.status === 'confirmed').length,
    cancelled: data.filter(r => r.status === 'cancelled').length,
  }

  return stats
}

/**
 * Get a single registration by ID
 */
export async function getRegistrationById(registrationId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('event_registrations')
    .select(`
      *,
      members:member_id (
        id,
        full_name,
        church_id,
        churches:church_id (
          id,
          name,
          district,
          field
        )
      ),
      visitors:visitor_id (
        id,
        full_name,
        phone,
        visitor_type,
        is_baptized,
        associated_church:associated_church_id (
          id,
          name,
          district,
          field
        )
      ),
      registered_by_user:registered_by (
        id,
        email
      ),
      attendance_confirmed_by_user:attendance_confirmed_by (
        id,
        email
      )
    `)
    .eq('id', registrationId)
    .single()

  if (error) {
    console.error('Error fetching registration:', error)
    throw new Error(`Failed to fetch registration: ${error.message}`)
  }

  return data as EventRegistrationWithDetails
}

/**
 * Check if a member is already registered for an event
 */
export async function isAlreadyRegistered(eventId: string, memberId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('event_registrations')
    .select('id, status')
    .eq('event_id', eventId)
    .eq('member_id', memberId)
    .in('status', ['registered', 'attended', 'confirmed'])
    .maybeSingle()

  if (error) {
    console.error('Error checking registration:', error)
    return false
  }

  return !!data
}

/**
 * Get all members from admin's church who are NOT registered for this event
 * (For the "Add Members" dropdown)
 */
export async function getAvailableMembersForEvent(eventId: string) {
  const supabase = await createClient()

  // Get current user's church_id
  const { data: userData } = await supabase
    .from('users')
    .select('church_id, role')
    .eq('id', (await supabase.auth.getUser()).data.user?.id || '')
    .single()

  if (!userData) {
    throw new Error('User not found')
  }

  // Build query based on role
  let membersQuery = supabase
    .from('members')
    .select(`
      id,
      full_name,
      church_id,
      churches:church_id (
        id,
        name,
        district,
        field
      )
    `)
    .eq('status', 'active')

  // Admins can only see their church members
  if (userData.role === 'admin' && userData.church_id) {
    membersQuery = membersQuery.eq('church_id', userData.church_id)
  }

  const { data: allMembers, error: membersError } = await membersQuery

  if (membersError) {
    console.error('Error fetching members:', membersError)
    throw new Error(`Failed to fetch members: ${membersError.message}`)
  }

  // Get already registered members
  const { data: registeredMembers, error: regError } = await supabase
    .from('event_registrations')
    .select('member_id')
    .eq('event_id', eventId)
    .in('status', ['registered', 'attended', 'confirmed'])

  if (regError) {
    console.error('Error fetching registered members:', regError)
    throw new Error(`Failed to fetch registered members: ${regError.message}`)
  }

  const registeredMemberIds = new Set(registeredMembers?.map(r => r.member_id) || [])

  // Filter out already registered members and fix church data structure
  const availableMembers = allMembers
    ?.filter(m => !registeredMemberIds.has(m.id))
    .map(m => ({
      id: m.id,
      full_name: m.full_name,
      churches: Array.isArray(m.churches) ? m.churches[0] : m.churches,
    })) || []

  return availableMembers
}

/**
 * Get all registrations for attendance confirmation (no pagination)
 */
export async function getAllEventRegistrations(eventId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('event_registrations')
    .select(`
      *,
      members:member_id (
        id,
        full_name,
        church_id,
        churches:church_id (
          id,
          name,
          district,
          field
        )
      ),
      visitors:visitor_id (
        id,
        full_name,
        phone,
        visitor_type,
        is_baptized,
        associated_church:associated_church_id (
          id,
          name,
          district,
          field
        )
      ),
      registered_by_user:registered_by (
        id,
        email
      ),
      attendance_confirmed_by_user:attendance_confirmed_by (
        id,
        email
      )
    `)
    .eq('event_id', eventId)
    .order('registered_at', { ascending: false })

  if (error) {
    console.error('Error fetching event registrations:', error)
    throw new Error(`Failed to fetch event registrations: ${error.message}`)
  }

  return (data || []) as EventRegistrationWithDetails[]
}

/**
 * Get registrations grouped by status for attendance confirmation view
 */
export async function getRegistrationsForAttendance(eventId: string) {
  const registrations = await getAllEventRegistrations(eventId)

  return {
    registered: registrations.filter(r => r.status === 'registered'),
    attended: registrations.filter(r => r.status === 'attended'),
    no_show: registrations.filter(r => r.status === 'no_show'),
  }
}
