import { Suspense } from 'react'
import Link from 'next/link'
import { ArrowLeftIcon, DownloadIcon, ArrowUpIcon, ArrowDownIcon } from 'lucide-react'
import { getTransferStatistics, getTransferHistory } from '@/lib/queries/reports'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface TransfersReportPageProps {
  searchParams: Promise<{
    church_id?: string
    start_date?: string
    end_date?: string
    status?: 'pending' | 'approved' | 'rejected' | 'cancelled'
    page?: string
  }>
}

export default async function TransfersReportPage({ searchParams }: TransfersReportPageProps) {
  const params = await searchParams
  const page = parseInt(params.page || '1')
  const limit = 50
  const offset = (page - 1) * limit

  // Fetch statistics
  const stats = await getTransferStatistics({
    church_id: params.church_id,
    start_date: params.start_date,
    end_date: params.end_date,
  })

  // Fetch transfer history
  const { data: transfers, count } = await getTransferHistory({
    church_id: params.church_id,
    start_date: params.start_date,
    end_date: params.end_date,
    status: params.status,
    limit,
    offset,
  })

  const totalPages = Math.ceil(count / limit)
  const netTransfers = stats.transfersIn - stats.transfersOut

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="icon">
            <Link href="/reports">
              <ArrowLeftIcon className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="font-display text-3xl font-bold ">Transfer Reports</h1>
            <p className="mt-1 text-sm text-gray-500">
              Analyze member transfers in and out of your church
            </p>
          </div>
        </div>
        <Button variant="outline">
          <DownloadIcon className="mr-2 h-4 w-4" />
          Export Report
        </Button>
      </div>

      {/* Statistics cards */}
      <div className="grid gap-6 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <ArrowUpIcon className="h-4 w-4 text-green-600" />
              Transfers In
            </CardDescription>
            <CardTitle className="text-3xl">{stats.transfersIn}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <ArrowDownIcon className="h-4 w-4 text-red-600" />
              Transfers Out
            </CardDescription>
            <CardTitle className="text-3xl">{stats.transfersOut}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Net Change</CardDescription>
            <CardTitle className={`text-3xl ${netTransfers >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {netTransfers > 0 ? '+' : ''}{netTransfers}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Pending</CardDescription>
            <CardTitle className="text-3xl">{stats.pending}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Approved</CardDescription>
            <CardTitle className="text-3xl">{stats.approved}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Transfer history table */}
      <Card>
        <CardHeader>
          <CardTitle>Transfer History</CardTitle>
          <CardDescription>
            Recent transfer requests and their status ({count} total)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div className="h-96 animate-pulse bg-gray-100 rounded-lg" />}>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>From Church</TableHead>
                    <TableHead>To Church</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Type</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transfers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        No transfer records found
                      </TableCell>
                    </TableRow>
                  ) : (
                    transfers.map((transfer) => (
                      <TableRow key={transfer.id}>
                        <TableCell className="font-medium">
                          {transfer.members?.full_name || 'Unknown'}
                        </TableCell>
                        <TableCell>{transfer.from_church?.name || 'N/A'}</TableCell>
                        <TableCell>{transfer.to_church?.name || 'N/A'}</TableCell>
                        <TableCell>
                          {new Date(transfer.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              transfer.status === 'approved'
                                ? 'default'
                                : transfer.status === 'rejected'
                                ? 'destructive'
                                : transfer.status === 'cancelled'
                                ? 'secondary'
                                : 'outline'
                            }
                          >
                            {transfer.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {transfer.transfer_type}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-500">
                  Page {page} of {totalPages}
                </div>
                <div className="flex gap-2">
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    disabled={page === 1}
                  >
                    <Link href={`/reports/transfers?page=${page - 1}`}>
                      Previous
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    disabled={page === totalPages}
                  >
                    <Link href={`/reports/transfers?page=${page + 1}`}>
                      Next
                    </Link>
                  </Button>
                </div>
              </div>
            )}
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}
