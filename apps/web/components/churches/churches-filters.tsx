'use client'

import { useMemo } from 'react'
import { PageFilters, type FilterField } from '@/components/shared'

interface ChurchesFiltersProps {
  fields: string[]
  districts: string[]
}

export function ChurchesFilters({ fields, districts }: ChurchesFiltersProps) {
  const churchFilters: FilterField[] = useMemo(
    () => [
      {
        key: 'field',
        label: 'Field',
        options: [{ value: 'all', label: 'All Fields' }, ...fields.map((f) => ({ value: f, label: f }))],
        placeholder: 'All Fields',
      },
      {
        key: 'district',
        label: 'District',
        options: [{ value: 'all', label: 'All Districts' }, ...districts.map((d) => ({ value: d, label: d }))],
        placeholder: 'All Districts',
      },
      {
        key: 'is_active',
        label: 'Status',
        options: [
          { value: 'all', label: 'All' },
          { value: 'true', label: 'Active' },
          { value: 'false', label: 'Inactive' },
        ],
        placeholder: 'All',
      },
    ],
    [fields, districts]
  )

  return (
    <PageFilters
      searchPlaceholder="Search by church name..."
      advancedFilters={churchFilters}
      basePath="/churches"
    />
  )
}
