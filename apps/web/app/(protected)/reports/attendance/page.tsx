import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns'
import { createClient } from '@/lib/supabase/server'
import { getChurches } from '@/lib/queries/churches'
import { getAttendanceByChurch, getAttendanceStats, getAttendanceSummaryByService, getAbsentMembers } from '@/lib/queries/attendance'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CalendarDays, Users, TrendingUp, AlertCircle } from 'lucide-react'

export const metadata = {
  title: 'Attendance Reports',
  description: 'View attendance statistics and trends',
}

export default async function AttendanceReportPage() {
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
  const churchesData = await getChurches()
  const churches = churchesData?.data || []

  // For admin, filter to their church only
  const filteredChurches = currentUser.role === 'admin' && currentUser.church_id
    ? churches.filter(c => c.id === currentUser.church_id)
    : churches

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="font-display text-3xl text-primary">Attendance Reports</h1>
        <p className="mt-1 text-sm text-gray-500">
          View attendance statistics and identify trends
        </p>
      </div>

      {/* Reports by church */}
      <div className="space-y-6">
        {filteredChurches.map((church) => (
          <Suspense key={church.id} fallback={<ChurchReportSkeleton />}>
            <ChurchAttendanceReport church={church} />
          </Suspense>
        ))}

        {filteredChurches.length === 0 && (
          <Card>
            <CardContent className="py-8">
              <p className="text-center text-muted-foreground">
                No churches available for attendance reports
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

async function ChurchAttendanceReport({ church }: { church: { id: string; name: string; district: string; field: string } }) {
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
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-xl">{church.name}</CardTitle>
            <CardDescription>
              {church.district} • {church.field}
            </CardDescription>
          </div>
          <Badge variant="outline">{format(new Date(), 'MMMM yyyy')}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Statistics Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Total Attendance This Month */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-4 w-4" />
              <span className="text-sm font-medium">Total This Month</span>
            </div>
            <p className="text-3xl font-bold">{stats.totalAttendance}</p>
            <p className="text-xs text-muted-foreground">
              {stats.memberCount} members • {stats.visitorCount} visitors
            </p>
          </div>

          {/* Average Attendance */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm font-medium">Average per Service</span>
            </div>
            <p className="text-3xl font-bold">{stats.averageAttendance}</p>
            <p className="text-xs text-muted-foreground">
              Based on {stats.totalServices} services
            </p>
          </div>

          {/* Weekly Average (Last 30 days) */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <CalendarDays className="h-4 w-4" />
              <span className="text-sm font-medium">Weekly Average</span>
            </div>
            <p className="text-3xl font-bold">{weeklyAverage}</p>
            <p className="text-xs text-muted-foreground">
              Last 30 days
            </p>
          </div>

          {/* Absent Members */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <AlertCircle className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium">Absent 30+ Days</span>
            </div>
            <p className="text-3xl font-bold text-orange-500">{absentMembers.length}</p>
            <p className="text-xs text-muted-foreground">
              Members needing follow-up
            </p>
          </div>
        </div>

        {/* Service Type Breakdown */}
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">
            Attendance by Service Type (This Month)
          </h3>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground mb-1">Sabbath Morning</p>
              <p className="text-2xl font-semibold">{serviceBreakdown.sabbath_morning}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground mb-1">Sabbath Afternoon</p>
              <p className="text-2xl font-semibold">{serviceBreakdown.sabbath_afternoon}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground mb-1">Prayer Meeting</p>
              <p className="text-2xl font-semibold">{serviceBreakdown.prayer_meeting}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground mb-1">Other Services</p>
              <p className="text-2xl font-semibold">{serviceBreakdown.other}</p>
            </div>
          </div>
        </div>

        {/* Absent Members List */}
        {absentMembers.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">
              Members Needing Follow-up ({absentMembers.length})
            </h3>
            <div className="rounded-lg border divide-y max-h-64 overflow-y-auto">
              {absentMembers.slice(0, 10).map((member) => (
                <div key={member.id} className="p-3 flex items-center justify-between hover:bg-accent">
                  <div>
                    <p className="text-sm font-medium">{member.full_name}</p>
                    {member.sp && (
                      <p className="text-xs text-muted-foreground">SP: {member.sp}</p>
                    )}
                  </div>
                  <Badge variant="outline" className="text-orange-500 border-orange-200">
                    Absent 30+ days
                  </Badge>
                </div>
              ))}
              {absentMembers.length > 10 && (
                <div className="p-3 text-center text-sm text-muted-foreground">
                  + {absentMembers.length - 10} more members
                </div>
              )}
            </div>
          </div>
        )}

        {/* No data message */}
        {stats.totalAttendance === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p>No attendance records for this month</p>
            <p className="text-sm mt-1">Start recording attendance to see reports</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function ChurchReportSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="animate-pulse space-y-2">
          <div className="h-6 w-48 bg-gray-200 rounded" />
          <div className="h-4 w-32 bg-gray-200 rounded" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse space-y-2">
                <div className="h-4 w-24 bg-gray-200 rounded" />
                <div className="h-8 w-16 bg-gray-200 rounded" />
                <div className="h-3 w-32 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
