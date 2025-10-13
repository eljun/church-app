import { Suspense } from 'react'
import Link from 'next/link'
import { ArrowLeftIcon } from 'lucide-react'
import { getMemberGrowthData, getMemberStatistics } from '@/lib/queries/reports'
import { MemberGrowthReport } from '@/components/reports/member-growth-report'
import { Button } from '@/components/ui/button'

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
      {/* Page header */}
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="icon">
          <Link href="/reports">
            <ArrowLeftIcon className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="font-display text-3xl font-bold text-primary">Member Growth Report</h1>
          <p className="mt-1 text-sm text-gray-500">
            Track membership statistics and baptism growth trends over time
          </p>
        </div>
      </div>

      {/* Report content */}
      <Suspense fallback={<div className="h-96 animate-pulse bg-gray-100 rounded-lg" />}>
        <MemberGrowthReport initialData={growthData} stats={stats} />
      </Suspense>
    </div>
  )
}
