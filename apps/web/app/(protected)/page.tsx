import { redirect } from 'next/navigation'
import {
  UsersIcon,
  UserCheckIcon,
  UserXIcon,
  CalendarHeartIcon,
  CakeIcon,
  AlertCircle,
} from 'lucide-react'
import {
  getMemberStatistics,
  getMemberGrowthData,
  getUpcomingBirthdays,
  getUpcomingBaptismAnniversaries,
  getAgeDistribution,
} from '@/lib/queries/reports'
import { getAbsentMembers } from '@/lib/queries/attendance'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { StatisticsCard } from '@/components/reports/statistics-card'
import { LineChart } from '@/components/shared'
import { AgeDistributionChart } from '@/components/reports/age-distribution-chart'
import { createClient } from '@/lib/supabase/server'
import { getPastorAccessibleChurches } from '@/lib/utils/pastor-helpers'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function DashboardPage() {
  const supabase = await createClient()

  // Get user info for filtering
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: userData } = await supabase
    .from('users')
    .select('role, church_id, field_id, district_id')
    .eq('id', user.id)
    .single()

  // Bibleworkers don't have access to dashboard (middleware should handle this, but double-check)
  if (userData?.role === 'bibleworker') {
    redirect('/events')
  }

  // Get pastor's accessible churches
  const pastorChurchIds = userData?.role === 'pastor' && user
    ? await getPastorAccessibleChurches(user.id)
    : null

  // Fetch all data in parallel
  const [memberStats, growthData, upcomingBirthdays, upcomingAnniversaries, ageDistribution, absentMembers, churches] =
    await Promise.all([
      getMemberStatistics(
        userData?.role === 'church_secretary' ? userData.church_id : undefined,
        pastorChurchIds || undefined
      ),
      getMemberGrowthData({
        church_id: userData?.role === 'church_secretary' ? userData.church_id : undefined,
        church_ids: pastorChurchIds || undefined,
      }),
      getUpcomingBirthdays({
        church_id: userData?.role === 'church_secretary' ? userData.church_id : undefined,
        church_ids: pastorChurchIds || undefined,
        months_ahead: 1,
      }),
      getUpcomingBaptismAnniversaries({
        church_id: userData?.role === 'church_secretary' ? userData.church_id : undefined,
        church_ids: pastorChurchIds || undefined,
        months_ahead: 1,
      }),
      getAgeDistribution(
        userData?.role === 'church_secretary' ? userData.church_id : undefined,
        pastorChurchIds || undefined
      ),
      getAbsentMembers(
        userData?.role === 'church_secretary' ? userData.church_id : undefined,
        30,
        pastorChurchIds || undefined
      ),
      // Get church/field breakdown
      (async () => {
        let query = supabase
          .from('members')
          .select('church_id, churches(name, field)')
          .eq('status', 'active')

        // Apply pastor filtering
        if (userData?.role === 'church_secretary' && userData.church_id) {
          query = query.eq('church_id', userData.church_id)
        } else if (pastorChurchIds && pastorChurchIds.length > 0) {
          query = query.in('church_id', pastorChurchIds)
        }

        const { data } = await query

        // Group by church and field
        const churchCounts = new Map<string, { name: string; field: string; count: number }>()
        data?.forEach((member) => {
          const churches = member.churches as { name: string; field: string } | { name: string; field: string }[] | null
          const churchData = Array.isArray(churches) ? churches[0] : churches
          const churchName = churchData?.name || 'Unknown'
          const field = churchData?.field || 'Unknown'
          const key = `${field}:${churchName}`

          if (churchCounts.has(key)) {
            churchCounts.get(key)!.count++
          } else {
            churchCounts.set(key, { name: churchName, field, count: 1 })
          }
        })

        // Group by field
        const fieldCounts = new Map<string, { churches: string[]; count: number }>()
        Array.from(churchCounts.values()).forEach(({ name, field, count }) => {
          if (fieldCounts.has(field)) {
            fieldCounts.get(field)!.count += count
            fieldCounts.get(field)!.churches.push(`${name} (${count})`)
          } else {
            fieldCounts.set(field, { churches: [`${name} (${count})`], count })
          }
        })

        return { churchCounts, fieldCounts }
      })(),
    ])

  // Calculate percentages
  const activePercentage =
    memberStats.total > 0 ? Math.round((memberStats.active / memberStats.total) * 100) : 0
  const baptizedPercentage =
    memberStats.total > 0 ? Math.round((memberStats.baptized / memberStats.total) * 100) : 0
  const malePercentage =
    memberStats.total > 0 ? Math.round((memberStats.male / memberStats.total) * 100) : 0
  const femalePercentage =
    memberStats.total > 0 ? Math.round((memberStats.female / memberStats.total) * 100) : 0

  // Process growth data for chart (yearly aggregation for dashboard overview)
  const processGrowthData = (data: Array<{ date_of_baptism: string }>) => {
    if (data.length === 0) return []

    const grouped = new Map<string, number>()
    data.forEach((member) => {
      const date = new Date(member.date_of_baptism)
      const key = `${date.getFullYear()}` // Yearly grouping for dashboard
      grouped.set(key, (grouped.get(key) || 0) + 1)
    })

    const sorted = Array.from(grouped.entries()).sort((a, b) => a[0].localeCompare(b[0]))
    let cumulative = 0

    return sorted.map(([date, count]) => {
      cumulative += count
      return { date, count, cumulative }
    })
  }

  const chartData = processGrowthData(growthData)

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="font-display text-3xl  text-primary">Dashboard</h1>
        <p className="mt-1 text-sm text-primary/80">
          Overview of your church management system
        </p>
      </div>

      {/* Member Statistics */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Member Statistics</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatisticsCard
            title="Total Members"
            value={memberStats.total.toLocaleString()}
            icon={UsersIcon}
            description="All active members"
          />
          <StatisticsCard
            title="Active Spiritually"
            value={memberStats.active.toLocaleString()}
            icon={UserCheckIcon}
            description={`${activePercentage}% of total members`}
          />
          <StatisticsCard
            title="Inactive Spiritually"
            value={memberStats.inactive.toLocaleString()}
            icon={UserXIcon}
            description={`${100 - activePercentage}% of total members`}
          />
          <StatisticsCard
            title="Baptized Members"
            value={memberStats.baptized.toLocaleString()}
            icon={CalendarHeartIcon}
            description={`${baptizedPercentage}% of total members`}
          />
        </div>
      </div>

      {/* Demographics */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Demographics</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {/* Gender Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Gender Distribution</CardTitle>
              <CardDescription>Member breakdown by gender</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-primary" />
                  <span className="text-sm">Male</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{memberStats.male}</span>
                  <span className="text-sm text-gray-500">({malePercentage}%)</span>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="h-2 rounded-full bg-primary"
                  style={{ width: `${malePercentage}%` }}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-accent" />
                  <span className="text-sm">Female</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{memberStats.female}</span>
                  <span className="text-sm text-gray-500">({femalePercentage}%)</span>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="h-2 rounded-full bg-accent"
                  style={{ width: `${femalePercentage}%` }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Spiritual Condition */}
          <Card>
            <CardHeader>
              <CardTitle>Spiritual Condition</CardTitle>
              <CardDescription>Active vs. Inactive members</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-primary" />
                  <span className="text-sm">Active</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{memberStats.active}</span>
                  <span className="text-sm text-gray-500">({activePercentage}%)</span>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="h-2 rounded-full bg-primary"
                  style={{ width: `${activePercentage}%` }}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-inactive" />
                  <span className="text-sm">Inactive</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{memberStats.inactive}</span>
                  <span className="text-sm text-gray-500">({100 - activePercentage}%)</span>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="h-2 rounded-full bg-inactive"
                  style={{ width: `${100 - activePercentage}%` }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Church by Field */}
          <Card>
            <CardHeader>
              <CardTitle>Church by Field</CardTitle>
              <CardDescription>Members grouped by field</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 max-h-[200px] overflow-y-auto">
              {Array.from(churches.fieldCounts.entries())
                .sort((a, b) => b[1].count - a[1].count)
                .map(([field, { count }]) => (
                  <div key={field} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{field}</span>
                      <span className="text-sm text-gray-500">{count}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className="h-1.5 rounded-full bg-primary"
                        style={{
                          width: `${memberStats.total > 0 ? (count / memberStats.total) * 100 : 0}%`
                        }}
                      />
                    </div>
                  </div>
                ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Upcoming Events */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Upcoming Events (Next 30 Days)</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CakeIcon className="h-5 w-5 text-pink-600" />
                Birthdays
              </CardTitle>
              <CardDescription>Members with birthdays this month</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {upcomingBirthdays.length > 0 ? (
                <>
                  <div className="space-y-2">
                    {upcomingBirthdays.slice(0, 5).map((member) => (
                      <div key={member.id} className="flex items-center justify-between text-sm py-1 border-b last:border-0">
                        <Link href={`/members/${member.id}`} className="font-medium hover:text-primary hover:underline">
                          {member.full_name}
                        </Link>
                        <span className="text-muted-foreground">
                          {new Date(member.birthday!).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    ))}
                  </div>
                  <Button asChild variant="link" className="px-0 w-full justify-start">
                    <Link href="/reports/birthdays">
                      View all {upcomingBirthdays.length} birthdays →
                    </Link>
                  </Button>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">No upcoming birthdays</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarHeartIcon className="h-5 w-5 text-green-600" />
                Baptism Anniversaries
              </CardTitle>
              <CardDescription>Anniversaries this month</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {upcomingAnniversaries.length > 0 ? (
                <>
                  <div className="space-y-2">
                    {upcomingAnniversaries.slice(0, 5).map((member) => (
                      <div key={member.id} className="flex items-center justify-between text-sm py-1 border-b last:border-0">
                        <Link href={`/members/${member.id}`} className="font-medium hover:text-primary hover:underline">
                          {member.full_name}
                        </Link>
                        <span className="text-muted-foreground">
                          {member.years_since_baptism} {member.years_since_baptism === 1 ? 'year' : 'years'}
                        </span>
                      </div>
                    ))}
                  </div>
                  <Button asChild variant="link" className="px-0 w-full justify-start">
                    <Link href="/reports/baptism-anniversaries">
                      View all {upcomingAnniversaries.length} anniversaries →
                    </Link>
                  </Button>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">No upcoming anniversaries</p>
              )}
            </CardContent>
          </Card>

          {/* Members Needing Follow-up */}
          <Card className="border-orange-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-600">
                <AlertCircle className="h-5 w-5" />
                Members Needing Follow-up
              </CardTitle>
              <CardDescription>Haven&apos;t attended in 30+ days</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {absentMembers.length > 0 ? (
                <>
                  <div className="space-y-2">
                    {absentMembers.slice(0, 10).map((member) => (
                      <div key={member.id} className="flex items-center justify-between text-sm py-1 border-b last:border-0">
                        <Link href={`/members/${member.id}`} className="font-medium hover:text-primary hover:underline">
                          {member.full_name}
                        </Link>
                        <span className="text-xs text-orange-600">
                          Absent
                        </span>
                      </div>
                    ))}
                  </div>
                  <Button asChild variant="link" className="px-0 w-full justify-start text-orange-600">
                    <Link href="/reports/attendance">
                      View all {absentMembers.length} members →
                    </Link>
                  </Button>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">No absent members</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Age Distribution */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Age Distribution</h2>
        <Card>
          <CardHeader>
            <CardTitle>Member Age Groups</CardTitle>
            <CardDescription>
              Breakdown by age categories: Children (&lt;12), Youth (12-34), Adults (35-65), Seniors (66+)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AgeDistributionChart data={ageDistribution} />
          </CardContent>
        </Card>
      </div>

      {/* Baptism Growth Trend */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Baptism Growth Trend</h2>
        <Card>
          <CardHeader>
            <CardTitle>Yearly Baptism Growth</CardTitle>
            <CardDescription>Annual baptisms and cumulative total based on baptism dates (Overview)</CardDescription>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <LineChart
                data={chartData}
                lines={[
                  {
                    dataKey: 'count',
                    name: 'New Baptisms',
                    color: '#2B4C7E',
                  },
                  {
                    dataKey: 'cumulative',
                    name: 'Cumulative Baptisms',
                    color: '#87B984',
                  },
                ]}
              />
            ) : (
              <div className="flex h-[300px] flex-col items-center justify-center text-gray-500 space-y-2">
                <p className="text-lg font-medium">No baptism data available</p>
                <p className="text-sm text-center max-w-md">
                  No baptisms recorded in the last 5 years. Members without baptism dates are not included in this chart.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
