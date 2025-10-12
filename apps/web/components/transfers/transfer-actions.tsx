'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, X } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { approveTransferRequest, rejectTransferRequest } from '@/lib/actions/transfers'
import { toast } from 'sonner'

interface TransferActionsProps {
  transferId: string
}

export function TransferActions({ transferId }: TransferActionsProps) {
  const router = useRouter()
  const [isApproving, setIsApproving] = useState(false)
  const [isRejecting, setIsRejecting] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)

  const handleApprove = async () => {
    setIsApproving(true)
    const result = await approveTransferRequest({
      transfer_request_id: transferId,
    })
    setIsApproving(false)

    if ('error' in result) {
      toast.error(result.error)
    } else {
      toast.success('Transfer approved successfully')
      router.refresh()
    }
  }

  const handleReject = async () => {
    if (!rejectionReason) return

    setIsRejecting(true)
    const result = await rejectTransferRequest({
      transfer_request_id: transferId,
      rejection_reason: rejectionReason,
    })
    setIsRejecting(false)

    if ('error' in result) {
      toast.error(result.error)
    } else {
      toast.success('Transfer rejected')
      setRejectDialogOpen(false)
      setRejectionReason('')
      router.refresh()
    }
  }

  return (
    <div className="space-y-2">
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button className="w-full" disabled={isApproving}>
            <Check className="mr-2 h-4 w-4" />
            Approve Transfer
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Transfer Request?</AlertDialogTitle>
            <AlertDialogDescription>
              This will update the member&apos;s church assignment and create a transfer history record.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleApprove}>
              Approve Transfer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="destructive" className="w-full" disabled={isRejecting}>
            <X className="mr-2 h-4 w-4" />
            Reject Transfer
          </Button>
        </DialogTrigger>
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
              disabled={isRejecting}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRejectDialogOpen(false)
                setRejectionReason('')
              }}
              disabled={isRejecting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={isRejecting || rejectionReason.length < 10}
            >
              {isRejecting ? 'Rejecting...' : 'Reject Transfer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
