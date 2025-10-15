import { createClient } from '@/lib/supabase/server'
import type { FilterVisitorsInput } from '@/lib/validations/visitor'

/**
 * Get a single visitor by ID with related data
 */
export async function getVisitorById(visitorId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('visitors')
    .select(`
      *,
      associated_church:associated_church_id (
        id,
        name,
        district,
        field
      ),
      accompanied_by_member:accompanied_by_member_id (
        id,
        full_name
      ),
      accompanied_by_visitor:accompanied_by_visitor_id (
        id,
        full_name
      ),
      assigned_to:assigned_to_user_id (
        id,
        email
      )
    `)
    .eq('id', visitorId)
    .single()

  if (error) {
    console.error('Error fetching visitor:', error)
    throw new Error(`Failed to fetch visitor: ${error.message}`)
  }

  return data
}

/**
 * Get all visitors with optional filters and pagination
 */
export async function getVisitors(filters?: FilterVisitorsInput) {
  const supabase = await createClient()
  const limit = filters?.limit || 20
  const offset = filters?.offset || 0

  // Build query
  let query = supabase
    .from('visitors')
    .select(`
      *,
      associated_church:associated_church_id (
        id,
        name,
        district,
        field
      )
    `, { count: 'exact' })

  // Apply filters
  if (filters?.church_id) {
    query = query.eq('associated_church_id', filters.church_id)
  }

  if (filters?.visitor_type) {
    query = query.eq('visitor_type', filters.visitor_type)
  }

  if (filters?.is_baptized !== undefined) {
    query = query.eq('is_baptized', filters.is_baptized)
  }

  if (filters?.follow_up_status) {
    query = query.eq('follow_up_status', filters.follow_up_status)
  }

  if (filters?.referral_source) {
    query = query.eq('referral_source', filters.referral_source)
  }

  if (filters?.search) {
    query = query.ilike('full_name', `%${filters.search}%`)
  }

  // Apply pagination and ordering
  query = query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  const { data, error, count } = await query

  if (error) {
    console.error('Error fetching visitors:', error)
    throw new Error(`Failed to fetch visitors: ${error.message}`)
  }

  return {
    data: data || [],
    count: count || 0,
  }
}

/**
 * Get visitors by associated church
 */
export async function getVisitorsByChurch(churchId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('visitors')
    .select(`
      *,
      associated_church:associated_church_id (
        id,
        name,
        district,
        field
      )
    `)
    .eq('associated_church_id', churchId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching visitors by church:', error)
    throw new Error(`Failed to fetch visitors: ${error.message}`)
  }

  return data || []
}

/**
 * Get visitors pending follow-up for a church
 */
export async function getVisitorsPendingFollowUp(churchId?: string) {
  const supabase = await createClient()

  let query = supabase
    .from('visitors')
    .select(`
      *,
      associated_church:associated_church_id (
        id,
        name,
        district,
        field
      ),
      assigned_to:assigned_to_user_id (
        id,
        email
      )
    `)
    .in('follow_up_status', ['pending', 'contacted'])

  if (churchId) {
    query = query.eq('associated_church_id', churchId)
  }

  query = query.order('created_at', { ascending: true })

  const { data, error } = await query

  if (error) {
    console.error('Error fetching visitors pending follow-up:', error)
    throw new Error(`Failed to fetch visitors: ${error.message}`)
  }

  return data || []
}

/**
 * Get children visitors accompanied by a specific member or visitor
 */
export async function getAccompaniedChildren(parentId: string, parentType: 'member' | 'visitor') {
  const supabase = await createClient()

  const column = parentType === 'member' ? 'accompanied_by_member_id' : 'accompanied_by_visitor_id'

  const { data, error } = await supabase
    .from('visitors')
    .select('*')
    .eq(column, parentId)
    .eq('is_accompanied_child', true)
    .order('age', { ascending: true })

  if (error) {
    console.error('Error fetching accompanied children:', error)
    throw new Error(`Failed to fetch accompanied children: ${error.message}`)
  }

  return data || []
}

/**
 * Get visitor statistics for a church
 */
