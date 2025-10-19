'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, Loader2 } from 'lucide-react'
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
import { reactivateUser } from '@/lib/actions/users'
import type { UserWithChurch } from '@/lib/queries/users'

interface ReactivateUserDialogProps {
  user: UserWithChurch
  onClose: () => void
}

export function ReactivateUserDialog({ user, onClose }: ReactivateUserDialogProps) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleReactivate = async () => {
    startTransition(async () => {
      const result = await reactivateUser(user.id)

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('User reactivated successfully')
        onClose()
        router.refresh()
      }
    })
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reactivate User</DialogTitle>
          <DialogDescription>
            Are you sure you want to reactivate this user? They will be able to log in again.
          </DialogDescription>
        </DialogHeader>

        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            This will restore access for the user. They will be able to log in and access the system.
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
            onClick={handleReactivate}
            disabled={isPending}
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Reactivate User
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
