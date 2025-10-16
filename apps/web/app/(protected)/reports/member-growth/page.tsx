import { Suspense } from 'react'
import { getMemberGrowthData, getMemberStatistics } from '@/lib/queries/reports'
import { MemberGrowthReport } from '@/components/reports/member-growth-report'
import { PageHeader } from '@/components/shared'

interface MemberGrowthPageProps {
  searchParams: Promise<{
    church_id?: string
    start_date?: string
    end_date?: string
    period?: 'monthly' | 'quarterly' | 'yearly'
  }>
}

export default async function MemberGrowthPage({ searchParams }: MemberGrowthPageProps) {
  const params = await searchParams

  // Fetch growth data and statistics
  const [growthData, stats] = await Promise.all([
    getMemberGrowthData({
      church_id: params.church_id,
      start_date: params.start_date,
      end_date: params.end_date,
      period: params.period || 'monthly',
    }),
    getMemberStatistics(params.church_id),
  ])

  return (
    <div className="space-y-6">
      <PageHeader
        backHref="/reports"
        title="Member Growth Report"
        description="Track membership statistics and baptism growth trends over time"
      />

      {/* Report content */}
      <Suspense fallback={<div className="h-96 animate-pulse bg-gray-100 rounded-lg" />}>
        <MemberGrowthReport initialData={growthData} stats={stats} />
      </Suspense>
    </div>
  )
}
