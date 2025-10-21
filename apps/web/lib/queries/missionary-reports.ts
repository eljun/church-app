import { createClient } from '@/lib/supabase/server'
import type { ReportType } from '@church-app/database'
import type { FilterMissionaryReportsInput } from '@/lib/validations/missionary-report'
import { getScopeChurches } from '@/lib/rbac'

/**
 * Get a single missionary report by ID
 */
export async function getMissionaryReportById(reportId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('missionary_reports')
    .select(`
      *,
      churches:church_id (
        id,
        name,
        field,
        district
      ),
      reported_by_user:reported_by (
        id,
        email
      )
    `)
    .eq('id', reportId)
    .single()

  if (error) {
    console.error('Error fetching missionary report:', error)
    throw new Error(`Failed to fetch missionary report: ${error.message}`)
  }

  return data
}

/**
 * Get missionary reports with filters and pagination
 */
export async function getMissionaryReports(filters: FilterMissionaryReportsInput = {}) {
  const supabase = await createClient()
  const {
    church_id,
    church_ids,
    start_date,
    end_date,
    report_type,
    search,
    page = 1,
    limit = 20,
  } = filters

  // Get current user and their allowed churches
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!userData) throw new Error('User not found')

  // Get allowed church IDs based on role
  const allowedChurchIds = await getScopeChurches(user.id, userData.role)

  let query = supabase
    .from('missionary_reports')
    .select(`
      *,
      churches:church_id (
        id,
        name,
        field,
        district
      ),
      reported_by_user:reported_by (
        id,
        email
      )
    `, { count: 'exact' })

  // Apply scope filter (CRITICAL)
  if (allowedChurchIds !== null) {
    query = query.in('church_id', allowedChurchIds)
  }

  // Apply filters
  // Prioritize church_ids array over single church_id
  if (church_ids && church_ids.length > 0) {
    query = query.in('church_id', church_ids)
  } else if (church_id) {
    query = query.eq('church_id', church_id)
  }

  if (start_date) {
    query = query.gte('report_date', start_date)
  }

  if (end_date) {
    query = query.lte('report_date', end_date)
  }

  if (report_type) {
    query = query.eq('report_type', report_type)
  }

  // Search in notes, highlights, and challenges
  if (search) {
    query = query.or(`notes.ilike.%${search}%,highlights.ilike.%${search}%,challenges.ilike.%${search}%`)
  }

  // Pagination
  const from = (page - 1) * limit
  const to = from + limit - 1

  query = query
    .order('report_date', { ascending: false })
    .range(from, to)

  const { data, count, error } = await query

  if (error) {
    console.error('Error fetching missionary reports:', error)
    throw new Error(`Failed to fetch missionary reports: ${error.message}`)
  }

  return {
    data: data || [],
    count: count || 0,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit),
  }
}

/**
 * Check if a report already exists for a church, date, and type
 */
export async function getMissionaryReportByDate(
  churchId: string,
  reportDate: string,
  reportType: ReportType = 'weekly'
) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('missionary_reports')
    .select('*')
    .eq('church_id', churchId)
    .eq('report_date', reportDate)
    .eq('report_type', reportType)
    .maybeSingle()

  if (error) {
    console.error('Error checking existing report:', error)
    throw new Error(`Failed to check existing report: ${error.message}`)
  }

  return data
}

/**
 * Get the most recent report for a church (for "copy last report" feature)
 */
export async function getLastMissionaryReport(
  churchId: string,
  reportType: ReportType = 'weekly'
) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('missionary_reports')
    .select('*')
    .eq('church_id', churchId)
    .eq('report_type', reportType)
    .order('report_date', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('Error fetching last report:', error)
    throw new Error(`Failed to fetch last report: ${error.message}`)
  }

  return data
}

/**
 * Get missionary report statistics for a church or multiple churches
 * If churchId/churchIds is not provided, returns stats for all churches (superadmin view)
 */
