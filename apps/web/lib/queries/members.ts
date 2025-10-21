/**
 * Member Queries
 * Functions to fetch member data
 */

import { createClient } from '@/lib/supabase/server'
import type { SearchMembersInput } from '@/lib/validations/member'
import { getScopeChurches } from '@/lib/rbac'

/**
 * Get all members with pagination and filtering
 */
export async function getMembers(params?: SearchMembersInput) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Get user's role and church
  const { data: userData } = await supabase
    .from('users')
    .select('role, church_id')
    .eq('id', user.id)
    .single()

  if (!userData) throw new Error('User not found')

  // Get allowed church IDs based on role
  const allowedChurchIds = await getScopeChurches(user.id, userData.role)

  // Build query
  let query = supabase
    .from('members')
    .select('*, churches(*)', { count: 'exact' })

  // Apply scope filter (CRITICAL)
  if (allowedChurchIds !== null) {
    query = query.in('church_id', allowedChurchIds)
  }

  // Apply filters
  if (params?.query) {
    query = query.ilike('full_name', `%${params.query}%`)
  }

  if (params?.church_id) {
    query = query.eq('church_id', params.church_id)
  }

  if (params?.spiritual_condition) {
    query = query.eq('spiritual_condition', params.spiritual_condition)
  }

  if (params?.status) {
    query = query.eq('status', params.status)
  }

  // Pagination
  const limit = params?.limit || 50
  const offset = params?.offset || 0

  query = query
    .order('full_name', { ascending: true })
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
 * Get a single member by ID
 */
export async function getMemberById(id: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: userData } = await supabase
    .from('users')
    .select('role, church_id')
    .eq('id', user.id)
    .single()

  if (!userData) throw new Error('User not found')

  const { data: member, error } = await supabase
    .from('members')
    .select('*, churches(*)')
    .eq('id', id)
    .single()

  if (error) throw error
  if (!member) throw new Error('Member not found')

  // Check permissions
  if (userData.role === 'church_secretary' && member.church_id !== userData.church_id) {
    throw new Error('Forbidden: Cannot access member from another church')
  }

  return member
}

/**
 * Get member's transfer history
 */
export async function getMemberTransferHistory(memberId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data, error } = await supabase
    .from('transfer_history')
    .select('*')
    .eq('member_id', memberId)
    .order('transfer_date', { ascending: false })

  if (error) throw error

  return data || []
}

/**
 * Get members by church
 */
export async function getMembersByChurch(churchId: string) {
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
  if (userData.role === 'church_secretary' && churchId !== userData.church_id) {
    throw new Error('Forbidden: Cannot access members from another church')
  }

  const { data, error } = await supabase
    .from('members')
    .select('*')
    .eq('church_id', churchId)
    .order('full_name', { ascending: true })

  if (error) throw error

  return data || []
}

/**
 * Get member statistics by church
 */
export async function getMemberStatsByChurch(churchId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const [total, active, inactive] = await Promise.all([
    supabase
      .from('members')
      .select('*', { count: 'exact', head: true })
      .eq('church_id', churchId),
    supabase
      .from('members')
      .select('*', { count: 'exact', head: true })
      .match({ church_id: churchId, spiritual_condition: 'active' }),
    supabase
      .from('members')
      .select('*', { count: 'exact', head: true })
      .match({ church_id: churchId, spiritual_condition: 'inactive' }),
  ])

  return {
    total: total.count || 0,
    active: active.count || 0,
    inactive: inactive.count || 0,
  }
}
