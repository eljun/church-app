'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'
import { deleteUser } from '@/lib/actions/users'
import type { UserWithChurch } from '@/lib/queries/users'

interface DeleteUserDialogProps {
  user: UserWithChurch
  onClose: () => void
}

export function DeleteUserDialog({ user, onClose }: DeleteUserDialogProps) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleDelete = async () => {
    startTransition(async () => {
      const result = await deleteUser({ id: user.id })

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('User deleted successfully')
        onClose()
        router.refresh()
      }
    })
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete User</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this user? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            This will permanently delete the user account and remove all associated data.
          </AlertDescription>
        </Alert>

        <div className="space-y-2 rounded-lg border p-4 bg-muted">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Email:</span>
            <span className="text-sm font-medium">{user.email}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Role:</span>
            <span className="text-sm font-medium capitalize">{user.role}</span>
          </div>
          {user.churches && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Church:</span>
              <span className="text-sm font-medium">{user.churches.name}</span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isPending}
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete User
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
