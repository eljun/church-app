import { Suspense } from 'react'
import Link from 'next/link'
import { PlusIcon } from 'lucide-react'
import { getMembers } from '@/lib/queries/members'
import { MembersTable } from '@/components/members/members-table'
import { MembersFilters } from '@/components/members/members-filters'
import { Button } from '@/components/ui/button'
import type { SearchMembersInput } from '@/lib/validations/member'

interface MembersPageProps {
  searchParams: Promise<{
    query?: string
    church_id?: string
    spiritual_condition?: 'active' | 'inactive'
    status?: 'active' | 'transferred_out' | 'resigned' | 'disfellowshipped' | 'deceased'
    page?: string
  }>
}

export default async function MembersPage({ searchParams }: MembersPageProps) {
  const params = await searchParams
  const page = parseInt(params.page || '1')
  const limit = 50
  const offset = (page - 1) * limit

  // Build filter params
  const filters: SearchMembersInput = {
    query: params.query,
    church_id: params.church_id,
    spiritual_condition: params.spiritual_condition,
    status: params.status,
    limit,
    offset,
  }

  // Fetch members
  const { data: members, count } = await getMembers(filters)

  const totalPages = Math.ceil(count / limit)

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-gray-900">Members</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your church members ({count.toLocaleString()} total)
          </p>
        </div>
        <Button asChild>
          <Link href="/members/new">
            <PlusIcon className="mr-2 h-4 w-4" />
            Add Member
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Suspense fallback={<div className="h-20 animate-pulse bg-gray-100 rounded-lg" />}>
        <MembersFilters />
      </Suspense>

      {/* Members table */}
      <Suspense fallback={<div className="h-96 animate-pulse bg-gray-100 rounded-lg" />}>
        <MembersTable
          members={members}
          currentPage={page}
          totalPages={totalPages}
          totalCount={count}
        />
      </Suspense>
    </div>
  )
}