export async function getMissionaryReportStats(
  churchId?: string,
  startDate?: string,
  endDate?: string,
  reportType?: ReportType,
  churchIds?: string[]
) {
  const supabase = await createClient()

  let query = supabase
    .from('missionary_reports')
    .select('*')

  // Prioritize churchIds array over single churchId
  if (churchIds && churchIds.length > 0) {
    query = query.in('church_id', churchIds)
  } else if (churchId) {
    query = query.eq('church_id', churchId)
  }

  if (startDate) {
    query = query.gte('report_date', startDate)
  }

  if (endDate) {
    query = query.lte('report_date', endDate)
  }

  if (reportType) {
    query = query.eq('report_type', reportType)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching report stats:', error)
    throw new Error(`Failed to fetch report stats: ${error.message}`)
  }

  if (!data || data.length === 0) {
    return {
      totalReports: 0,
      totalBibleStudies: 0,
      totalHomeVisits: 0,
      totalSeminars: 0,
      totalConferences: 0,
      totalPublicLectures: 0,
      totalPamphlets: 0,
      totalBooks: 0,
      totalMagazines: 0,
      totalYouthAnchor: 0,
      averages: {
        bibleStudies: 0,
        homeVisits: 0,
        seminars: 0,
        conferences: 0,
        publicLectures: 0,
        pamphlets: 0,
        books: 0,
        magazines: 0,
        youthAnchor: 0,
      },
    }
  }

  // Calculate totals
  const totalReports = data.length
  const totalBibleStudies = data.reduce((sum, r) => sum + r.bible_studies_given, 0)
  const totalHomeVisits = data.reduce((sum, r) => sum + r.home_visits, 0)
  const totalSeminars = data.reduce((sum, r) => sum + r.seminars_conducted, 0)
  const totalConferences = data.reduce((sum, r) => sum + r.conferences_conducted, 0)
  const totalPublicLectures = data.reduce((sum, r) => sum + r.public_lectures, 0)
  const totalPamphlets = data.reduce((sum, r) => sum + r.pamphlets_distributed, 0)
  const totalBooks = data.reduce((sum, r) => sum + r.books_distributed, 0)
  const totalMagazines = data.reduce((sum, r) => sum + r.magazines_distributed, 0)
  const totalYouthAnchor = data.reduce((sum, r) => sum + r.youth_anchor, 0)

  return {
    totalReports,
    totalBibleStudies,
    totalHomeVisits,
    totalSeminars,
    totalConferences,
    totalPublicLectures,
    totalPamphlets,
    totalBooks,
    totalMagazines,
    totalYouthAnchor,
    averages: {
      bibleStudies: Math.round(totalBibleStudies / totalReports),
      homeVisits: Math.round(totalHomeVisits / totalReports),
      seminars: Math.round(totalSeminars / totalReports),
      conferences: Math.round(totalConferences / totalReports),
      publicLectures: Math.round(totalPublicLectures / totalReports),
      pamphlets: Math.round(totalPamphlets / totalReports),
      books: Math.round(totalBooks / totalReports),
      magazines: Math.round(totalMagazines / totalReports),
      youthAnchor: Math.round(totalYouthAnchor / totalReports),
    },
  }
}

/**
 * Get consolidated missionary report summary for multiple churches
 * Used for district/field/national rollup views
 */
