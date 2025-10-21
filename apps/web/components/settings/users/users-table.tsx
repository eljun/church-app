'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { format } from 'date-fns'
import {
  Crown,
  UserCog,
  Church,
  BookOpen,
  Shield,
  User,
  MoreHorizontal,
  Edit,
  Trash2,
  Key,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { EditUserDialog } from './edit-user-dialog'
import { DeleteUserDialog } from './delete-user-dialog'
import { ResetPasswordDialog } from './reset-password-dialog'
import { ReactivateUserDialog } from './reactivate-user-dialog'
import type { UserWithChurch } from '@/lib/queries/users'

interface UsersTableProps {
  users: UserWithChurch[]
  churches: Array<{ id: string; name: string; district: string; field: string }>
  currentPage: number
  totalPages: number
  totalCount: number
}

const roleIcons = {
  superadmin: Crown,
  field_secretary: UserCog,
  pastor: Church,
  church_secretary: Shield,
  coordinator: UserCog,
  bibleworker: BookOpen,
}

const roleColors = {
  superadmin: 'bg-purple-100 text-purple-800 border-purple-200',
  field_secretary: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  pastor: 'bg-green-100 text-green-800 border-green-200',
  church_secretary: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  coordinator: 'bg-blue-100 text-blue-800 border-blue-200',
  bibleworker: 'bg-orange-100 text-orange-800 border-orange-200',
}

export function UsersTable({
  users,
  churches,
  currentPage,
  totalPages,
  totalCount,
}: UsersTableProps) {
  const searchParams = useSearchParams()
  const [editingUser, setEditingUser] = useState<UserWithChurch | null>(null)
  const [deletingUser, setDeletingUser] = useState<UserWithChurch | null>(null)
  const [resettingPassword, setResettingPassword] = useState<UserWithChurch | null>(null)
  const [reactivatingUser, setReactivatingUser] = useState<UserWithChurch | null>(null)

  // Build pagination URLs that preserve search params
  const buildPageUrl = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', page.toString())
    return `?${params.toString()}`
  }

  if (users.length === 0) {
    return (
      <div className="text-center py-12">
        <User className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-semibold text-gray-900">No users</h3>
        <p className="mt-1 text-sm text-gray-500">Get started by creating a new user.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Assignment</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => {
              const RoleIcon = roleIcons[user.role]
              const roleColor = roleColors[user.role]

              return (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary text-white text-xs">
                          {user.email[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{user.email}</p>
                        <p className="text-xs text-muted-foreground">{user.id.slice(0, 8)}...</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Badge variant="outline" className={roleColor}>
                        <RoleIcon className="mr-1 h-3 w-3" />
                        {user.role === 'bibleworker'
                          ? 'Bible Worker'
                          : user.role === 'church_secretary'
                          ? 'Church Secretary'
                          : user.role === 'field_secretary'
                          ? 'Field Secretary'
                          : user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </Badge>
                      {!user.is_active && (
                        <Badge variant="destructive" className="text-xs">
                          Inactive
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {user.role === 'church_secretary' && user.churches && (
                        <div className="flex items-center gap-1">
                          <Church className="h-3 w-3 text-muted-foreground" />
                          <span>{user.churches.name}</span>
                        </div>
                      )}
                      {user.role === 'field_secretary' && user.field_id && (
                        <div className="flex items-center gap-1 text-xs">
                          <span className="text-muted-foreground">Field:</span>
                          <span>{user.field_id}</span>
                        </div>
                      )}
                      {user.role === 'pastor' && (
                        <div className="space-y-0.5">
                          {user.district_id && (
                            <div className="flex items-center gap-1 text-xs">
                              <span className="text-muted-foreground">District:</span>
                              <span>{user.district_id}</span>
                            </div>
                          )}
                          {user.field_id && (
                            <div className="flex items-center gap-1 text-xs">
                              <span className="text-muted-foreground">Field:</span>
                              <span>{user.field_id}</span>
                            </div>
                          )}
                        </div>
                      )}
                      {user.role === 'bibleworker' && (
                        <div className="text-xs text-muted-foreground">
                          {user.assigned_member_ids.length} member(s)
                        </div>
                      )}
                      {!['admin', 'pastor', 'bibleworker'].includes(user.role) && (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(user.created_at), 'MMM d, yyyy')}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setEditingUser(user)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit User
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setResettingPassword(user)}>
                          <Key className="mr-2 h-4 w-4" />
                          Reset Password
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {user.is_active ? (
                          <DropdownMenuItem
                            onClick={() => setDeletingUser(user)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Deactivate User
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onClick={() => setReactivatingUser(user)}
                            className="text-green-600"
                          >
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Reactivate User
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
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
            Showing {((currentPage - 1) * 20) + 1} to {Math.min(currentPage * 20, totalCount)} of {totalCount} users
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              asChild
              disabled={currentPage === 1}
            >
              <Link href={buildPageUrl(currentPage - 1)}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Link>
            </Button>
            <div className="text-sm">
              Page {currentPage} of {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              asChild
              disabled={currentPage === totalPages}
            >
              <Link href={buildPageUrl(currentPage + 1)}>
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </div>
        </div>
      )}

      {/* Dialogs */}
      {editingUser && (
        <EditUserDialog
          user={editingUser}
          churches={churches}
          onClose={() => setEditingUser(null)}
        />
      )}
      {deletingUser && (
        <DeleteUserDialog
          user={deletingUser}
          onClose={() => setDeletingUser(null)}
        />
      )}
      {resettingPassword && (
        <ResetPasswordDialog
          user={resettingPassword}
          onClose={() => setResettingPassword(null)}
        />
      )}
      {reactivatingUser && (
        <ReactivateUserDialog
          user={reactivatingUser}
          onClose={() => setReactivatingUser(null)}
        />
      )}
    </div>
  )
}
