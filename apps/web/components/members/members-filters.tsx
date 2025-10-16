'use client'

import { PageFilters, type FilterField } from '@/components/shared'

const memberFilters: FilterField[] = [
  {
    key: 'spiritual_condition',
    label: 'Spiritual Condition',
    options: [
      { value: 'all', label: 'All' },
      { value: 'active', label: 'Active' },
      { value: 'inactive', label: 'Inactive' },
    ],
  },
  {
    key: 'status',
    label: 'Status',
    options: [
      { value: 'all', label: 'All' },
      { value: 'active', label: 'Active' },
      { value: 'transferred_out', label: 'Transferred Out' },
      { value: 'resigned', label: 'Resigned' },
      { value: 'disfellowshipped', label: 'Disfellowshipped' },
      { value: 'deceased', label: 'Deceased' },
    ],
  },
  {
    key: 'physical_condition',
    label: 'Physical Condition',
    options: [
      { value: 'all', label: 'All' },
      { value: 'fit', label: 'Fit' },
      { value: 'sickly', label: 'Sickly' },
    ],
  },
]

export function MembersFilters() {
  return (
    <PageFilters
      searchPlaceholder="Search by name..."
      advancedFilters={memberFilters}
      basePath="/members"
    />
  )
}
