'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
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
import { Button } from '@/components/ui/button'
import { deleteChurch } from '@/lib/actions/churches'
import { toast } from 'sonner'

interface DeleteChurchButtonProps {
  churchId: string
  churchName: string
}

export function DeleteChurchButton({ churchId, churchName }: DeleteChurchButtonProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [open, setOpen] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    const result = await deleteChurch(churchId)
    setIsDeleting(false)

    if ('error' in result) {
      toast.error(result.error)
    } else {
      toast.success('Church deleted successfully')
      setOpen(false)
      router.push('/churches')
      router.refresh()
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete{' '}
            <strong>{churchName}</strong> from the database.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700"
          >
            {isDeleting ? 'Deleting...' : 'Delete Church'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
