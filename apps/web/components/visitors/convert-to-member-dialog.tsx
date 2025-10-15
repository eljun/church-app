'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { UserCheck, Loader2, CalendarIcon } from 'lucide-react'
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
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { toast } from 'sonner'
import { convertVisitorToMember } from '@/lib/actions/visitors'
import { cn } from '@/lib/utils'

interface ConvertToMemberDialogProps {
  visitor: any
  trigger?: React.ReactNode
}

export function ConvertToMemberDialog({ visitor, trigger }: ConvertToMemberDialogProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const [baptismDate, setBaptismDate] = useState<Date>()
  const [baptizedBy, setBaptizedBy] = useState('')

  const handleSubmit = () => {
    if (!baptismDate) {
      toast.error('Please select a baptism date')
      return
    }

    if (!visitor.associated_church_id) {
      toast.error('Visitor must be associated with a church before conversion')
      return
    }

    startTransition(async () => {
      const result = await convertVisitorToMember({
        visitor_id: visitor.id,
        church_id: visitor.associated_church_id,
        sp: format(baptismDate, 'yyyy-MM-dd'),
        baptized_by: baptizedBy || undefined,
      })

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(`${visitor.full_name} has been converted to a member!`)
        setOpen(false)
        // Redirect to the new member page
        if (result.data?.id) {
          router.push(`/members/${result.data.id}`)
        } else {
          router.push('/members')
        }
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <UserCheck className="mr-2 h-4 w-4" />
            Convert to Member
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Convert Visitor to Member</DialogTitle>
          <DialogDescription>
            Convert {visitor.full_name} to a church member. This will create a new member
            record using the visitor's information.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Church Info */}
          {visitor.associated_church && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium">Church</p>
              <p className="text-sm text-muted-foreground">
                {visitor.associated_church.name}
              </p>
            </div>
          )}

          {/* Baptism Date */}
          <div className="space-y-2">
            <Label htmlFor="baptism-date">Baptism Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="baptism-date"
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !baptismDate && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {baptismDate ? format(baptismDate, 'PPP') : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={baptismDate}
                  onSelect={setBaptismDate}
                  disabled={(date) =>
                    date > new Date() || date < new Date('1900-01-01')
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Baptized By */}
          <div className="space-y-2">
            <Label htmlFor="baptized-by">Baptized By (optional)</Label>
            <Input
              id="baptized-by"
              placeholder="Pastor or minister who performed baptism"
              value={baptizedBy}
              onChange={(e) => setBaptizedBy(e.target.value)}
            />
          </div>

          {/* Warning */}
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> This action will create a new member record and mark the
              visitor as converted. This cannot be undone.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Convert to Member
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
