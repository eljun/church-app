'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Check, X, Eye } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { approveTransferRequest, rejectTransferRequest } from '@/lib/actions/transfers'
import { toast } from 'sonner'

interface TransferRequest {
  id: string
  request_date: string
  status: 'pending' | 'approved' | 'rejected'
  notes: string | null
  members: {
    id: string
    full_name: string
  } | null
  from_church: {
    id: string
    name: string
  } | null
  to_church: {
    id: string
    name: string
  } | null
}

interface PendingTransfersTableProps {
  transfers: TransferRequest[]
  userRole: 'superadmin' | 'admin' | 'member'
  userChurchId: string | null
}

export function PendingTransfersTable({ transfers, userRole, userChurchId }: PendingTransfersTableProps) {
  const router = useRouter()
  const [approveDialogOpen, setApproveDialogOpen] = useState(false)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [transferToProcess, setTransferToProcess] = useState<string | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  // Check if user can approve/reject a transfer
  // Only superadmin or the receiving church admin can approve
  const canApproveTransfer = (transfer: TransferRequest) => {
    // Cannot approve if member or churches are deleted
    if (!transfer.members || !transfer.from_church || !transfer.to_church) return false

    if (userRole === 'superadmin') return true
    if (userRole === 'admin' && transfer.to_church.id === userChurchId) return true
    return false
  }

  const handleApprove = async () => {
    if (!transferToProcess) return

    setIsProcessing(true)
    const result = await approveTransferRequest({
      transfer_request_id: transferToProcess,
    })
    setIsProcessing(false)

    if ('error' in result) {
      toast.error(result.error)
    } else {
      toast.success('Transfer approved successfully')
      setApproveDialogOpen(false)
      setTransferToProcess(null)
      router.refresh()
    }
  }

  const handleReject = async () => {
    if (!transferToProcess || !rejectionReason) return

    setIsProcessing(true)
    const result = await rejectTransferRequest({
      transfer_request_id: transferToProcess,
      rejection_reason: rejectionReason,
    })
    setIsProcessing(false)

    if ('error' in result) {
      toast.error(result.error)
    } else {
      toast.success('Transfer rejected')
      setRejectDialogOpen(false)
      setTransferToProcess(null)
      setRejectionReason('')
      router.refresh()
    }
  }

  if (transfers.length === 0) {
    return (
      <div className="border border-primary/20 bg-white p-8 text-center">
        <p className="text-gray-500">No pending transfer requests</p>
      </div>
    )
  }

  return (
    <>
      <div className="border border-primary/20 bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead>From Church</TableHead>
              <TableHead>To Church</TableHead>
              <TableHead>Request Date</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transfers.map((transfer) => (
              <TableRow key={transfer.id}>
                <TableCell>
                  {transfer.members ? (
                    <Link
                      href={`/members/${transfer.members.id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {transfer.members.full_name}
                    </Link>
                  ) : (
                    <span className="text-sm text-red-600 italic">Member deleted</span>
                  )}
                </TableCell>
                <TableCell>
                  {transfer.from_church ? (
                    <Link
                      href={`/churches/${transfer.from_church.id}`}
                      className="text-sm text-gray-600 hover:underline"
                    >
                      {transfer.from_church.name}
                    </Link>
                  ) : (
                    <span className="text-sm text-gray-500 italic">N/A</span>
                  )}
                </TableCell>
                <TableCell>
                  {transfer.to_church ? (
                    <Link
                      href={`/churches/${transfer.to_church.id}`}
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      {transfer.to_church.name}
                    </Link>
                  ) : (
                    <span className="text-sm text-gray-500 italic">N/A</span>
                  )}
                </TableCell>
                <TableCell>
                  <span className="text-sm text-gray-600">
                    {new Date(transfer.request_date).toLocaleDateString()}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-gray-600">
                    {transfer.notes ? (
                      <span className="max-w-xs truncate block">{transfer.notes}</span>
                    ) : (
                      <span className="text-gray-400 italic">No notes</span>
                    )}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      asChild
                    >
                      <Link href={`/transfers/${transfer.id}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                    {canApproveTransfer(transfer) ? (
                      <>
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => {
                            setTransferToProcess(transfer.id)
                            setApproveDialogOpen(true)
                          }}
                        >
                          <Check className="mr-1 h-4 w-4" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            setTransferToProcess(transfer.id)
                            setRejectDialogOpen(true)
                          }}
                        >
                          <X className="mr-1 h-4 w-4" />
                          Reject
                        </Button>
                      </>
                    ) : (
                      <span className="text-xs text-gray-500 italic">
                        Awaiting approval
                      </span>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Approve Dialog */}
      <AlertDialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Transfer Request?</AlertDialogTitle>
            <AlertDialogDescription>
              This will update the member&apos;s church assignment and create a transfer history record.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleApprove} disabled={isProcessing}>
              {isProcessing ? 'Approving...' : 'Approve Transfer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Transfer Request</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this transfer request (minimum 10 characters).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Enter rejection reason..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
              disabled={isProcessing}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRejectDialogOpen(false)
                setRejectionReason('')
              }}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={isProcessing || rejectionReason.length < 10}
            >
              {isProcessing ? 'Rejecting...' : 'Reject Transfer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
