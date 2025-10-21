import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUsers } from '@/lib/queries/users'
import { getChurches } from '@/lib/queries/churches'
import { UsersTable } from '@/components/settings/users/users-table'
import { CreateUserDialog } from '@/components/settings/users/create-user-dialog'
import { PageFilters } from '@/components/shared/page-filters'
import { PageHeader } from '@/components/shared'

export const metadata = {
  title: 'User Management',
  description: 'Manage users, roles, and permissions',
}

interface UsersPageProps {
  searchParams: Promise<{ page?: string; role?: string; query?: string; status?: string }>
}

export default async function UsersPage({ searchParams }: UsersPageProps) {
  const { page: pageParam, role: roleFilter, query: searchQuery, status: statusFilter } = await searchParams
  const supabase = await createClient()

  // Get current user
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) {
    redirect('/login')
  }

  // Get user details with role
  const { data: currentUser } = await supabase
    .from('users')
    .select('*')
    .eq('id', authUser.id)
    .single()

  if (!currentUser || currentUser.role !== 'superadmin') {
    redirect('/')
  }

  // Pagination
  const page = parseInt(pageParam || '1')
  const limit = 20
  const offset = (page - 1) * limit

  // Get all churches for assignments
  const churchesData = await getChurches({ limit: 1000, offset: 0 })
  const churches = churchesData?.data || []

  return (
    <div className="space-y-6">
      <PageHeader
        backHref="/"
        title="User Management"
        description="Manage users, roles, and permissions across the system"
        actions={<CreateUserDialog churches={churches} />}
      />

      {/* Search and Filters */}
      <PageFilters
        searchPlaceholder="Search users by email..."
        advancedFilters={[
          {
            key: 'status',
            label: 'Status',
            options: [
              { value: 'all', label: 'All Users' },
              { value: 'active', label: 'Active Only' },
              { value: 'inactive', label: 'Inactive Only' },
            ],
          },
          {
            key: 'role',
            label: 'Role',
            options: [
              { value: 'all', label: 'All Roles' },
              { value: 'superadmin', label: 'Superadmin' },
              { value: 'coordinator', label: 'Coordinator' },
              { value: 'pastor', label: 'Pastor' },
              { value: 'bibleworker', label: 'Bible Worker' },
              { value: 'church_secretary', label: 'Church Secretary' },
            ],
          },
        ]}
        basePath="/settings/users"
      />

      {/* Users Table */}
      <Suspense fallback={<UsersTableSkeleton />}>
        <UsersTableWrapper
          page={page}
          limit={limit}
          offset={offset}
          roleFilter={roleFilter}
          searchQuery={searchQuery}
          statusFilter={statusFilter}
          churches={churches}
        />
      </Suspense>
    </div>
  )
}

async function UsersTableWrapper({
  page,
  limit,
  offset,
  roleFilter,
  searchQuery,
  statusFilter,
  churches,
}: {
  page: number
  limit: number
  offset: number
  roleFilter?: string
  searchQuery?: string
  statusFilter?: string
  churches: Array<{ id: string; name: string; district: string; field: string }>
}) {
  // Determine show_inactive based on status filter
  const showInactive = statusFilter === 'all' || statusFilter === 'inactive'

  // Fetch users with search and filters
  const { data: users, count } = await getUsers({
    limit,
    offset,
    role: roleFilter as 'superadmin' | 'coordinator' | 'pastor' | 'bibleworker' | 'church_secretary' | undefined,
    query: searchQuery,
    show_inactive: showInactive,
  })

  // Filter by active/inactive if specific status selected
  const filteredUsers = statusFilter === 'inactive'
    ? users.filter(u => !u.is_active)
    : statusFilter === 'active'
    ? users.filter(u => u.is_active)
    : users

  const totalPages = Math.ceil(count / limit)

  return (
    <div>
      <UsersTable
        users={filteredUsers}
        churches={churches}
        currentPage={page}
        totalPages={totalPages}
        totalCount={filteredUsers.length}
      />
    </div>
  )
}

function UsersTableSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="animate-pulse flex items-center gap-4 border-b pb-3">
          <div className="h-12 w-12 bg-gray-200 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-48 bg-gray-200 rounded" />
            <div className="h-3 w-32 bg-gray-200 rounded" />
          </div>
        </div>
      ))}
    </div>
  )
}
