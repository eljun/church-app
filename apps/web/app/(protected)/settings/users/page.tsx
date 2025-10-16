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
  searchParams: Promise<{ page?: string; role?: string; query?: string }>
}

export default async function UsersPage({ searchParams }: UsersPageProps) {
  const { page: pageParam, role: roleFilter, query: searchQuery } = await searchParams
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
            key: 'role',
            label: 'Role',
            options: [
              { value: 'all', label: 'All Roles' },
              { value: 'superadmin', label: 'Superadmin' },
              { value: 'coordinator', label: 'Coordinator' },
              { value: 'pastor', label: 'Pastor' },
              { value: 'bibleworker', label: 'Bible Worker' },
              { value: 'admin', label: 'Admin' },
              { value: 'member', label: 'Member' },
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
  churches,
}: {
  page: number
  limit: number
  offset: number
  roleFilter?: string
  searchQuery?: string
  churches: Array<{ id: string; name: string; district: string; field: string }>
}) {
  // Fetch users with search
  const { data: users, count } = await getUsers({
    limit,
    offset,
    role: roleFilter as 'superadmin' | 'coordinator' | 'pastor' | 'bibleworker' | 'admin' | 'member' | undefined,
    query: searchQuery,
  })

  const totalPages = Math.ceil(count / limit)

  return (
    <div>
      <UsersTable
        users={users}
        churches={churches}
        currentPage={page}
        totalPages={totalPages}
        totalCount={count}
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
