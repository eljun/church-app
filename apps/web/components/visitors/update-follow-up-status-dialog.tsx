'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw, Loader2 } from 'lucide-react'
import type { Visitor } from '@church-app/database'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { updateFollowUpStatus } from '@/lib/actions/visitors'

interface UpdateFollowUpStatusDialogProps {
  visitor: Visitor
  trigger?: React.ReactNode
}

export function UpdateFollowUpStatusDialog({ visitor, trigger }: UpdateFollowUpStatusDialogProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const [status, setStatus] = useState(visitor.follow_up_status)
  const [notes, setNotes] = useState('')

  const handleStatusChange = (value: string) => {
    setStatus(value as 'pending' | 'contacted' | 'interested' | 'not_interested' | 'converted')
  }

  const handleSubmit = () => {
    startTransition(async () => {
      const result = await updateFollowUpStatus({
        visitor_id: visitor.id,
        follow_up_status: status as 'pending' | 'contacted' | 'interested' | 'not_interested' | 'converted',
        follow_up_notes: notes || null,
      })

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Follow-up status updated')
        setOpen(false)
        setNotes('')
        router.refresh()
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Update Status
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Follow-up Status</DialogTitle>
          <DialogDescription>
            Update the current follow-up status for {visitor.full_name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Status Selection */}
          <div className="space-y-2">
            <Label htmlFor="status">Follow-up Status</Label>
            <Select value={status} onValueChange={handleStatusChange}>
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="contacted">Contacted</SelectItem>
                <SelectItem value="interested">Interested</SelectItem>
                <SelectItem value="not_interested">Not Interested</SelectItem>
                <SelectItem value="converted">Converted</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any notes about this status update..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Update Status
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
