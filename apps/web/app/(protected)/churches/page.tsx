import { Suspense } from 'react'
import Link from 'next/link'
import { PlusIcon } from 'lucide-react'
import { getChurches, getFields, getDistricts } from '@/lib/queries/churches'
import { ChurchesTable } from '@/components/churches/churches-table'
import { ChurchesFilters } from '@/components/churches/churches-filters'
import { Button } from '@/components/ui/button'
import type { SearchChurchesInput } from '@/lib/validations/church'

interface ChurchesPageProps {
  searchParams: Promise<{
    query?: string
    field?: string
    district?: string
    is_active?: string
    page?: string
  }>
}

export default async function ChurchesPage({ searchParams }: ChurchesPageProps) {
  const params = await searchParams
  const page = parseInt(params.page || '1')
  const limit = 50
  const offset = (page - 1) * limit

  // Build filter params
  const filters: SearchChurchesInput = {
    query: params.query,
    field: params.field,
    district: params.district,
    is_active: params.is_active === 'true' ? true : params.is_active === 'false' ? false : undefined,
    limit,
    offset,
  }

  // Fetch churches and filter options
  const [{ data: churches, count }, fields, districts] = await Promise.all([
    getChurches(filters),
    getFields(),
    getDistricts(),
  ])

  const totalPages = Math.ceil(count / limit)

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold ">Churches</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage churches in the organization ({count.toLocaleString()} total)
          </p>
        </div>
        <Button asChild>
          <Link href="/churches/new">
            <PlusIcon className="mr-2 h-4 w-4" />
            Add Church
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Suspense fallback={<div className="h-20 animate-pulse bg-gray-100 rounded-lg" />}>
        <ChurchesFilters fields={fields} districts={districts} />
      </Suspense>

      {/* Churches table */}
      <Suspense fallback={<div className="h-96 animate-pulse bg-gray-100 rounded-lg" />}>
        <ChurchesTable
          churches={churches}
          currentPage={page}
          totalPages={totalPages}
          totalCount={count}
        />
      </Suspense>
    </div>
  )
}
