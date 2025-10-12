import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Clock, CheckCircle, Archive } from 'lucide-react'

interface TransferStatsProps {
  pendingCount: number
  totalTransfers: number
  historyCount: number
}

export function TransferStats({ pendingCount, totalTransfers, historyCount }: TransferStatsProps) {
  const approvedCount = totalTransfers - pendingCount

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
          <Clock className="h-4 w-4 text-orange-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{pendingCount}</div>
          <p className="text-xs text-muted-foreground">
            Awaiting approval
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Approved Transfers</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{approvedCount}</div>
          <p className="text-xs text-muted-foreground">
            Successfully processed
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total History</CardTitle>
          <Archive className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{historyCount}</div>
          <p className="text-xs text-muted-foreground">
            All time transfers
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
