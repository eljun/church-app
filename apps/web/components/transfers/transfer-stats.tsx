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
          <span className="rounded-sm p-2 bg-accent/20 border border-accent/30"><Clock className="h-6 w-6 text-primary" /></span>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-display text-primary">{pendingCount}</div>
          <p className="text-xs text-muted-foreground">
            Awaiting approval
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Approved Transfers</CardTitle>
          <span className="rounded-sm p-2 bg-accent/20 border border-accent/30"><CheckCircle className="h-6 w-6 text-primary" /></span>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-display text-primary">{approvedCount}</div>
          <p className="text-xs text-muted-foreground">
            Successfully processed
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total History</CardTitle>
          <span className="rounded-sm p-2 bg-accent/20 border border-accent/30"><Archive className="h-6 w-6 text-primary" /></span>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-display text-primary">{historyCount}</div>
          <p className="text-xs text-muted-foreground">
            All time transfers
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
