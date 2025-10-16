import Link from 'next/link'
import {
  DownloadIcon,
  UsersIcon,
  UserCheckIcon,
  UserXIcon,
  ArrowLeftRightIcon,
  CakeIcon,
  CalendarHeartIcon,
  TrendingUpIcon,
} from 'lucide-react'
import {
  getMemberStatistics,
  getTransferStatistics,
  getUpcomingBirthdays,
  getUpcomingBaptismAnniversaries,
} from '@/lib/queries/reports'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatisticsCard } from '@/components/reports/statistics-card'
import { PageHeader } from '@/components/shared'

interface StatisticsPageProps {
  searchParams: Promise<{
    church_id?: string
  }>
}

export default async function StatisticsPage({ searchParams }: StatisticsPageProps) {
  const params = await searchParams

  // Fetch all statistics
  const [memberStats, transferStats, upcomingBirthdays, upcomingAnniversaries] = await Promise.all([
    getMemberStatistics(params.church_id),
    getTransferStatistics({ church_id: params.church_id }),
    getUpcomingBirthdays({ church_id: params.church_id, months_ahead: 1 }),
    getUpcomingBaptismAnniversaries({ church_id: params.church_id, months_ahead: 1 }),
  ])

  // Calculate percentages
  const activePercentage = memberStats.total > 0
    ? Math.round((memberStats.active / memberStats.total) * 100)
    : 0
  const baptizedPercentage = memberStats.total > 0
    ? Math.round((memberStats.baptized / memberStats.total) * 100)
    : 0
  const malePercentage = memberStats.total > 0
    ? Math.round((memberStats.male / memberStats.total) * 100)
    : 0
  const femalePercentage = memberStats.total > 0
    ? Math.round((memberStats.female / memberStats.total) * 100)
    : 0

  return (
    <div className="space-y-6">
      <PageHeader
        backHref="/reports"
        title="Statistics Dashboard"
        description="Comprehensive overview of your church metrics"
        actions={
          <Button variant="outline">
            <DownloadIcon className="mr-2 h-4 w-4" />
            Export Dashboard
          </Button>
        }
      />

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
      <div>
        <h2 className="text-xl font-semibold mb-4">Demographics</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Gender Distribution</CardTitle>
              <CardDescription>Member breakdown by gender</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-blue-600" />
                  <span className="text-sm">Male</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{memberStats.male}</span>
                  <span className="text-sm text-gray-500">({malePercentage}%)</span>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${malePercentage}%` }}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-pink-600" />
                  <span className="text-sm">Female</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{memberStats.female}</span>
                  <span className="text-sm text-gray-500">({femalePercentage}%)</span>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-pink-600 h-2 rounded-full"
                  style={{ width: `${femalePercentage}%` }}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Spiritual Condition</CardTitle>
              <CardDescription>Active vs. Inactive members</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-green-600" />
                  <span className="text-sm">Active</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{memberStats.active}</span>
                  <span className="text-sm text-gray-500">({activePercentage}%)</span>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full"
                  style={{ width: `${activePercentage}%` }}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-gray-600" />
                  <span className="text-sm">Inactive</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{memberStats.inactive}</span>
                  <span className="text-sm text-gray-500">({100 - activePercentage}%)</span>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gray-600 h-2 rounded-full"
                  style={{ width: `${100 - activePercentage}%` }}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Transfer Statistics */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Transfer Activity</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <StatisticsCard
            title="Transfers In"
            value={transferStats.transfersIn.toLocaleString()}
            icon={TrendingUpIcon}
            description="Members received"
          />
          <StatisticsCard
            title="Transfers Out"
            value={transferStats.transfersOut.toLocaleString()}
            icon={ArrowLeftRightIcon}
            description="Members sent"
          />
          <StatisticsCard
            title="Net Change"
            value={
              transferStats.transfersIn - transferStats.transfersOut >= 0
                ? `+${transferStats.transfersIn - transferStats.transfersOut}`
                : `${transferStats.transfersIn - transferStats.transfersOut}`
            }
            icon={ArrowLeftRightIcon}
            description="Overall transfer balance"
          />
          <StatisticsCard
            title="Pending"
            value={transferStats.pending.toLocaleString()}
            icon={ArrowLeftRightIcon}
            description="Awaiting approval"
          />
          <StatisticsCard
            title="Approved"
            value={transferStats.approved.toLocaleString()}
            icon={ArrowLeftRightIcon}
            description="Completed transfers"
          />
        </div>
      </div>

      {/* Upcoming Events */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Upcoming Events (Next 30 Days)</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CakeIcon className="h-5 w-5 text-pink-600" />
                Birthdays
              </CardTitle>
              <CardDescription>Members with birthdays this month</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl ">{upcomingBirthdays.length}</div>
              <Button asChild variant="link" className="px-0 mt-2">
                <Link href="/reports/birthdays">View all birthdays →</Link>
              </Button>
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
            <CardContent>
              <div className="text-3xl ">{upcomingAnniversaries.length}</div>
              <Button asChild variant="link" className="px-0 mt-2">
                <Link href="/reports/baptism-anniversaries">View all anniversaries →</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