export async function getConsolidatedMissionaryReports(
  churchIds: string[],
  startDate?: string,
  endDate?: string,
  reportType?: ReportType
) {
  const supabase = await createClient()

  let query = supabase
    .from('missionary_reports')
    .select(`
      *,
      churches:church_id (
        id,
        name,
        field,
        district
      )
    `)
    .in('church_id', churchIds)

  if (startDate) {
    query = query.gte('report_date', startDate)
  }

  if (endDate) {
    query = query.lte('report_date', endDate)
  }

  if (reportType) {
    query = query.eq('report_type', reportType)
  }

  query = query.order('report_date', { ascending: false })

  const { data, error } = await query

  if (error) {
    console.error('Error fetching consolidated reports:', error)
    throw new Error(`Failed to fetch consolidated reports: ${error.message}`)
  }

  if (!data || data.length === 0) {
    return {
      totalReports: 0,
      totalChurches: 0,
      aggregatedTotals: {
        bibleStudies: 0,
        homeVisits: 0,
        seminars: 0,
        conferences: 0,
        publicLectures: 0,
        pamphlets: 0,
        books: 0,
        magazines: 0,
        youthAnchor: 0,
      },
      byChurch: [],
      reports: [],
    }
  }

  // Calculate aggregated totals
  const aggregatedTotals = {
    bibleStudies: data.reduce((sum, r) => sum + r.bible_studies_given, 0),
    homeVisits: data.reduce((sum, r) => sum + r.home_visits, 0),
    seminars: data.reduce((sum, r) => sum + r.seminars_conducted, 0),
    conferences: data.reduce((sum, r) => sum + r.conferences_conducted, 0),
    publicLectures: data.reduce((sum, r) => sum + r.public_lectures, 0),
    pamphlets: data.reduce((sum, r) => sum + r.pamphlets_distributed, 0),
    books: data.reduce((sum, r) => sum + r.books_distributed, 0),
    magazines: data.reduce((sum, r) => sum + r.magazines_distributed, 0),
    youthAnchor: data.reduce((sum, r) => sum + r.youth_anchor, 0),
  }

  // Group by church
  const byChurch = churchIds.map((churchId) => {
    const churchReports = data.filter((r) => r.church_id === churchId)
    const church = churchReports[0]?.churches

    if (!churchReports.length) {
      return null
    }

    return {
      church,
      reportCount: churchReports.length,
      totals: {
        bibleStudies: churchReports.reduce((sum, r) => sum + r.bible_studies_given, 0),
        homeVisits: churchReports.reduce((sum, r) => sum + r.home_visits, 0),
        seminars: churchReports.reduce((sum, r) => sum + r.seminars_conducted, 0),
        conferences: churchReports.reduce((sum, r) => sum + r.conferences_conducted, 0),
        publicLectures: churchReports.reduce((sum, r) => sum + r.public_lectures, 0),
        pamphlets: churchReports.reduce((sum, r) => sum + r.pamphlets_distributed, 0),
        books: churchReports.reduce((sum, r) => sum + r.books_distributed, 0),
        magazines: churchReports.reduce((sum, r) => sum + r.magazines_distributed, 0),
        youthAnchor: churchReports.reduce((sum, r) => sum + r.youth_anchor, 0),
      },
    }
  }).filter(Boolean)

  return {
    totalReports: data.length,
    totalChurches: new Set(data.map((r) => r.church_id)).size,
    aggregatedTotals,
    byChurch,
    reports: data,
  }
}

/**
 * Get all churches for a user based on their role
 * Used to determine which churches a user can access for consolidated reports
 */
export async function getAccessibleChurchIds(userId: string) {
  const supabase = await createClient()

  // Get current user's role and assignments
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('role, church_id, district_id, field_id, assigned_church_ids')
    .eq('id', userId)
    .single()

  if (userError || !user) {
    console.error('Error fetching user:', userError)
    throw new Error('Failed to fetch user information')
  }

  // Superadmin and Coordinator: All churches
  if (user.role === 'superadmin' || user.role === 'coordinator') {
    const { data: churches, error: churchesError } = await supabase
      .from('churches')
      .select('id')

    if (churchesError) {
      console.error('Error fetching all churches:', churchesError)
      throw new Error('Failed to fetch churches')
    }

    return churches?.map((c) => c.id) || []
  }

  // Church Secretary: Only their church
  if (user.role === 'church_secretary' && user.church_id) {
    return [user.church_id]
  }

  // Pastor: Churches in their district/field or assigned churches
  if (user.role === 'pastor') {
    const churchIds: string[] = []

    // Add assigned churches
    if (user.assigned_church_ids && user.assigned_church_ids.length > 0) {
      churchIds.push(...user.assigned_church_ids)
    }

    // Add churches from district/field
    if (user.district_id || user.field_id) {
      let query = supabase.from('churches').select('id')

      if (user.district_id) {
        query = query.eq('district', user.district_id)
      } else if (user.field_id) {
        query = query.eq('field', user.field_id)
      }

      const { data: churches, error: churchesError } = await query

      if (!churchesError && churches) {
        churchIds.push(...churches.map((c) => c.id))
      }
    }

    // Remove duplicates
    return [...new Set(churchIds)]
  }

  // Bibleworker: Only their assigned churches
  if (user.role === 'bibleworker') {
    if (user.assigned_church_ids && user.assigned_church_ids.length > 0) {
      return user.assigned_church_ids
    }
    return []
  }

  // Default: No access
  return []
}
