import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Church } from '@church-app/database'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/shared'
import { getMissionaryReports, getMissionaryReportStats } from '@/lib/queries/missionary-reports'
import { MissionaryActivitiesFilters } from '@/components/reports/missionary-activities-filters'
import { MissionaryActivitiesCharts } from '@/components/reports/missionary-activities-charts'
import { MissionaryActivitiesExportButton } from '@/components/reports/missionary-activities-export-button'

interface PageProps {
  searchParams: Promise<{
    church_id?: string
    start_date?: string
    end_date?: string
    report_type?: 'weekly' | 'biennial' | 'triennial'
    period?: 'week' | 'month' | 'quarter' | 'year' | 'custom'
  }>
}

export default async function MissionaryActivitiesReportPage({ searchParams }: PageProps) {
  const supabase = await createClient()

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get user details with role
  const { data: userData } = await supabase
    .from('users')
    .select('role, church_id, district_id, field_id, assigned_church_ids')
    .eq('id', user.id)
    .single()

  if (!userData) {
    redirect('/login')
  }

  // Get all churches for filters (based on role)
  const { data: churches } = await supabase
    .from('churches')
    .select('id, name, field, district, city, province')
    .order('name')

  // Await searchParams
  const params = await searchParams

  // Calculate date range based on period
  let startDate = params.start_date
  let endDate = params.end_date

  if (params.period && params.period !== 'custom') {
    const today = new Date()
    const year = today.getFullYear()
    const month = today.getMonth()

    switch (params.period) {
      case 'week':
        // Last 7 days
        startDate = new Date(today.setDate(today.getDate() - 7)).toISOString().split('T')[0]
        endDate = new Date().toISOString().split('T')[0]
        break
      case 'month':
        // Current month
        startDate = new Date(year, month, 1).toISOString().split('T')[0]
        endDate = new Date(year, month + 1, 0).toISOString().split('T')[0]
        break
      case 'quarter':
        // Current quarter
        const quarter = Math.floor(month / 3)
        startDate = new Date(year, quarter * 3, 1).toISOString().split('T')[0]
        endDate = new Date(year, (quarter + 1) * 3, 0).toISOString().split('T')[0]
        break
      case 'year':
        // Current year
        startDate = new Date(year, 0, 1).toISOString().split('T')[0]
        endDate = new Date(year, 11, 31).toISOString().split('T')[0]
        break
    }
  }

  // Build filters
  const filters: {
    church_id?: string
    start_date?: string
    end_date?: string
    report_type?: 'weekly' | 'biennial' | 'triennial'
  } = {}

  // Admin: Filter to their church only
  if (userData.role === 'admin' && userData.church_id) {
    filters.church_id = userData.church_id
  }

  // Apply URL filters
  if (params.church_id) filters.church_id = params.church_id
  if (startDate) filters.start_date = startDate
  if (endDate) filters.end_date = endDate
  if (params.report_type) filters.report_type = params.report_type

  // Fetch reports (for export and stats calculation)
  const { data: reports } = await getMissionaryReports(filters)

  // Fetch statistics
  const stats = await getMissionaryReportStats(
    filters.church_id,
    filters.start_date,
    filters.end_date,
    filters.report_type
  )

  return (
    <div className="space-y-6">
      <PageHeader
        backHref="/reports"
        title="Missionary Activities Report"
        description="Analyze missionary work and outreach activities across churches"
        actions={
          <MissionaryActivitiesExportButton
            reports={reports}
            startDate={startDate}
            endDate={endDate}
          />
        }
      />

      {/* Filters */}
      <MissionaryActivitiesFilters
        churches={(churches || []) as Church[]}
        userRole={userData.role}
        userChurchId={userData.church_id}
        currentFilters={{
          church_id: params.church_id,
          start_date: startDate,
          end_date: endDate,
          report_type: params.report_type,
          period: params.period,
        }}
      />

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Reports</CardDescription>
            <CardTitle className="text-3xl">{stats.totalReports}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Bible Studies</CardDescription>
            <CardTitle className="text-3xl">{stats.totalBibleStudies}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Home Visits</CardDescription>
            <CardTitle className="text-3xl">{stats.totalHomeVisits}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Literature Distributed</CardDescription>
            <CardTitle className="text-3xl">
              {stats.totalPamphlets + stats.totalBooks + stats.totalMagazines}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Charts */}
      <MissionaryActivitiesCharts reports={reports} stats={stats} />
    </div>
  )
}
