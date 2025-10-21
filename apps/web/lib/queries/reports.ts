/**
 * Reports Queries
 * Functions to fetch analytics and report data
 */

import { createClient } from '@/lib/supabase/server'
import type { CustomReportFilters, MemberField, MemberReportRow } from '@/lib/types/custom-reports'

/**
 * Get member growth data over time
 */
export async function getMemberGrowthData(params?: {
  church_id?: string
  church_ids?: string[]
  start_date?: string
  end_date?: string
  period?: 'monthly' | 'quarterly' | 'yearly'
}) {
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

  // Build date range - default to last 5 years to capture more baptism data
  const endDate = params?.end_date || new Date().toISOString().split('T')[0]
  const startDate = params?.start_date ||
    new Date(new Date().setFullYear(new Date().getFullYear() - 5)).toISOString().split('T')[0]

  // Build query - using date_of_baptism to track actual baptism growth
  let query = supabase
    .from('members')
    .select('date_of_baptism, church_id, churches(name)')
    .not('date_of_baptism', 'is', null)
    .gte('date_of_baptism', startDate)
    .lte('date_of_baptism', endDate)

  // Role-based filtering
  if (userData.role === 'church_secretary' && userData.church_id) {
    query = query.eq('church_id', userData.church_id)
  } else if (params?.church_ids && params.church_ids.length > 0) {
    query = query.in('church_id', params.church_ids)
  } else if (params?.church_id) {
    query = query.eq('church_id', params.church_id)
  }

  const { data, error } = await query.order('date_of_baptism', { ascending: true })

  if (error) throw error

  return data || []
}

/**
 * Get member statistics summary
 */
export async function getMemberStatistics(churchId?: string, churchIds?: string[]) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: userData } = await supabase
    .from('users')
    .select('role, church_id')
    .eq('id', user.id)
    .single()

  if (!userData) throw new Error('User not found')

  const targetChurchId = userData.role === 'church_secretary'
    ? userData.church_id
    : churchId

  // Build base queries with optional church filtering
  const buildQuery = <T>(baseQuery: T): T => {
    if (targetChurchId) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (baseQuery as any).eq('church_id', targetChurchId)
    } else if (churchIds && churchIds.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (baseQuery as any).in('church_id', churchIds)
    }
    return baseQuery
  }

  // Get counts for different categories
  const [
    totalMembers,
    activeMembers,
    inactiveMembers,
    maleMembers,
    femaleMembers,
    baptizedMembers,
  ] = await Promise.all([
    // Total members
    buildQuery(
      supabase
        .from('members')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')
    ),
    // Active spiritual condition
    buildQuery(
      supabase
        .from('members')
        .select('*', { count: 'exact', head: true })
        .eq('spiritual_condition', 'active')
        .eq('status', 'active')
    ),
    // Inactive spiritual condition
    buildQuery(
      supabase
        .from('members')
        .select('*', { count: 'exact', head: true })
        .eq('spiritual_condition', 'inactive')
        .eq('status', 'active')
    ),
    // Male members
    buildQuery(
      supabase
        .from('members')
        .select('*', { count: 'exact', head: true })
        .eq('gender', 'male')
        .eq('status', 'active')
    ),
    // Female members
    buildQuery(
      supabase
        .from('members')
        .select('*', { count: 'exact', head: true })
        .eq('gender', 'female')
        .eq('status', 'active')
    ),
    // Baptized members
    buildQuery(
      supabase
        .from('members')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')
        .not('date_of_baptism', 'is', null)
    ),
  ])

  return {
    total: totalMembers.count || 0,
    active: activeMembers.count || 0,
    inactive: inactiveMembers.count || 0,
    male: maleMembers.count || 0,
    female: femaleMembers.count || 0,
    baptized: baptizedMembers.count || 0,
  }
}

/**
 * Get transfer statistics
 */
