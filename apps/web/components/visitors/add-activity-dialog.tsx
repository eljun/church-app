'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Loader2, CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { toast } from 'sonner'
import { createVisitorActivity } from '@/lib/actions/visitor-activities'
import { cn } from '@/lib/utils'

interface AddActivityDialogProps {
  visitorId: string
}

export function AddActivityDialog({ visitorId }: AddActivityDialogProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const [activityType, setActivityType] = useState<string>('phone_call')
  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [scheduledDate, setScheduledDate] = useState<Date>()

  const resetForm = () => {
    setActivityType('phone_call')
    setTitle('')
    setNotes('')
    setScheduledDate(undefined)
  }

  const handleSubmit = () => {
    if (!title.trim()) {
      toast.error('Please enter a title')
      return
    }

    startTransition(async () => {
      const result = await createVisitorActivity({
        visitor_id: visitorId,
        activity_type: activityType as any,
        title: title.trim(),
        notes: notes.trim() || null,
        scheduled_date: scheduledDate ? scheduledDate.toISOString() : null,
      })

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Activity added successfully')
        setOpen(false)
        resetForm()
        router.refresh()
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Activity
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Follow-up Activity</DialogTitle>
          <DialogDescription>
            Record or schedule a follow-up activity for this visitor
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Activity Type */}
          <div className="space-y-2">
            <Label htmlFor="activity-type">Activity Type</Label>
            <Select value={activityType} onValueChange={setActivityType}>
              <SelectTrigger id="activity-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="phone_call">Phone Call</SelectItem>
                <SelectItem value="home_visit">Home Visit</SelectItem>
                <SelectItem value="bible_study">Bible Study</SelectItem>
                <SelectItem value="follow_up_email">Follow-up Email</SelectItem>
                <SelectItem value="text_message">Text Message</SelectItem>
                <SelectItem value="scheduled_visit">Scheduled Visit</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="e.g., Initial phone call, Home visit scheduled"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any details about this activity..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Scheduled Date */}
          <div className="space-y-2">
            <Label htmlFor="scheduled-date">Scheduled Date (optional)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="scheduled-date"
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !scheduledDate && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {scheduledDate ? (
                    format(scheduledDate, 'PPP')
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={scheduledDate}
                  onSelect={setScheduledDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Add Activity
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
