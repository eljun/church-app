import { createClient } from '@/lib/supabase/server'
import type { ActivityType, Visitor } from '@church-app/database'

/**
 * Get all activities for a specific visitor
 */
export async function getVisitorActivities(visitorId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('visitor_activities')
    .select(`
      *,
      user:user_id (
        id,
        email
      )
    `)
    .eq('visitor_id', visitorId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching visitor activities:', error)
    throw new Error(`Failed to fetch activities: ${error.message}`)
  }

  return data || []
}

/**
 * Get upcoming scheduled activities (not yet completed)
 */
export async function getUpcomingFollowUps(userId?: string, churchId?: string) {
  const supabase = await createClient()

  let query = supabase
    .from('visitor_activities')
    .select(`
      *,
      visitor:visitor_id (
        id,
        full_name,
        phone,
        associated_church_id
      ),
      user:user_id (
        id,
        email
      )
    `)
    .eq('is_completed', false)
    .not('scheduled_date', 'is', null)
    .order('scheduled_date', { ascending: true })

  // Filter by assigned user if provided
  if (userId) {
    query = query.eq('user_id', userId)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching upcoming follow-ups:', error)
    throw new Error(`Failed to fetch follow-ups: ${error.message}`)
  }

  // If churchId is provided, filter visitors by church
  if (churchId && data) {
    return data.filter(activity => {
      const visitor = activity.visitor as Visitor | null
      return visitor?.associated_church_id === churchId
    })
  }

  return data || []
}

/**
 * Get completed activities for reporting
 */
export async function getCompletedActivities(
  startDate?: string,
  endDate?: string,
  activityType?: ActivityType
) {
  const supabase = await createClient()

  let query = supabase
    .from('visitor_activities')
    .select(`
      *,
      visitor:visitor_id (
        id,
        full_name,
        associated_church:associated_church_id (
          id,
          name
        )
      ),
      user:user_id (
        id,
        email
      )
    `)
    .eq('is_completed', true)
    .not('completed_date', 'is', null)

  if (startDate) {
    query = query.gte('completed_date', startDate)
  }

  if (endDate) {
    query = query.lte('completed_date', endDate)
  }

  if (activityType) {
    query = query.eq('activity_type', activityType)
  }

  query = query.order('completed_date', { ascending: false })

  const { data, error} = await query

  if (error) {
    console.error('Error fetching completed activities:', error)
    throw new Error(`Failed to fetch activities: ${error.message}`)
  }

  return data || []
}

/**
 * Get activity statistics for a user or church
 */
export async function getActivityStats(userId?: string, churchId?: string) {
  const supabase = await createClient()

  let query = supabase
    .from('visitor_activities')
    .select(`
      *,
      visitor:visitor_id (
        associated_church_id
      )
    `)

  if (userId) {
    query = query.eq('user_id', userId)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching activity stats:', error)
    throw new Error(`Failed to fetch stats: ${error.message}`)
  }

  let activities = data || []

  // Filter by church if provided
  if (churchId && activities) {
    activities = activities.filter(activity => {
      const visitor = activity.visitor as Visitor | null
      return visitor?.associated_church_id === churchId
    })
  }

  // Calculate stats
  const total = activities.length
  const completed = activities.filter(a => a.is_completed).length
  const pending = total - completed
  const upcoming = activities.filter(
    a => !a.is_completed && a.scheduled_date !== null
  ).length

  // Count by activity type
  const byType: Record<ActivityType, number> = {
    phone_call: 0,
    home_visit: 0,
    bible_study: 0,
    follow_up_email: 0,
    text_message: 0,
    scheduled_visit: 0,
    other: 0,
  }

  activities.forEach(activity => {
    if (activity.activity_type in byType) {
      byType[activity.activity_type as ActivityType]++
    }
  })

  return {
    total,
    completed,
    pending,
    upcoming,
    byType,
  }
}

/**
 * Get recent activities across all visitors (for dashboard)
 */
export async function getRecentActivities(limit = 10, churchId?: string) {
  const supabase = await createClient()

  const query = supabase
    .from('visitor_activities')
    .select(`
      *,
      visitor:visitor_id (
        id,
        full_name,
        associated_church_id,
        associated_church:associated_church_id (
          id,
          name
        )
      ),
      user:user_id (
        id,
        email
      )
    `)
    .order('created_at', { ascending: false })
    .limit(limit)

  const { data, error } = await query

  if (error) {
    console.error('Error fetching recent activities:', error)
    throw new Error(`Failed to fetch activities: ${error.message}`)
  }

  // Filter by church if provided
  if (churchId && data) {
    return data.filter(activity => {
      const visitor = activity.visitor as Visitor | null
      return visitor?.associated_church_id === churchId
    })
  }

  return data || []
}

/**
 * Get overdue follow-ups (scheduled but not completed and past due date)
 */
export async function getOverdueFollowUps(userId?: string, churchId?: string) {
  const supabase = await createClient()

  const now = new Date().toISOString()

  let query = supabase
    .from('visitor_activities')
    .select(`
      *,
      visitor:visitor_id (
        id,
        full_name,
        phone,
        associated_church_id
      ),
      user:user_id (
        id,
        email
      )
    `)
    .eq('is_completed', false)
    .not('scheduled_date', 'is', null)
    .lt('scheduled_date', now)
    .order('scheduled_date', { ascending: true })

  if (userId) {
    query = query.eq('user_id', userId)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching overdue follow-ups:', error)
    throw new Error(`Failed to fetch follow-ups: ${error.message}`)
  }

  // Filter by church if provided
  if (churchId && data) {
    return data.filter(activity => {
      const visitor = activity.visitor as Visitor | null
      return visitor?.associated_church_id === churchId
    })
  }

  return data || []
}

/**
 * Get activity by ID
 */
export async function getActivityById(activityId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('visitor_activities')
    .select(`
      *,
      visitor:visitor_id (
        id,
        full_name,
        phone,
        email
      ),
      user:user_id (
        id,
        email
      )
    `)
    .eq('id', activityId)
    .single()

  if (error) {
    console.error('Error fetching activity:', error)
    throw new Error(`Failed to fetch activity: ${error.message}`)
  }

  return data
}
