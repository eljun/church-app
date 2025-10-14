import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Calendar, User, Building, FileText, XCircle } from 'lucide-react'
import { getTransferRequestById } from '@/lib/queries/transfers'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TransferActions } from '@/components/transfers/transfer-actions'

interface TransferDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function TransferDetailPage({ params }: TransferDetailPageProps) {
  const { id } = await params

  let transfer
  try {
    transfer = await getTransferRequestById(id)
  } catch {
    notFound()
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">Pending</Badge>
      case 'approved':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Approved</Badge>
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Rejected</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Back button and header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/transfers">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="font-display text-3xl  text-primary ">Transfer Request Details</h1>
          <p className="mt-1 text-sm text-gray-500">
            View and manage this transfer request
          </p>
        </div>
        {getStatusBadge(transfer.status)}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Member Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Member Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Name</p>
                  <Link
                    href={`/members/${transfer.members.id}`}
                    className="text-lg font-medium text-primary hover:underline"
                  >
                    {transfer.members.full_name}
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Transfer Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Transfer Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">From Church</p>
                  <Link
                    href={`/churches/${transfer.from_church.id}`}
                    className="text-lg font-medium text-primary hover:underline"
                  >
                    {transfer.from_church.name}
                  </Link>
                </div>
                <div>
                  <p className="text-sm text-gray-500">To Church</p>
                  <Link
                    href={`/churches/${transfer.to_church.id}`}
                    className="text-lg font-medium text-primary hover:underline"
                  >
                    {transfer.to_church.name}
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {transfer.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">{transfer.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Rejection Reason */}
          {transfer.status === 'rejected' && transfer.rejection_reason && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-900">
                  <XCircle className="h-5 w-5" />
                  Rejection Reason
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-red-800">{transfer.rejection_reason}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Request Date</p>
                  <p className="font-medium">
                    {new Date(transfer.request_date).toLocaleDateString()}
                  </p>
                </div>
                {transfer.approval_date && (
                  <div>
                    <p className="text-sm text-gray-500">
                      {transfer.status === 'approved' ? 'Approved Date' : 'Processed Date'}
                    </p>
                    <p className="font-medium">
                      {new Date(transfer.approval_date).toLocaleDateString()}
                    </p>
                  </div>
                )}
                {transfer.approver && (
                  <div>
                    <p className="text-sm text-gray-500">
                      {transfer.status === 'approved' ? 'Approved By' : 'Processed By'}
                    </p>
                    <p className="font-medium">{transfer.approver.email}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          {transfer.status === 'pending' && (
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <TransferActions transferId={transfer.id} />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
