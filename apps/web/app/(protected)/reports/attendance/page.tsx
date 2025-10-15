import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { format, subDays } from 'date-fns'
import { createClient } from '@/lib/supabase/server'
import { getChurches } from '@/lib/queries/churches'
import { getAttendanceByChurch, getAttendanceStats, getAttendanceSummaryByService, getAbsentMembers } from '@/lib/queries/attendance'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, Building2, Users, TrendingUp, CalendarDays, Church } from 'lucide-react'
import { ChurchFilterSelect } from '@/components/reports/church-filter-select'
import { DateFilterSelect, type DateRange } from '@/components/reports/date-filter-select'
import { StatisticsCard } from '@/components/reports/statistics-card'
import { getDateRange } from '@/lib/utils/date-ranges'

export const metadata = {
  title: 'Attendance Reports',
  description: 'View attendance statistics and trends',
}

interface AttendanceReportPageProps {
  searchParams: Promise<{ church?: string; range?: DateRange }>
}

export default async function AttendanceReportPage({ searchParams }: AttendanceReportPageProps) {
  const { church: selectedChurchId, range: selectedRange = 'month' } = await searchParams
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

        {/* Filters */}
        <div className="flex items-end gap-4">
          <DateFilterSelect selectedRange={selectedRange} />
          {/* Church Filter - Only show if not admin or if superadmin/coordinator/pastor */}
          {currentUser.role !== 'admin' && availableChurches.length > 1 && (
            <ChurchFilterSelect
              churches={availableChurches}
              selectedChurchId={churchToShow?.id}
            />
          )}
        </div>
      </div>

      {/* Overall Statistics */}
      {churchToShow ? (
        <Suspense fallback={<ChurchReportSkeleton />}>
          <ChurchAttendanceReport
            church={churchToShow}
            currentUserRole={currentUser.role}
            dateRange={selectedRange}
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
  currentUserRole,
  dateRange,
}: {
  church: { id: string; name: string; district: string; field: string }
  currentUserRole: string
  dateRange: DateRange
}) {
  // Get date range based on selection
  const { startDate, endDate, label: dateLabel, daysCount } = getDateRange(dateRange)

  // Fetch data in parallel
  const [stats, serviceBreakdown, absentMembers, recentAttendance] = await Promise.all([
    getAttendanceStats(church.id, startDate, endDate),
    getAttendanceSummaryByService(church.id, startDate, endDate),
    getAbsentMembers(church.id, 30),
    getAttendanceByChurch(church.id, startDate, endDate)
  ])

  // Calculate weekly average
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
              {dateLabel}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Statistics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatisticsCard
          title={`Total ${dateRange === 'week' ? 'This Week' : dateRange === 'month' ? 'This Month' : dateRange === 'quarter' ? 'This Quarter' : 'This Year'}`}
          value={stats.totalAttendance}
          description={`${stats.memberCount} members • ${stats.visitorCount} visitors`}
          icon={Users}
        />

        <StatisticsCard
          title="Average per Service"
          value={stats.averageAttendance}
          description={`Based on ${stats.totalServices} services`}
          icon={TrendingUp}
        />

        <StatisticsCard
          title={`${dateRange === 'week' ? 'Daily' : 'Weekly'} Average`}
          value={weeklyAverage}
          description={`Last ${daysCount} days`}
          icon={CalendarDays}
        />

        <StatisticsCard
          title="Absent 30+ Days"
          value={absentMembers.length}
          description="Members needing follow-up"
          icon={AlertCircle}
        />
      </div>

      {/* Service Type Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Attendance by Service Type</CardTitle>
          <CardDescription>{dateLabel} breakdown</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatisticsCard
              title="Sabbath Morning"
              value={serviceBreakdown.sabbath_morning}
              icon={Church}
            />
            <StatisticsCard
              title="Sabbath Afternoon"
              value={serviceBreakdown.sabbath_afternoon}
              icon={Church}
            />
            <StatisticsCard
              title="Prayer Meeting"
              value={serviceBreakdown.prayer_meeting}
              icon={Church}
            />
            <StatisticsCard
              title="Other Services"
              value={serviceBreakdown.other}
              icon={Church}
            />
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
            <div className="border divide-y max-h-96 overflow-y-auto">
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
              <p className="text-lg font-medium text-muted-foreground">No attendance records for this period</p>
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
            <div className="h-8 w-64 bg-gray-200" />
            <div className="h-4 w-48 bg-gray-200" />
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="animate-pulse space-y-2">
                <div className="h-4 w-32 bg-gray-200" />
                <div className="h-10 w-20 bg-gray-200" />
                <div className="h-3 w-40 bg-gray-200" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
