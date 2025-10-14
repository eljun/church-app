'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Loader2, Check } from 'lucide-react'
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
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { registerMembersForEventBulk } from '@/lib/actions/event-registrations'

interface Member {
  id: string
  full_name: string
  churches: {
    name: string
    district: string
    field: string
  }
}

interface RegisterMembersDialogProps {
  eventId: string
  availableMembers: Member[]
}

export function RegisterMembersDialog({
  eventId,
  availableMembers,
}: RegisterMembersDialogProps) {
  const [open, setOpen] = useState(false)
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])
  const [notes, setNotes] = useState('')
  const [isPending, startTransition] = useTransition()
  const [searchQuery, setSearchQuery] = useState('')
  const router = useRouter()

  const filteredMembers = availableMembers.filter(member =>
    member.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleToggleMember = (memberId: string) => {
    setSelectedMembers(prev =>
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    )
  }

  const handleToggleAll = () => {
    if (selectedMembers.length === filteredMembers.length) {
      setSelectedMembers([])
    } else {
      setSelectedMembers(filteredMembers.map(m => m.id))
    }
  }

  const handleSubmit = () => {
    if (selectedMembers.length === 0) {
      toast.error('Please select at least one member to register')
      return
    }

    startTransition(async () => {
      const result = await registerMembersForEventBulk({
        event_id: eventId,
        member_ids: selectedMembers,
        notes,
      })

      if (result.error) {
        toast.error(result.error)
      } else {
        const message = `${result.registered} member(s) registered successfully${
          result.skipped ? ` (${result.skipped} already registered)` : ''
        }`
        toast.success(message)
        setOpen(false)
        setSelectedMembers([])
        setNotes('')
        setSearchQuery('')
        router.refresh()
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Register Members
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Register Members for Event</DialogTitle>
          <DialogDescription>
            Select members from your church to register for this event
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4">
          {/* Search */}
          <div>
            <Label>Search Members</Label>
            <input
              type="text"
              placeholder="Search by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-primary/20 mt-2 mb-4"
            />
          </div>

          {/* Select All */}
          {filteredMembers.length > 0 && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="select-all"
                checked={
                  filteredMembers.length > 0 &&
                  selectedMembers.length === filteredMembers.length
                }
                onCheckedChange={handleToggleAll}
              />
              <label
                htmlFor="select-all"
                className="text-sm font-bold leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Select All ({filteredMembers.length} members)
              </label>
            </div>
          )}

          {/* Members List */}
          <div className="space-y-2">
            {filteredMembers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                {availableMembers.length === 0
                  ? 'All members are already registered for this event'
                  : 'No members found'}
              </p>
            ) : (
              filteredMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-start space-x-3 p-3 border hover:bg-primary/10 cursor-pointer hover:border-primary/50"
                  onClick={() => handleToggleMember(member.id)}
                >
                  <Checkbox
                    id={member.id}
                    checked={selectedMembers.includes(member.id)}
                    onCheckedChange={() => handleToggleMember(member.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <label
                      htmlFor={member.id}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {member.full_name}
                    </label>
                    <p className="text-xs text-muted-foreground mt-1">
                      {member.churches.name} · {member.churches.district} · {member.churches.field}
                    </p>
                  </div>
                  {selectedMembers.includes(member.id) && (
                    <Check className="h-4 w-4 text-accent" />
                  )}
                </div>
              ))
            )}
          </div>

          {/* Notes */}
          <div className="mt-6">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any notes about these registrations..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="mt-2"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isPending || selectedMembers.length === 0}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Register {selectedMembers.length > 0 && `(${selectedMembers.length})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
