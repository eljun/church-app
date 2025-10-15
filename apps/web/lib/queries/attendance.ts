import { createClient } from '@/lib/supabase/server'
import type { ServiceType } from '@church-app/database'

/**
 * Get attendance records for a specific date and church
 */
export async function getAttendanceByDate(
  churchId: string,
  attendanceDate: string,
  serviceType?: ServiceType
) {
  const supabase = await createClient()

  let query = supabase
    .from('attendance')
    .select(`
      *,
      members:member_id (
        id,
        full_name,
        sp,
        age
      ),
      visitors:visitor_id (
        id,
        full_name,
        phone,
        visitor_type
      ),
      recorded_by_user:recorded_by (
        id,
        email
      )
    `)
    .eq('church_id', churchId)
    .eq('attendance_date', attendanceDate)
    .is('event_id', null) // Only weekly service attendance, not event attendance

  if (serviceType) {
    query = query.eq('service_type', serviceType)
  }

  query = query.order('created_at', { ascending: false })

  const { data, error } = await query

  if (error) {
    console.error('Error fetching attendance by date:', error)
    throw new Error(`Failed to fetch attendance: ${error.message}`)
  }

  return data || []
}

/**
 * Get attendance records for a church within a date range
 */
export async function getAttendanceByChurch(
  churchId: string,
  startDate?: string,
  endDate?: string,
  serviceType?: ServiceType
) {
  const supabase = await createClient()

  let query = supabase
    .from('attendance')
    .select(`
      *,
      members:member_id (
        id,
        full_name
      ),
      visitors:visitor_id (
        id,
        full_name
      )
    `)
    .eq('church_id', churchId)
    .is('event_id', null)

  if (startDate) {
    query = query.gte('attendance_date', startDate)
  }

  if (endDate) {
    query = query.lte('attendance_date', endDate)
  }

  if (serviceType) {
    query = query.eq('service_type', serviceType)
  }

  query = query.order('attendance_date', { ascending: false })

  const { data, error } = await query

  if (error) {
    console.error('Error fetching attendance by church:', error)
    throw new Error(`Failed to fetch attendance: ${error.message}`)
  }

  return data || []
}

/**
 * Get attendance statistics for a church
 */
export async function getAttendanceStats(
  churchId: string,
  startDate?: string,
  endDate?: string
) {
  const supabase = await createClient()

  let query = supabase
    .from('attendance')
    .select('*', { count: 'exact' })
    .eq('church_id', churchId)
    .is('event_id', null)
    .eq('attended', true)

  if (startDate) {
    query = query.gte('attendance_date', startDate)
  }

  if (endDate) {
    query = query.lte('attendance_date', endDate)
  }

  const { data, count, error } = await query

  if (error) {
    console.error('Error fetching attendance stats:', error)
    throw new Error(`Failed to fetch attendance stats: ${error.message}`)
  }

  // Calculate stats
  const totalAttendance = count || 0
  const memberCount = data?.filter(a => a.member_id !== null).length || 0
  const visitorCount = data?.filter(a => a.visitor_id !== null).length || 0

  // Get unique dates to calculate average
  const uniqueDates = new Set(data?.map(a => a.attendance_date) || [])
  const totalServices = uniqueDates.size
  const averageAttendance = totalServices > 0 ? Math.round(totalAttendance / totalServices) : 0

  return {
    totalAttendance,
    memberCount,
    visitorCount,
    totalServices,
    averageAttendance,
  }
}

/**
 * Get member attendance history
 */
export async function getMemberAttendanceHistory(
  memberId: string,
  limit = 20
) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('attendance')
    .select(`
      *,
      churches:church_id (
        id,
        name
      )
    `)
    .eq('member_id', memberId)
    .is('event_id', null)
    .order('attendance_date', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching member attendance history:', error)
    throw new Error(`Failed to fetch attendance history: ${error.message}`)
  }

  return data || []
}

/**
 * Get visitor attendance history
 */
export async function getVisitorAttendanceHistory(
  visitorId: string,
  limit = 20
) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('attendance')
    .select(`
      *,
      churches:church_id (
        id,
        name
      )
    `)
    .eq('visitor_id', visitorId)
    .order('attendance_date', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching visitor attendance history:', error)
    throw new Error(`Failed to fetch attendance history: ${error.message}`)
  }

  return data || []
}

/**
 * Check if attendance already exists for a member/visitor on a specific date and service
 */
export async function checkAttendanceExists(
  churchId: string,
  attendanceDate: string,
  serviceType: ServiceType,
  memberId?: string,
  visitorId?: string
) {
  const supabase = await createClient()

  let query = supabase
    .from('attendance')
    .select('id')
    .eq('church_id', churchId)
    .eq('attendance_date', attendanceDate)
    .eq('service_type', serviceType)
    .is('event_id', null)

  if (memberId) {
    query = query.eq('member_id', memberId)
  } else if (visitorId) {
    query = query.eq('visitor_id', visitorId)
  }

  const { data, error } = await query.maybeSingle()

  if (error) {
    console.error('Error checking attendance exists:', error)
    throw new Error(`Failed to check attendance: ${error.message}`)
  }

  return data !== null
}

/**
 * Get attendance summary by service type for a date range
 */
export async function getAttendanceSummaryByService(
  churchId: string,
  startDate: string,
  endDate: string
) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('attendance')
    .select('service_type, attended')
    .eq('church_id', churchId)
    .is('event_id', null)
    .gte('attendance_date', startDate)
    .lte('attendance_date', endDate)

  if (error) {
    console.error('Error fetching attendance summary:', error)
    throw new Error(`Failed to fetch attendance summary: ${error.message}`)
  }

  // Group by service type
  const summary = {
    sabbath_morning: 0,
    sabbath_afternoon: 0,
    prayer_meeting: 0,
    other: 0,
  }

  data?.forEach(record => {
    if (record.attended && record.service_type in summary) {
      summary[record.service_type as keyof typeof summary]++
    }
  })

  return summary
}

/**
 * Get members who haven't attended in the last N days
 */
export async function getAbsentMembers(
  churchId: string,
  daysSinceLastAttendance = 30
) {
  const supabase = await createClient()

  // First, get all active members from the church
  const { data: members, error: membersError } = await supabase
    .from('members')
    .select('id, full_name, sp')
    .eq('church_id', churchId)
    .eq('status', 'active')

  if (membersError) {
    console.error('Error fetching members:', membersError)
    throw new Error(`Failed to fetch members: ${membersError.message}`)
  }

  // Calculate cutoff date
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - daysSinceLastAttendance)
  const cutoffDateStr = cutoffDate.toISOString().split('T')[0]

  // Get members who have attended since cutoff
  const { data: recentAttendance, error: attendanceError } = await supabase
    .from('attendance')
    .select('member_id')
    .eq('church_id', churchId)
    .gte('attendance_date', cutoffDateStr)
    .not('member_id', 'is', null)

  if (attendanceError) {
    console.error('Error fetching recent attendance:', attendanceError)
    throw new Error(`Failed to fetch attendance: ${attendanceError.message}`)
  }

  // Filter members who haven't attended
  const recentMemberIds = new Set(recentAttendance?.map(a => a.member_id) || [])
  const absentMembers = members?.filter(m => !recentMemberIds.has(m.id)) || []

  return absentMembers
}
