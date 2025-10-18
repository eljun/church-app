import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MissionaryReportsTable } from '@/components/missionary-reports/missionary-reports-table'
import { MissionaryReportStatsCards } from '@/components/missionary-reports/missionary-report-stats-cards'
import { getMissionaryReports, getMissionaryReportStats } from '@/lib/queries/missionary-reports'

interface PageProps {
  searchParams: Promise<{
    page?: string
    church_id?: string
    start_date?: string
    end_date?: string
    report_type?: 'weekly' | 'biennial' | 'triennial'
  }>
}

export default async function MissionaryReportsPage({ searchParams }: PageProps) {
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

  // Await searchParams
  const params = await searchParams
  const currentPage = parseInt(params.page || '1')

  // Build filters based on user role
  const filters: {
    page: number
    limit: number
    church_id?: string
    church_ids?: string[]
    start_date?: string
    end_date?: string
    report_type?: 'weekly' | 'biennial' | 'triennial'
  } = {
    page: currentPage,
    limit: 20,
  }

  // Admin: Filter to their church only
  if (userData.role === 'admin' && userData.church_id) {
    filters.church_id = userData.church_id
  }

  // Bibleworker: Filter to their assigned churches
  if (userData.role === 'bibleworker' && userData.assigned_church_ids && userData.assigned_church_ids.length > 0) {
    filters.church_ids = userData.assigned_church_ids
  }

  // Apply URL filters (but don't override role-based church filters for admin/bibleworker)
  if (params.church_id && userData.role !== 'admin' && userData.role !== 'bibleworker') {
    filters.church_id = params.church_id
  }
  if (params.start_date) filters.start_date = params.start_date
  if (params.end_date) filters.end_date = params.end_date
  if (params.report_type) filters.report_type = params.report_type

  // Fetch reports
  const { data: reports, count, totalPages } = await getMissionaryReports(filters)

  // Fetch statistics
  const stats = await getMissionaryReportStats(
    filters.church_id,
    params.start_date,
    params.end_date,
    params.report_type,
    filters.church_ids
  )

  // Bibleworkers can create reports (no longer read-only)
  const isBibleworker = userData.role === 'bibleworker'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Missionary Reports</h1>
          <p className="text-muted-foreground mt-1">
            {isBibleworker ? 'Track missionary activities for your assigned churches' : 'Track and manage missionary activities for your church'}
          </p>
        </div>
        <Link href="/missionary-reports/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Report
          </Button>
        </Link>
      </div>

      {/* Statistics Cards */}
      <MissionaryReportStatsCards stats={stats} />

      {/* Reports Table */}
      <MissionaryReportsTable
        reports={reports}
        userRole={userData.role}
        userId={user.id}
        currentPage={currentPage}
        totalPages={totalPages}
        totalCount={count}
      />
    </div>
  )
}