export async function getTransferStatistics(params?: {
  church_id?: string
  start_date?: string
  end_date?: string
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: userData } = await supabase
    .from('users')
    .select('role, church_id')
    .eq('id', user.id)
    .single()

  if (!userData) throw new Error('User not found')

  // Build date range
  const endDate = params?.end_date || new Date().toISOString().split('T')[0]
  const startDate = params?.start_date ||
    new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString().split('T')[0]

  // Build base query
  let fromQuery = supabase
    .from('transfer_requests')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', startDate)
    .lte('created_at', endDate)

  let toQuery = supabase
    .from('transfer_requests')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', startDate)
    .lte('created_at', endDate)

  let pendingQuery = supabase
    .from('transfer_requests')
    .select('*', { count: 'exact', head: true })

  let approvedQuery = supabase
    .from('transfer_requests')
    .select('*', { count: 'exact', head: true })

  let rejectedQuery = supabase
    .from('transfer_requests')
    .select('*', { count: 'exact', head: true })

  // Apply church filtering
  const targetChurchId = userData.role === 'church_secretary'
    ? userData.church_id
    : params?.church_id

  if (targetChurchId) {
    fromQuery = fromQuery.eq('from_church_id', targetChurchId)
    toQuery = toQuery.eq('to_church_id', targetChurchId)
    pendingQuery = pendingQuery.or(`from_church_id.eq.${targetChurchId},to_church_id.eq.${targetChurchId}`)
    approvedQuery = approvedQuery.or(`from_church_id.eq.${targetChurchId},to_church_id.eq.${targetChurchId}`)
    rejectedQuery = rejectedQuery.or(`from_church_id.eq.${targetChurchId},to_church_id.eq.${targetChurchId}`)
  }

  pendingQuery = pendingQuery.eq('status', 'pending')
  approvedQuery = approvedQuery.eq('status', 'approved')
  rejectedQuery = rejectedQuery.eq('status', 'rejected')

  const [transfersOut, transfersIn, pending, approved, rejected] = await Promise.all([
    fromQuery,
    toQuery,
    pendingQuery,
    approvedQuery,
    rejectedQuery,
  ])

  return {
    transfersOut: transfersOut.count || 0,
    transfersIn: transfersIn.count || 0,
    pending: pending.count || 0,
    approved: approved.count || 0,
    rejected: rejected.count || 0,
  }
}

/**
 * Get upcoming baptism anniversaries
 */
export async function getUpcomingBaptismAnniversaries(params?: {
  church_id?: string
  church_ids?: string[]
  months_ahead?: number
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: userData } = await supabase
    .from('users')
    .select('role, church_id')
    .eq('id', user.id)
    .single()

  if (!userData) throw new Error('User not found')

  const monthsAhead = params?.months_ahead || 3
  const today = new Date()
  const futureDate = new Date()
  futureDate.setMonth(futureDate.getMonth() + monthsAhead)

  // Build query
  let query = supabase
    .from('members')
    .select('*, churches(name)')
    .not('date_of_baptism', 'is', null)
    .eq('status', 'active')

  // Role-based filtering
  const targetChurchId = userData.role === 'church_secretary'
    ? userData.church_id
    : params?.church_id

  if (targetChurchId) {
    query = query.eq('church_id', targetChurchId)
  } else if (params?.church_ids && params.church_ids.length > 0) {
    query = query.in('church_id', params.church_ids)
  }

  const { data, error } = await query

  if (error) throw error

  // Filter by anniversary date (month and day only)
  const filtered = (data || []).filter(member => {
    if (!member.date_of_baptism) return false

    const baptismDate = new Date(member.date_of_baptism)
    const thisYearAnniversary = new Date(
      today.getFullYear(),
      baptismDate.getMonth(),
      baptismDate.getDate()
    )

    // If anniversary already passed this year, check next year
    if (thisYearAnniversary < today) {
      thisYearAnniversary.setFullYear(thisYearAnniversary.getFullYear() + 1)
    }

    return thisYearAnniversary <= futureDate
  })

  return filtered.map(member => ({
    ...member,
    years_since_baptism: new Date().getFullYear() - new Date(member.date_of_baptism!).getFullYear(),
  }))
}

