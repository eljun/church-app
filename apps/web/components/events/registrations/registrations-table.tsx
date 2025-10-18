'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Trash2, X, User, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import { toast } from 'sonner'
import { cancelRegistration, deleteRegistration } from '@/lib/actions/event-registrations'
import type { EventRegistrationWithDetails } from '@/lib/queries/event-registrations'

interface RegistrationsTableProps {
  registrations: EventRegistrationWithDetails[]
  userRole: 'superadmin' | 'coordinator' | 'admin' | 'member'
  currentPage: number
  totalPages: number
  totalCount: number
  eventId: string
}

export function RegistrationsTable({
  registrations,
  userRole,
  currentPage,
  totalPages,
  totalCount,
  eventId
}: RegistrationsTableProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedRegistrationId, setSelectedRegistrationId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  const buildPaginationUrl = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', page.toString())
    return `/events/${eventId}/registrations?${params.toString()}`
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success', label: string }> = {
      registered: { variant: 'secondary', label: 'Registered' },
      attended: { variant: 'success', label: 'Attended' },
      no_show: { variant: 'destructive', label: 'No Show' },
      confirmed: { variant: 'secondary', label: 'Confirmed' },
      cancelled: { variant: 'destructive', label: 'Cancelled' },
    }

    const config = variants[status] || { variant: 'outline' as const, label: status }

    return (
      <Badge variant={config.variant}>
        {config.label}
      </Badge>
    )
  }

  const handleDelete = async () => {
    if (!selectedRegistrationId) return

    setIsDeleting(true)
    const result = await deleteRegistration(selectedRegistrationId)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Registration deleted successfully')
      router.refresh()
    }

    setIsDeleting(false)
    setDeleteDialogOpen(false)
    setSelectedRegistrationId(null)
  }

  const handleCancel = async (registrationId: string) => {
    const result = await cancelRegistration(registrationId)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Registration cancelled successfully')
      router.refresh()
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (registrations.length === 0) {
    return (
      <div className="text-center py-12 border bg-muted/20">
        <p className="text-muted-foreground">No registrations yet</p>
      </div>
    )
  }

  const itemsPerPage = 20
  const startItem = (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalCount)

  return (
    <div className="space-y-4">
      {/* Table */}
      <div className="bg-white border border-primary/20">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Church</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Registered At</TableHead>
              <TableHead>Registered By</TableHead>
              {userRole !== 'member' && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {registrations.map((registration) => {
              const isMember = !!registration.member_id
              const isVisitor = !!registration.visitor_id
              const attendee = isMember ? registration.members : registration.visitors
              const church = isMember
                ? registration.members?.churches
                : registration.visitors?.associated_church

              return (
                <TableRow key={registration.id}>
                  <TableCell>
                    {isMember ? (
                      <Badge variant="outline" className="gap-1">
                        <Users className="h-3 w-3" />
                        Member
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="gap-1">
                        <User className="h-3 w-3" />
                        Visitor
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">
                    {attendee?.full_name || 'N/A'}
                    {isVisitor && registration.visitors?.phone && (
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {registration.visitors.phone}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {church ? (
                      <div className="text-sm">
                        <div>{church.name}</div>
                        <div className="text-muted-foreground text-xs">
                          {church.district} · {church.field}
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">No church</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(registration.status)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(registration.registered_at)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {registration.registered_by_user?.email || 'N/A'}
                  </TableCell>
                {userRole !== 'member' && (
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {registration.status === 'registered' && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCancel(registration.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedRegistrationId(registration.id)
                              setDeleteDialogOpen(true)
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                )}
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {startItem} to {endItem} of {totalCount} registrations
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => router.push(buildPaginationUrl(currentPage - 1))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => router.push(buildPaginationUrl(currentPage + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Registration?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this registration. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
