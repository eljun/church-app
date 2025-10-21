/**
 * Dashboard Queries
 * Functions to fetch dashboard statistics
 */

import { createClient } from '@/lib/supabase/server'
import { getScopeChurches } from '@/lib/rbac'

/**
 * Get dashboard statistics
 * Automatically cached by Next.js per request
 */
export async function getDashboardStats() {
  const supabase = await createClient()

  // Get user's role and church
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!userData) throw new Error('User not found')

  // Get allowed church IDs based on role
  const allowedChurchIds = await getScopeChurches(user.id, userData.role)

  // Helper to apply scope filter
  const applyScope = <T>(query: T): T => {
    if (allowedChurchIds !== null) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (query as any).in('church_id', allowedChurchIds)
    }
    return query
  }

  // Total members
  const { count: totalMembers } = await applyScope(
    supabase
      .from('members')
      .select('*', { count: 'exact', head: true })
  )

  // Active members
  const { count: activeMembers } = await applyScope(
    supabase
      .from('members')
      .select('*', { count: 'exact', head: true })
      .eq('spiritual_condition', 'active')
      .eq('status', 'active')
  )

  // Inactive members
  const { count: inactiveMembers } = await applyScope(
    supabase
      .from('members')
      .select('*', { count: 'exact', head: true })
      .eq('spiritual_condition', 'inactive')
  )

  // Total churches (only for national scope)
  let totalChurches = 0
  if (allowedChurchIds === null) {
    const { count } = await supabase
      .from('churches')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
    totalChurches = count || 0
  } else {
    // For scoped users, show the count of their allowed churches
    totalChurches = allowedChurchIds.length
  }

  // Pending transfer requests - filter by to_church_id to show incoming transfers
  let pendingTransfersQuery = supabase
    .from('transfer_requests')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending')

  if (allowedChurchIds !== null) {
    pendingTransfersQuery = pendingTransfersQuery.in('to_church_id', allowedChurchIds)
  }

  const { count: pendingTransfers } = await pendingTransfersQuery

  // Recent baptisms (last 30 days)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { count: recentBaptisms } = await applyScope(
    supabase
      .from('members')
      .select('*', { count: 'exact', head: true })
      .gte('date_of_baptism', thirtyDaysAgo.toISOString().split('T')[0])
  )

  return {
    totalMembers: totalMembers || 0,
    activeMembers: activeMembers || 0,
    inactiveMembers: inactiveMembers || 0,
    totalChurches,
    pendingTransfers: pendingTransfers || 0,
    recentBaptisms: recentBaptisms || 0,
  }
}

/**
 * Get membership growth data for charts
 * Last 12 months
 */
export async function getMembershipGrowth() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!userData) throw new Error('User not found')

  // Get allowed church IDs based on role
  const allowedChurchIds = await getScopeChurches(user.id, userData.role)

  // Get members with baptism dates from last 12 months
  const oneYearAgo = new Date()
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)

  let query = supabase
    .from('members')
    .select('date_of_baptism')
    .gte('date_of_baptism', oneYearAgo.toISOString().split('T')[0])
    .order('date_of_baptism', { ascending: true })

  // Apply scope filter (CRITICAL)
  if (allowedChurchIds !== null) {
    query = query.in('church_id', allowedChurchIds)
  }

  const { data: members } = await query

  // Group by month
  const monthlyData = new Map<string, number>()

  members?.forEach(member => {
    if (member.date_of_baptism) {
      const month = member.date_of_baptism.substring(0, 7) // YYYY-MM
      monthlyData.set(month, (monthlyData.get(month) || 0) + 1)
    }
  })

  return Array.from(monthlyData.entries()).map(([month, count]) => ({
    month,
    count,
  }))
}

/**
 * Get recent activities
 */
export async function getRecentActivities(limit = 10) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: userData } = await supabase
    .from('users')
    .select('role, church_id')
    .eq('id', user.id)
    .single()

  if (!userData) throw new Error('User not found')

  // Get recent audit logs with user info
  const { data: activities } = await supabase
    .from('audit_logs')
    .select('*, users(email)')
    .order('created_at', { ascending: false })
    .limit(limit)

  return activities || []
}
