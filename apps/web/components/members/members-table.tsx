'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { MoreHorizontal, Eye, Pencil, Trash2 } from 'lucide-react'
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
import { deleteMember } from '@/lib/actions/members'
import { toast } from 'sonner'

interface Member {
  id: string
  full_name: string
  age: number
  birthday: string
  date_of_baptism: string | null
  physical_condition: 'fit' | 'sickly'
  spiritual_condition: 'active' | 'inactive'
  status: 'active' | 'transferred_out' | 'resigned' | 'disfellowshipped' | 'deceased'
  churches: {
    name: string
  } | null
}

interface MembersTableProps {
  members: Member[]
  currentPage: number
  totalPages: number
  totalCount: number
  userRole: 'superadmin' | 'church_secretary' | 'bibleworker'
}

export function MembersTable({ members, currentPage, totalPages, totalCount, userRole }: MembersTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [memberToDelete, setMemberToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Bibleworkers have read-only access
  const isBibleworker = userRole === 'bibleworker'

  const buildPaginationUrl = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', page.toString())
    return `/members?${params.toString()}`
  }

  const handleDelete = async () => {
    if (!memberToDelete) return

    setIsDeleting(true)
    const result = await deleteMember(memberToDelete)
    setIsDeleting(false)

    if ('error' in result) {
      toast.error(result.error)
    } else {
      toast.success('Member deleted successfully')
      setDeleteDialogOpen(false)
      setMemberToDelete(null)
      router.refresh()
    }
  }

  const getStatusBadge = (status: Member['status']) => {
    const variants: Record<Member['status'], 'default' | 'secondary' | 'destructive' | 'outline'> = {
      active: 'secondary',
      transferred_out: 'secondary',
      resigned: 'outline',
      disfellowshipped: 'destructive',
      deceased: 'secondary',
    }

    return (
      <Badge variant={variants[status]}>
        {status.replace('_', ' ')}
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

  return (
    <div className="space-y-4">
      {/* Table */}
      <div className="bg-white border border-primary/20">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Church</TableHead>
              <TableHead>Age</TableHead>
              <TableHead>Birthday</TableHead>
              <TableHead>Baptism Date</TableHead>
              {/* <TableHead>Spiritual</TableHead> */}
              <TableHead>Status</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground">
                  No members found
                </TableCell>
              </TableRow>
            ) : (
              members.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/members/${member.id}`}
                      className="hover:underline"
                    >
                      {member.full_name}
                    </Link>
                  </TableCell>
                  <TableCell>{member.churches?.name || 'N/A'}</TableCell>
                  <TableCell>{member.age}</TableCell>
                  <TableCell>{formatDate(member.birthday)}</TableCell>
                  <TableCell>{formatDate(member.date_of_baptism)}</TableCell>
                  {/* <TableCell>{getSpiritualBadge(member.spiritual_condition)}</TableCell> */}
                  <TableCell>{getStatusBadge(member.status)}</TableCell>
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
                          <Link href={`/members/${member.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            View
                          </Link>
                        </DropdownMenuItem>
                        {!isBibleworker && (
                          <>
                            <DropdownMenuItem asChild>
                              <Link href={`/members/${member.id}/edit`}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                              </Link>
                            </DropdownMenuItem>
                            {userRole === 'superadmin' && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={() => {
                                    setMemberToDelete(member.id)
                                    setDeleteDialogOpen(true)
                                  }}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </>
                            )}
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
            Showing {(currentPage - 1) * 50 + 1} to {Math.min(currentPage * 50, totalCount)} of {totalCount} members
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
              This action cannot be undone. This will permanently delete the member
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
