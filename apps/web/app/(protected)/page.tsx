import { getDashboardStats, getMembershipGrowth, getRecentActivities } from '@/lib/queries/dashboard'
import { StatsCards } from '@/components/dashboard/stats-cards'
import { MembershipGrowthChart } from '@/components/dashboard/membership-growth-chart'
import { RecentActivities } from '@/components/dashboard/recent-activities'

export default async function DashboardPage() {
  // Fetch all data in parallel
  const [stats, growth, activities] = await Promise.all([
    getDashboardStats(),
    getMembershipGrowth(),
    getRecentActivities(10),
  ])

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Overview of your church management system
        </p>
      </div>

      {/* Statistics cards */}
      <StatsCards stats={stats} />

      {/* Charts and activities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Membership growth chart - spans 2 columns */}
        <div className="lg:col-span-2">
          <MembershipGrowthChart data={growth} />
        </div>

        {/* Recent activities */}
        <div>
          <RecentActivities activities={activities} />
        </div>
      </div>
    </div>
  )
}
