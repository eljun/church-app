/**
 * Event Queries
 * Functions to fetch event data
 */

import { createClient } from '@/lib/supabase/server'
import type { SearchEventsInput } from '@/lib/validations/event'

/**
 * Get all events with pagination and filtering
 */
export async function getEvents(params?: SearchEventsInput) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Get user's role and church_id
  const { data: userData } = await supabase
    .from('users')
    .select('role, church_id')
    .eq('id', user.id)
    .single()

  if (!userData) throw new Error('User not found')

  // Get church details if user has a church_id
  let userChurch: { field: string; district: string; country: string } | null = null
  if (userData.church_id) {
    const { data: church } = await supabase
      .from('churches')
      .select('field, district, country')
      .eq('id', userData.church_id)
      .single()

    userChurch = church
  }

  // Build query
  let query = supabase
    .from('events')
    .select('*, churches(*), users!events_created_by_fkey(email)', { count: 'exact' })

  // Scope-based filtering: users see events relevant to their organizational level
  if (userData.role === 'admin' && userData.church_id && userChurch) {
    // Admins see:
    // 1. National events (country-wide)
    // 2. Field events for their field
    // 3. District events for their district (supports comma-separated districts)
    // 4. Church events for their church
    query = query.or(
      `event_scope.eq.national,` +
      `and(event_scope.eq.field,scope_value.eq.${userChurch.field}),` +
      `and(event_scope.eq.district,scope_value.like.%${userChurch.district}%),` +
      `and(event_scope.eq.church,church_id.eq.${userData.church_id})`
    )
  }

  // Apply filters
  if (params?.query) {
    query = query.ilike('title', `%${params.query}%`)
  }

  if (params?.church_id) {
    query = query.eq('church_id', params.church_id)
  }

  if (params?.event_type) {
    query = query.eq('event_type', params.event_type)
  }

  if (params?.is_public !== undefined) {
    query = query.eq('is_public', params.is_public)
  }

  if (params?.start_date) {
    query = query.gte('start_date', params.start_date)
  }

  if (params?.end_date) {
    query = query.lte('start_date', params.end_date)
  }

  // Pagination
  const limit = params?.limit || 50
  const offset = params?.offset || 0

  query = query
    .order('start_date', { ascending: false })
    .range(offset, offset + limit - 1)

  const { data, error, count } = await query

  if (error) throw error

  return {
    data: data || [],
    count: count || 0,
    limit,
    offset,
  }
}

/**
 * Get a single event by ID
 */
export async function getEventById(id: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: userData } = await supabase
    .from('users')
    .select('role, church_id')
    .eq('id', user.id)
    .single()

  if (!userData) throw new Error('User not found')

  // Get church details if user has a church_id
  let userChurch: { field: string; district: string; country: string } | null = null
  if (userData.church_id) {
    const { data: church } = await supabase
      .from('churches')
      .select('field, district, country')
      .eq('id', userData.church_id)
      .single()

    userChurch = church
  }

  const { data: event, error } = await supabase
    .from('events')
    .select('*, churches(*), users!events_created_by_fkey(email)')
    .eq('id', id)
    .single()

  if (error) throw error
  if (!event) throw new Error('Event not found')

  // Check scope-based permissions for admins
  if (userData.role === 'admin' && userData.church_id && userChurch) {
    // Check if user's district is in the comma-separated list
    const districtMatch = event.event_scope === 'district' && event.scope_value
      ? event.scope_value.split(',').includes(userChurch.district)
      : false

    const hasAccess =
      event.event_scope === 'national' ||
      (event.event_scope === 'field' && event.scope_value === userChurch.field) ||
      districtMatch ||
      (event.event_scope === 'church' && event.church_id === userData.church_id)

    if (!hasAccess) {
      throw new Error('Forbidden: Cannot access this event')
    }
  }

  return event
}

/**
 * Get upcoming events
 */
export async function getUpcomingEvents(limit = 10) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: userData } = await supabase
    .from('users')
    .select('role, church_id')
    .eq('id', user.id)
    .single()

  if (!userData) throw new Error('User not found')

  // Get church details if user has a church_id
  let userChurch: { field: string; district: string; country: string } | null = null
  if (userData.church_id) {
    const { data: church } = await supabase
      .from('churches')
      .select('field, district, country')
      .eq('id', userData.church_id)
      .single()

    userChurch = church
  }

  let query = supabase
    .from('events')
    .select('*, churches(*)')
    .gte('start_date', new Date().toISOString())
    .order('start_date', { ascending: true })
    .limit(limit)

  // Scope-based filtering
  if (userData.role === 'admin' && userData.church_id && userChurch) {
    query = query.or(
      `event_scope.eq.national,` +
      `and(event_scope.eq.field,scope_value.eq.${userChurch.field}),` +
      `and(event_scope.eq.district,scope_value.like.%${userChurch.district}%),` +
      `and(event_scope.eq.church,church_id.eq.${userData.church_id})`
    )
  }

  const { data, error } = await query

  if (error) throw error

  return data || []
}

/**
 * Get events by church
 */
export async function getEventsByChurch(churchId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: userData } = await supabase
    .from('users')
    .select('role, church_id')
    .eq('id', user.id)
    .single()

  if (!userData) throw new Error('User not found')

  // Check permissions
  if (userData.role === 'admin' && churchId !== userData.church_id) {
    throw new Error('Forbidden: Cannot access events from another church')
  }

  const { data, error } = await supabase
    .from('events')
    .select('*, churches(*)')
    .eq('church_id', churchId)
    .order('start_date', { ascending: false })

  if (error) throw error

  return data || []
}

/**
 * Get events by date range
 */
export async function getEventsByDateRange(startDate: string, endDate: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: userData } = await supabase
    .from('users')
    .select('role, church_id')
    .eq('id', user.id)
    .single()

  if (!userData) throw new Error('User not found')

  let query = supabase
    .from('events')
    .select('*, churches(*)')
    .gte('start_date', startDate)
    .lte('start_date', endDate)
    .order('start_date', { ascending: true })

  // Role-based filtering
  if (userData.role === 'admin' && userData.church_id) {
    query = query.eq('church_id', userData.church_id)
  }

  const { data, error } = await query

  if (error) throw error

  return data || []
}

/**
 * Get event statistics
 */
export async function getEventStats() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: userData } = await supabase
    .from('users')
    .select('role, church_id')
    .eq('id', user.id)
    .single()

  if (!userData) throw new Error('User not found')

  const now = new Date().toISOString()

  let totalQuery = supabase
    .from('events')
    .select('*', { count: 'exact', head: true })

  let upcomingQuery = supabase
    .from('events')
    .select('*', { count: 'exact', head: true })
    .gte('start_date', now)

  let pastQuery = supabase
    .from('events')
    .select('*', { count: 'exact', head: true })
    .lt('start_date', now)

  // Role-based filtering
  if (userData.role === 'admin' && userData.church_id) {
    totalQuery = totalQuery.eq('church_id', userData.church_id)
    upcomingQuery = upcomingQuery.eq('church_id', userData.church_id)
    pastQuery = pastQuery.eq('church_id', userData.church_id)
  }

  const [total, upcoming, past] = await Promise.all([
    totalQuery,
    upcomingQuery,
    pastQuery,
  ])

  return {
    total: total.count || 0,
    upcoming: upcoming.count || 0,
    past: past.count || 0,
  }
}