export async function getVisitorStats(churchId?: string) {
  const supabase = await createClient()

  let query = supabase
    .from('visitors')
    .select('visitor_type, is_baptized, follow_up_status')

  if (churchId) {
    query = query.eq('associated_church_id', churchId)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching visitor stats:', error)
    throw new Error(`Failed to fetch visitor stats: ${error.message}`)
  }

  const stats = {
    total: data.length,
    adults: data.filter(v => v.visitor_type === 'adult').length,
    youth: data.filter(v => v.visitor_type === 'youth').length,
    children: data.filter(v => v.visitor_type === 'child').length,
    baptized: data.filter(v => v.is_baptized).length,
    unbaptized: data.filter(v => !v.is_baptized).length,
    pending_followup: data.filter(v => v.follow_up_status === 'pending').length,
    contacted: data.filter(v => v.follow_up_status === 'contacted').length,
    interested: data.filter(v => v.follow_up_status === 'interested').length,
    converted: data.filter(v => v.follow_up_status === 'converted').length,
  }

  return stats
}

/**
 * Check if a visitor name already exists in a church (to prevent duplicates)
 */
export async function checkVisitorExists(fullName: string, churchId?: string) {
  const supabase = await createClient()

  let query = supabase
    .from('visitors')
    .select('id, full_name, phone')
    .ilike('full_name', fullName)

  if (churchId) {
    query = query.eq('associated_church_id', churchId)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error checking visitor existence:', error)
    return null
  }

  return data && data.length > 0 ? data[0] : null
}

/**
 * Get all visitors for a specific event (registered visitors)
 */
export async function getVisitorsForEvent(eventId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('event_registrations')
    .select(`
      *,
      visitors:visitor_id (
        id,
        full_name,
        phone,
        email,
        visitor_type,
        is_baptized,
        associated_church:associated_church_id (
          id,
          name,
          district,
          field
        )
      )
    `)
    .eq('event_id', eventId)
    .not('visitor_id', 'is', null)
    .order('registered_at', { ascending: false })

  if (error) {
    console.error('Error fetching visitors for event:', error)
    throw new Error(`Failed to fetch visitors for event: ${error.message}`)
  }

  return data || []
}

/**
 * Get available visitors for event registration (not already registered)
 * This is useful for bulk registration dialogs
 */
export async function getAvailableVisitorsForEvent(eventId: string, churchId?: string) {
  const supabase = await createClient()

  // Get all visitors (filtered by church if admin)
  let visitorsQuery = supabase
    .from('visitors')
    .select(`
      id,
      full_name,
      phone,
      visitor_type,
      associated_church:associated_church_id (
        id,
        name,
        district,
        field
      )
    `)

  if (churchId) {
    visitorsQuery = visitorsQuery.eq('associated_church_id', churchId)
  }

  const { data: allVisitors, error: visitorsError } = await visitorsQuery

  if (visitorsError) {
    console.error('Error fetching visitors:', visitorsError)
    throw new Error(`Failed to fetch visitors: ${visitorsError.message}`)
  }

  // Get already registered visitors for this event
  const { data: registeredVisitors, error: regError } = await supabase
    .from('event_registrations')
    .select('visitor_id')
    .eq('event_id', eventId)
    .not('visitor_id', 'is', null)
    .in('status', ['registered', 'attended', 'confirmed'])

  if (regError) {
    console.error('Error fetching registered visitors:', regError)
    throw new Error(`Failed to fetch registered visitors: ${regError.message}`)
  }

  const registeredVisitorIds = new Set(
    registeredVisitors?.map(r => r.visitor_id).filter(Boolean) || []
  )

  // Filter out already registered visitors
  const availableVisitors = allVisitors
    ?.filter(v => !registeredVisitorIds.has(v.id))
    .map(v => ({
      id: v.id,
      full_name: v.full_name,
      phone: v.phone,
      visitor_type: v.visitor_type,
      associated_church: Array.isArray(v.associated_church)
        ? v.associated_church[0]
        : v.associated_church,
    })) || []

  return availableVisitors
}
