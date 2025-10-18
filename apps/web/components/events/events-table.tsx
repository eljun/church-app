'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { MoreHorizontal, Eye, Pencil, Trash2, CalendarDays, UserPlus, ClipboardCheck } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { deleteEvent } from '@/lib/actions/events'
import { toast } from 'sonner'

interface Event {
  id: string
  title: string
  description: string | null
  event_type: 'service' | 'baptism' | 'conference' | 'social' | 'other'
  start_date: string
  end_date: string | null
  location: string | null
  is_public: boolean
  churches: {
    name: string
  } | null
}

interface EventsTableProps {
  events: Event[]
  currentPage: number
  totalPages: number
  totalCount: number
  userRole?: string
}

export function EventsTable({ events, currentPage, totalPages, totalCount, userRole }: EventsTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Bibleworkers have read-only access
  const isBibleworker = userRole === 'bibleworker'
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [eventToDelete, setEventToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const buildPaginationUrl = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', page.toString())
    return `/events?${params.toString()}`
  }

  const handleDelete = async () => {
    if (!eventToDelete) return

    setIsDeleting(true)
    const result = await deleteEvent(eventToDelete)
    setIsDeleting(false)

    if ('error' in result) {
      toast.error(result.error)
    } else {
      toast.success('Event deleted successfully')
      setDeleteDialogOpen(false)
      setEventToDelete(null)
      router.refresh()
    }
  }

  const getEventTypeBadge = (type: Event['event_type']) => {
    const variants: Record<Event['event_type'], { variant: 'default' | 'secondary' | 'destructive' | 'outline', label: string }> = {
      service: { variant: 'secondary', label: 'Service' },
      baptism: { variant: 'default', label: 'Baptism' },
      conference: { variant: 'secondary', label: 'Conference' },
      social: { variant: 'outline', label: 'Social' },
      other: { variant: 'outline', label: 'Other' },
    }

    return (
      <Badge variant={variants[type].variant}>
        {variants[type].label}
      </Badge>
    )
  }

  const formatDate = (date: string | null) => {
    if (!date) return 'N/A'
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const formatDateTime = (date: string) => {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const isUpcoming = (startDate: string) => {
    return new Date(startDate) > new Date()
  }

  const calculateDuration = (startDate: string, endDate: string | null) => {
    if (!endDate) return '1 day'

    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1 // +1 to include both start and end days

    return `${diffDays} ${diffDays === 1 ? 'day' : 'days'}`
  }

  return (
    <div className="space-y-4">
      {/* Table */}
      <div className="bg-white border border-primary/20">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Event</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Church</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>End Date</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground">
                  No events found
                </TableCell>
              </TableRow>
            ) : (
              events.map((event) => (
                <TableRow key={event.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/events/${event.id}`}
                      className="hover:underline flex items-center gap-2"
                    >
                      <CalendarDays className="h-4 w-4 text-muted-foreground" />
                      {event.title}
                    </Link>
                  </TableCell>
                  <TableCell>{getEventTypeBadge(event.event_type)}</TableCell>
                  <TableCell>{event.churches?.name || 'All Churches'}</TableCell>
                  <TableCell>{formatDateTime(event.start_date)}</TableCell>
                  <TableCell>{formatDate(event.end_date)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-normal">
                      {calculateDuration(event.start_date, event.end_date)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {event.location || 'TBA'}
                  </TableCell>
                  <TableCell>
                    {isUpcoming(event.start_date) ? (
                      <Badge variant="secondary">Upcoming</Badge>
                    ) : (
                      <Badge variant="outline">Past</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href={`/events/${event.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            View
                          </Link>
                        </DropdownMenuItem>
                        {!isBibleworker && (
                          <>
                            <DropdownMenuItem asChild>
                              <Link href={`/events/${event.id}/registrations`}>
                                <UserPlus className="mr-2 h-4 w-4" />
                                Registrations
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/events/${event.id}/attendance`}>
                                <ClipboardCheck className="mr-2 h-4 w-4" />
                                Attendance
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                              <Link href={`/events/${event.id}/edit`}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => {
                                setEventToDelete(event.id)
                                setDeleteDialogOpen(true)
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * 50 + 1} to {Math.min(currentPage * 50, totalCount)} of {totalCount} events
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
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the event
              from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