/**
 * Get upcoming birthdays
 */
export async function getUpcomingBirthdays(params?: {
  church_id?: string
  church_ids?: string[]
  months_ahead?: number
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: userData } = await supabase
    .from('users')
    .select('role, church_id')
    .eq('id', user.id)
    .single()

  if (!userData) throw new Error('User not found')

  const monthsAhead = params?.months_ahead || 3
  const today = new Date()
  const futureDate = new Date()
  futureDate.setMonth(futureDate.getMonth() + monthsAhead)

  // Build query
  let query = supabase
    .from('members')
    .select('*, churches(name)')
    .not('birthday', 'is', null)
    .eq('status', 'active')

  // Role-based filtering
  const targetChurchId = userData.role === 'church_secretary'
    ? userData.church_id
    : params?.church_id

  if (targetChurchId) {
    query = query.eq('church_id', targetChurchId)
  } else if (params?.church_ids && params.church_ids.length > 0) {
    query = query.in('church_id', params.church_ids)
  }

  const { data, error } = await query

  if (error) throw error

  // Filter by birthday (month and day only)
  const filtered = (data || []).filter(member => {
    if (!member.birthday) return false

    const birthDate = new Date(member.birthday)
    const thisYearBirthday = new Date(
      today.getFullYear(),
      birthDate.getMonth(),
      birthDate.getDate()
    )

    // If birthday already passed this year, check next year
    if (thisYearBirthday < today) {
      thisYearBirthday.setFullYear(thisYearBirthday.getFullYear() + 1)
    }

    return thisYearBirthday <= futureDate
  })

  return filtered.map(member => ({
    ...member,
    age: new Date().getFullYear() - new Date(member.birthday!).getFullYear(),
  }))
}

/**
 * Get transfer history with details
 */
