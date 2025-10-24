import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Calendar, User, Building, FileText, XCircle, Download, AlertTriangle } from 'lucide-react'
import { getTransferRequestById } from '@/lib/queries/transfers'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TransferActions } from '@/components/transfers/transfer-actions'
import { PageHeader } from '@/components/shared'

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

  // Get current user data to check permissions
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: userData } = await supabase
    .from('users')
    .select('role, church_id')
    .eq('id', user!.id)
    .single()

  // Check if user can approve/reject this transfer
  // Only destination church or superadmin/field_secretary can approve/reject
  const canApproveReject =
    userData?.role === 'superadmin' ||
    userData?.role === 'field_secretary' ||
    (userData?.church_id === transfer.to_church_id)

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
      <PageHeader
        backHref="/transfers"
        title="Transfer Request Details"
        description="View and manage this transfer request"
        actions={getStatusBadge(transfer.status)}
      />

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
                  {transfer.members ? (
                    <Link
                      href={`/members/${transfer.members.id}?ref=transfer`}
                      className="text-lg font-medium text-primary hover:underline"
                    >
                      {transfer.members.full_name}
                    </Link>
                  ) : (
                    <div className="flex items-center gap-2 text-gray-500">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="text-lg font-medium">Member Deleted</span>
                    </div>
                  )}
                </div>              </div>
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

          {/* Transfer Request Letter */}
          {transfer.attachment_url && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Transfer Request Letter
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Attached Document</p>
                      <p className="text-xs text-gray-500">Click to view or download</p>
                    </div>
                  </div>
                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                  >
                    <a
                      href={transfer.attachment_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      View Document
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

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

          {/* Actions - Only show to destination church or superadmin/field_secretary */}
          {transfer.status === 'pending' && canApproveReject && (
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
