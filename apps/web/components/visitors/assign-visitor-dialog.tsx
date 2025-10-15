'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { UserPlus, Loader2 } from 'lucide-react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { updateVisitor } from '@/lib/actions/visitors'
import { createClient } from '@/lib/supabase/client'

interface AssignVisitorDialogProps {
  visitor: any
  currentUser: any
  trigger?: React.ReactNode
}

export function AssignVisitorDialog({ visitor, currentUser, trigger }: AssignVisitorDialogProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const [users, setUsers] = useState<any[]>([])
  const [selectedUserId, setSelectedUserId] = useState(visitor.assigned_to_user_id || 'unassigned')

  // Load users from the church (for admin) or all users (for superadmin)
  useEffect(() => {
    async function loadUsers() {
      const supabase = createClient()

      let query = supabase
        .from('users')
        .select('id, email, role')
        .in('role', ['admin', 'superadmin'])

      if (currentUser.role === 'admin' && currentUser.church_id) {
        query = query.eq('church_id', currentUser.church_id)
      }

      const { data } = await query
      setUsers(data || [])
    }

    if (open) {
      loadUsers()
    }
  }, [open, currentUser])

  const handleSubmit = () => {
    startTransition(async () => {
      const result = await updateVisitor({
        id: visitor.id,
        assigned_to_user_id: selectedUserId === 'unassigned' ? null : selectedUserId,
      })

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(
          selectedUserId
            ? 'Visitor assigned successfully'
            : 'Visitor assignment removed'
        )
        setOpen(false)
        router.refresh()
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <UserPlus className="mr-2 h-4 w-4" />
            Assign
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Visitor</DialogTitle>
          <DialogDescription>
            Assign {visitor.full_name} to a user for follow-up
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* User Selection */}
          <div className="space-y-2">
            <Label htmlFor="user">Assign To</Label>
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger id="user">
                <SelectValue placeholder="Select a user" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.email} ({user.role})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {selectedUserId === 'unassigned' ? 'Unassign' : 'Assign'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