export async function getTransferHistory(params?: {
  church_id?: string
  start_date?: string
  end_date?: string
  status?: 'pending' | 'approved' | 'rejected' | 'cancelled'
  limit?: number
  offset?: number
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: userData } = await supabase
    .from('users')
    .select('role, church_id')
    .eq('id', user.id)
    .single()

  if (!userData) throw new Error('User not found')

  // Build query
  let query = supabase
    .from('transfer_requests')
    .select(`
      *,
      members(*),
      from_church:churches!from_church_id(name),
      to_church:churches!to_church_id(name)
    `, { count: 'exact' })

  // Role-based filtering
  const targetChurchId = userData.role === 'church_secretary'
    ? userData.church_id
    : params?.church_id

  if (targetChurchId) {
    query = query.or(`from_church_id.eq.${targetChurchId},to_church_id.eq.${targetChurchId}`)
  }

  // Apply filters
  if (params?.status) {
    query = query.eq('status', params.status)
  }

  if (params?.start_date) {
    query = query.gte('created_at', params.start_date)
  }

  if (params?.end_date) {
    query = query.lte('created_at', params.end_date)
  }

  // Pagination
  const limit = params?.limit || 50
  const offset = params?.offset || 0

  query = query
    .order('created_at', { ascending: false })
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
 * Generate custom member report with dynamic fields and filters
 */
export async function generateCustomMemberReport(
  fields: MemberField[],
  filters: CustomReportFilters
): Promise<MemberReportRow[]> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: userData } = await supabase
    .from('users')
    .select('role, church_id')
    .eq('id', user.id)
    .single()

  if (!userData) throw new Error('User not found')

  // Build select clause with requested fields
  const selectFields = ['id', ...fields.filter(f => f !== 'church_name')]
  if (fields.includes('church_name')) {
    selectFields.push('churches(name)')
  }

  // Build base query
  let query = supabase
    .from('members')
    .select(selectFields.join(', '))

  // Apply role-based filtering
  const targetChurchId = userData.role === 'church_secretary'
    ? userData.church_id
    : filters.church_id

  if (targetChurchId) {
    query = query.eq('church_id', targetChurchId)
  }

  // Apply status filter
  if (filters.status && filters.status.length > 0) {
    query = query.in('status', filters.status)
  }

  // Apply spiritual condition filter
  if (filters.spiritual_condition && filters.spiritual_condition.length > 0) {
    query = query.in('spiritual_condition', filters.spiritual_condition)
  }

  // Apply physical condition filter
  if (filters.physical_condition && filters.physical_condition.length > 0) {
    query = query.in('physical_condition', filters.physical_condition)
  }

  // Apply gender filter
  if (filters.gender && filters.gender.length > 0) {
    query = query.in('gender', filters.gender)
  }

  // Apply baptism date filter
  if (filters.has_baptism_date !== undefined) {
    if (filters.has_baptism_date) {
      query = query.not('date_of_baptism', 'is', null)
    } else {
      query = query.is('date_of_baptism', null)
    }
  }

  // Apply baptism date range
  if (filters.baptism_date_from) {
    query = query.gte('date_of_baptism', filters.baptism_date_from)
  }
  if (filters.baptism_date_to) {
    query = query.lte('date_of_baptism', filters.baptism_date_to)
  }

  // Apply age range
  if (filters.age_from !== undefined) {
    query = query.gte('age', filters.age_from)
  }
  if (filters.age_to !== undefined) {
    query = query.lte('age', filters.age_to)
  }

  // Apply birthday month filter
  if (filters.birthday_month !== undefined) {
    // This requires extracting month from birthday date
    // For now, we'll fetch all and filter in memory
  }

  const { data, error } = await query.order('full_name', { ascending: true })

  if (error) throw error

  // Transform data to flatten church name
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const transformedData = (data || []).map((member: any): MemberReportRow | null => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const row = { ...member } as any

    if (fields.includes('church_name') && member.churches) {
      row.church_name = member.churches.name
      delete row.churches
    }

    // Apply birthday month filter if specified
    if (filters.birthday_month !== undefined && member.birthday) {
      const birthMonth = new Date(member.birthday).getMonth() + 1
      if (birthMonth !== filters.birthday_month) {
        return null
      }
    }

    return row
  }).filter((row): row is MemberReportRow => row !== null)

  return transformedData
}

/**
 * Get age distribution statistics
 * Categories: Children (<12), Youth (12-34), Adults (35-65), Seniors (66+)
 */
export async function getAgeDistribution(churchId?: string, churchIds?: string[]) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: userData } = await supabase
    .from('users')
    .select('role, church_id')
    .eq('id', user.id)
    .single()

  if (!userData) throw new Error('User not found')

  const targetChurchId = userData.role === 'church_secretary'
    ? userData.church_id
    : churchId

  // Build query
  let query = supabase
    .from('members')
    .select('age')
    .eq('status', 'active')

  if (targetChurchId) {
    query = query.eq('church_id', targetChurchId)
  } else if (churchIds && churchIds.length > 0) {
    query = query.in('church_id', churchIds)
  }

  const { data, error } = await query

  if (error) throw error

  // Categorize ages
  const distribution = {
    children: 0,    // < 12
    youth: 0,       // 12-34
    adults: 0,      // 35-65
    seniors: 0,     // 66+
  }

  data?.forEach(member => {
    const age = member.age
    if (age < 12) {
      distribution.children++
    } else if (age >= 12 && age <= 34) {
      distribution.youth++
    } else if (age >= 35 && age <= 65) {
      distribution.adults++
    } else if (age >= 66) {
      distribution.seniors++
    }
  })

  return distribution
}
