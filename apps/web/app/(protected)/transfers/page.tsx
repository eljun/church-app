import { Suspense } from 'react'
import Link from 'next/link'
import { PlusIcon, Clock, History, Users } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { getTransferRequests, getTransferHistory } from '@/lib/queries/transfers'
import { PendingTransfersTable } from '@/components/transfers/pending-transfers-table'
import { TransferHistoryTable } from '@/components/transfers/transfer-history-table'
import { TransferStats } from '@/components/transfers/transfer-stats'

interface TransfersPageProps {
  searchParams: Promise<{
    tab?: 'pending' | 'history'
    page?: string
  }>
}

export default async function TransfersPage({ searchParams }: TransfersPageProps) {
  const params = await searchParams
  const activeTab = params.tab || 'pending'

  // Fetch data for both tabs
  const [pendingTransfers, allTransfers, historyData] = await Promise.all([
    getTransferRequests('pending'),
    getTransferRequests(),
    getTransferHistory(100),
  ])

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold ">Transfer Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage member transfers between churches
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/transfers/bulk">
              <Users className="mr-2 h-4 w-4" />
              Bulk Transfer
            </Link>
          </Button>
          <Button asChild>
            <Link href="/transfers/new">
              <PlusIcon className="mr-2 h-4 w-4" />
              New Transfer
            </Link>
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <Suspense fallback={<div className="h-32 animate-pulse bg-gray-100 rounded-lg" />}>
        <TransferStats
          pendingCount={pendingTransfers.length}
          totalTransfers={allTransfers.length}
          historyCount={historyData.length}
        />
      </Suspense>

      {/* Tabs */}
      <Tabs defaultValue={activeTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending" className="gap-2">
            <Clock className="h-4 w-4" />
            Pending Transfers
            {pendingTransfers.length > 0 && (
              <span className="ml-1 rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-800">
                {pendingTransfers.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="h-4 w-4" />
            Transfer History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          <Suspense fallback={<div className="h-96 animate-pulse bg-gray-100 rounded-lg" />}>
            <PendingTransfersTable transfers={pendingTransfers} />
          </Suspense>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Suspense fallback={<div className="h-96 animate-pulse bg-gray-100 rounded-lg" />}>
            <TransferHistoryTable history={historyData} />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  )
}
