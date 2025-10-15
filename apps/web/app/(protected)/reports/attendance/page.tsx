import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns'
import { createClient } from '@/lib/supabase/server'
import { getChurches } from '@/lib/queries/churches'
import { getAttendanceByChurch, getAttendanceStats, getAttendanceSummaryByService, getAbsentMembers } from '@/lib/queries/attendance'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CalendarDays, Users, TrendingUp, AlertCircle, Building2 } from 'lucide-react'
import { ChurchFilterSelect } from '@/components/reports/church-filter-select'

export const metadata = {
  title: 'Attendance Reports',
  description: 'View attendance statistics and trends',
}

interface AttendanceReportPageProps {
  searchParams: Promise<{ church?: string }>
}

export default async function AttendanceReportPage({ searchParams }: AttendanceReportPageProps) {
  const { church: selectedChurchId } = await searchParams
  const supabase = await createClient()

  // Get current user
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) {
    redirect('/login')
  }

  // Get user details with role
  const { data: currentUser } = await supabase
    .from('users')
    .select('*')
    .eq('id', authUser.id)
    .single()

  if (!currentUser) {
    redirect('/login')
  }

  // Get churches based on role
  const churchesData = await getChurches({ limit: 1000, offset: 0 })
  const allChurches = churchesData?.data || []

  // For admin, filter to their church only
  const availableChurches = currentUser.role === 'admin' && currentUser.church_id
    ? allChurches.filter(c => c.id === currentUser.church_id)
    : allChurches

  // Determine which church to show
  const churchToShow = selectedChurchId
    ? availableChurches.find(c => c.id === selectedChurchId)
    : availableChurches[0]

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-3xl text-primary">Attendance Reports</h1>
          <p className="mt-1 text-sm text-gray-500">
            View attendance statistics and identify trends
          </p>
        </div>

        {/* Church Filter - Only show if not admin or if superadmin/coordinator/pastor */}
        {currentUser.role !== 'admin' && availableChurches.length > 1 && (
          <ChurchFilterSelect
            churches={availableChurches}
            selectedChurchId={churchToShow?.id}
          />
        )}
      </div>

      {/* Overall Statistics */}
      {churchToShow ? (
        <Suspense fallback={<ChurchReportSkeleton />}>
          <ChurchAttendanceReport
            church={churchToShow}
            currentUserRole={currentUser.role}
          />
        </Suspense>
      ) : (
        <Card>
          <CardContent className="py-8">
            <div className="text-center space-y-2">
              <Building2 className="mx-auto h-12 w-12 text-gray-400" />
              <p className="text-muted-foreground">
                No churches available for attendance reports
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

async function ChurchAttendanceReport({
  church,
  currentUserRole
}: {
  church: { id: string; name: string; district: string; field: string }
  currentUserRole: string
}) {
  // Get date range (last 30 days)
  const endDate = format(new Date(), 'yyyy-MM-dd')
  const startDate = format(subDays(new Date(), 30), 'yyyy-MM-dd')

  // Get current month range
  const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd')
  const monthEnd = format(endOfMonth(new Date()), 'yyyy-MM-dd')

  // Fetch data in parallel
  const [stats, serviceBreakdown, absentMembers, recentAttendance] = await Promise.all([
    getAttendanceStats(church.id, monthStart, monthEnd),
    getAttendanceSummaryByService(church.id, monthStart, monthEnd),
    getAbsentMembers(church.id, 30),
    getAttendanceByChurch(church.id, startDate, endDate)
  ])

  // Calculate weekly average (last 4 weeks)
  const weeklyAttendance = new Map<string, number>()
  recentAttendance.forEach(record => {
    if (record.attended) {
      const week = format(new Date(record.attendance_date), 'yyyy-MM-dd')
      weeklyAttendance.set(week, (weeklyAttendance.get(week) || 0) + 1)
    }
  })

  const weeklyAverage = weeklyAttendance.size > 0
    ? Math.round(Array.from(weeklyAttendance.values()).reduce((a, b) => a + b, 0) / weeklyAttendance.size)
    : 0

  return (
    <div className="space-y-6">
      {/* Church Header */}
      <Card className="border-primary/50 bg-primary/5">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Building2 className="h-6 w-6 text-primary" />
                {church.name}
              </CardTitle>
              <CardDescription className="text-base mt-1">
                {church.district} • {church.field}
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-base px-3 py-1">
              {format(new Date(), 'MMMM yyyy')}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Statistics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Attendance This Month */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-5 w-5" />
                <span className="text-sm font-medium">Total This Month</span>
              </div>
              <p className="text-4xl font-bold">{stats.totalAttendance}</p>
              <p className="text-sm text-muted-foreground">
                {stats.memberCount} members • {stats.visitorCount} visitors
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Average Attendance */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <TrendingUp className="h-5 w-5" />
                <span className="text-sm font-medium">Average per Service</span>
              </div>
              <p className="text-4xl font-bold">{stats.averageAttendance}</p>
              <p className="text-sm text-muted-foreground">
                Based on {stats.totalServices} services
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Weekly Average (Last 30 days) */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <CalendarDays className="h-5 w-5" />
                <span className="text-sm font-medium">Weekly Average</span>
              </div>
              <p className="text-4xl font-bold">{weeklyAverage}</p>
              <p className="text-sm text-muted-foreground">
                Last 30 days
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Absent Members */}
        <Card className={absentMembers.length > 0 ? 'border-orange-200 bg-orange-50' : ''}>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <AlertCircle className="h-5 w-5 text-orange-500" />
                <span className="text-sm font-medium">Absent 30+ Days</span>
              </div>
              <p className="text-4xl font-bold text-orange-600">{absentMembers.length}</p>
              <p className="text-sm text-muted-foreground">
                Members needing follow-up
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Service Type Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Attendance by Service Type</CardTitle>
          <CardDescription>This month's breakdown</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border p-4 bg-accent/50">
              <p className="text-sm text-muted-foreground mb-2">Sabbath Morning</p>
              <p className="text-3xl font-semibold">{serviceBreakdown.sabbath_morning}</p>
            </div>
            <div className="rounded-lg border p-4 bg-accent/50">
              <p className="text-sm text-muted-foreground mb-2">Sabbath Afternoon</p>
              <p className="text-3xl font-semibold">{serviceBreakdown.sabbath_afternoon}</p>
            </div>
            <div className="rounded-lg border p-4 bg-accent/50">
              <p className="text-sm text-muted-foreground mb-2">Prayer Meeting</p>
              <p className="text-3xl font-semibold">{serviceBreakdown.prayer_meeting}</p>
            </div>
            <div className="rounded-lg border p-4 bg-accent/50">
              <p className="text-sm text-muted-foreground mb-2">Other Services</p>
              <p className="text-3xl font-semibold">{serviceBreakdown.other}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Absent Members List */}
      {absentMembers.length > 0 && (
        <Card className="border-orange-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-600">
              <AlertCircle className="h-5 w-5" />
              Members Needing Follow-up
            </CardTitle>
            <CardDescription>
              {absentMembers.length} member{absentMembers.length !== 1 ? 's' : ''} haven't attended in 30+ days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border divide-y max-h-96 overflow-y-auto">
              {absentMembers.slice(0, 20).map((member) => (
                <div key={member.id} className="p-4 flex items-center justify-between hover:bg-accent transition-colors">
                  <div>
                    <p className="font-medium">{member.full_name}</p>
                    {member.sp && (
                      <p className="text-sm text-muted-foreground">SP: {member.sp}</p>
                    )}
                  </div>
                  <Badge variant="outline" className="text-orange-600 border-orange-300">
                    Absent 30+ days
                  </Badge>
                </div>
              ))}
              {absentMembers.length > 20 && (
                <div className="p-4 text-center text-sm text-muted-foreground bg-muted">
                  + {absentMembers.length - 20} more members
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No data message */}
      {stats.totalAttendance === 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-2">
              <CalendarDays className="mx-auto h-12 w-12 text-gray-400" />
              <p className="text-lg font-medium text-muted-foreground">No attendance records for this month</p>
              <p className="text-sm text-muted-foreground">Start recording attendance to see reports</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function ChurchReportSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="animate-pulse space-y-2">
            <div className="h-8 w-64 bg-gray-200 rounded" />
            <div className="h-4 w-48 bg-gray-200 rounded" />
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="animate-pulse space-y-2">
                <div className="h-4 w-32 bg-gray-200 rounded" />
                <div className="h-10 w-20 bg-gray-200 rounded" />
                <div className="h-3 w-40 bg-gray-200 rounded" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
