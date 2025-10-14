import { Clock, CheckCircle, Archive } from 'lucide-react'
import { StatisticsCard } from '@/components/reports/statistics-card'
interface TransferStatsProps {
  pendingCount: number
  totalTransfers: number
  historyCount: number
}

export function TransferStats({ pendingCount, totalTransfers, historyCount }: TransferStatsProps) {
  const approvedCount = totalTransfers - pendingCount

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <StatisticsCard
        title="Total Members"
        value={pendingCount}
        icon={Clock}
        description="Awaiting approval"
      />
      <StatisticsCard
        title="Approved Transfers"
        value={approvedCount}
        icon={CheckCircle}
        description="Successfully processed"
      />       
      <StatisticsCard
        title="Total History"
        value={historyCount}
        icon={Archive}
        description="All time transfers"
      />  
    </div>
  )
}
