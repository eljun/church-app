import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Users as UsersIcon, Shield, Crown, Church, BookOpen, UserCog } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getUsers, getUserStats } from '@/lib/queries/users'
import { getChurches } from '@/lib/queries/churches'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { UsersTable } from '@/components/settings/users/users-table'
import { CreateUserDialog } from '@/components/settings/users/create-user-dialog'

export const metadata = {
  title: 'User Management',
  description: 'Manage users, roles, and permissions',
}

interface UsersPageProps {
  searchParams: Promise<{ page?: string; role?: string }>
}

export default async function UsersPage({ searchParams }: UsersPageProps) {
  const { page: pageParam, role: roleFilter } = await searchParams
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
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Link>
            </Button>
          </div>
          <h1 className="font-display text-3xl text-primary">User Management</h1>
          <p className="text-sm text-muted-foreground">
            Manage users, roles, and permissions across the system
          </p>
        </div>
        <CreateUserDialog churches={churches} />
      </div>

      {/* Statistics */}
      <Suspense fallback={<StatsSkeleton />}>
        <UserStats />
      </Suspense>

      {/* Users Table */}
      <Suspense fallback={<UsersTableSkeleton />}>
        <UsersTableWrapper
          page={page}
          limit={limit}
          offset={offset}
          roleFilter={roleFilter}
          churches={churches}
        />
      </Suspense>
    </div>
  )
}

async function UserStats() {
  const stats = await getUserStats()

  const roleIcons = {
    superadmin: Crown,
    coordinator: UserCog,
    pastor: Church,
    bibleworker: BookOpen,
    admin: Shield,
    member: UsersIcon,
  }

  const roleColors = {
    superadmin: 'text-purple-600 bg-purple-50 border-purple-200',
    coordinator: 'text-blue-600 bg-blue-50 border-blue-200',
    pastor: 'text-green-600 bg-green-50 border-green-200',
    bibleworker: 'text-orange-600 bg-orange-50 border-orange-200',
    admin: 'text-indigo-600 bg-indigo-50 border-indigo-200',
    member: 'text-gray-600 bg-gray-50 border-gray-200',
  }

  return (
    <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-7">
      <Card className="border-primary/50 bg-primary/5">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Users</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <UsersIcon className="h-8 w-8 text-primary" />
          </div>
        </CardContent>
      </Card>

      {(Object.keys(roleIcons) as Array<keyof typeof roleIcons>).map((role) => {
        const Icon = roleIcons[role]
        const colorClass = roleColors[role]
        return (
          <Card key={role} className={`border ${colorClass}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground capitalize">
                    {role === 'bibleworker' ? 'Bible Worker' : role}
                  </p>
                  <p className="text-xl font-bold">{stats[role]}</p>
                </div>
                <Icon className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

async function UsersTableWrapper({
  page,
  limit,
  offset,
  roleFilter,
  churches,
}: {
  page: number
  limit: number
  offset: number
  roleFilter?: string
  churches: Array<{ id: string; name: string; district: string; field: string }>
}) {
  // Fetch users
  const { data: users, count } = await getUsers({
    limit,
    offset,
    role: roleFilter as 'superadmin' | 'coordinator' | 'pastor' | 'bibleworker' | 'admin' | 'member' | undefined,
  })

  const totalPages = Math.ceil(count / limit)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>System Users</CardTitle>
            <CardDescription>
              {count} total users • Page {page} of {totalPages}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <UsersTable
          users={users}
          churches={churches}
          currentPage={page}
          totalPages={totalPages}
          totalCount={count}
        />
      </CardContent>
    </Card>
  )
}

function StatsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-7">
      {[1, 2, 3, 4, 5, 6, 7].map((i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="animate-pulse space-y-2">
              <div className="h-4 w-16 bg-gray-200 rounded" />
              <div className="h-6 w-10 bg-gray-200 rounded" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function UsersTableSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="animate-pulse space-y-2">
          <div className="h-6 w-32 bg-gray-200 rounded" />
          <div className="h-4 w-48 bg-gray-200 rounded" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="animate-pulse flex items-center gap-4">
              <div className="h-12 w-12 bg-gray-200 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-48 bg-gray-200 rounded" />
                <div className="h-3 w-32 bg-gray-200 rounded" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
