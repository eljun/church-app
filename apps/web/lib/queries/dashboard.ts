/**
 * Dashboard Queries
 * Functions to fetch dashboard statistics
 */

import { createClient } from '@/lib/supabase/server'

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
    .select('role, church_id')
    .eq('id', user.id)
    .single()

  if (!userData) throw new Error('User not found')

  // Build query based on role
  const isSuperadmin = userData.role === 'superadmin'
  const churchFilter = isSuperadmin ? {} : { church_id: userData.church_id }

  // Total members
  const { count: totalMembers } = await supabase
    .from('members')
    .select('*', { count: 'exact', head: true })
    .match(churchFilter)

  // Active members
  const { count: activeMembers } = await supabase
    .from('members')
    .select('*', { count: 'exact', head: true })
    .match({ ...churchFilter, spiritual_condition: 'active', status: 'active' })

  // Inactive members
  const { count: inactiveMembers } = await supabase
    .from('members')
    .select('*', { count: 'exact', head: true })
    .match({ ...churchFilter, spiritual_condition: 'inactive' })

  // Total churches (superadmin only)
  let totalChurches = 0
  if (isSuperadmin) {
    const { count } = await supabase
      .from('churches')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
    totalChurches = count || 0
  }

  // Pending transfer requests
  const { count: pendingTransfers } = await supabase
    .from('transfer_requests')
    .select('*', { count: 'exact', head: true })
    .match(isSuperadmin ? { status: 'pending' } : { to_church_id: userData.church_id, status: 'pending' })

  // Recent baptisms (last 30 days)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { count: recentBaptisms } = await supabase
    .from('members')
    .select('*', { count: 'exact', head: true })
    .match(churchFilter)
    .gte('date_of_baptism', thirtyDaysAgo.toISOString().split('T')[0])

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
    .select('role, church_id')
    .eq('id', user.id)
    .single()

  if (!userData) throw new Error('User not found')

  const isSuperadmin = userData.role === 'superadmin'
  const churchFilter = isSuperadmin ? {} : { church_id: userData.church_id }

  // Get members with baptism dates from last 12 months
  const oneYearAgo = new Date()
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)

  const { data: members } = await supabase
    .from('members')
    .select('date_of_baptism')
    .match(churchFilter)
    .gte('date_of_baptism', oneYearAgo.toISOString().split('T')[0])
    .order('date_of_baptism', { ascending: true })

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
