'use client'

import { PageFilters, type FilterField } from '@/components/shared'

const visitorFilters: FilterField[] = [
  {
    key: 'visitor_type',
    label: 'Visitor Type',
    options: [
      { value: 'all', label: 'All' },
      { value: 'adult', label: 'Adult' },
      { value: 'youth', label: 'Youth' },
      { value: 'child', label: 'Child' },
    ],
  },
  {
    key: 'follow_up_status',
    label: 'Follow-up Status',
    options: [
      { value: 'all', label: 'All' },
      { value: 'pending', label: 'Pending' },
      { value: 'contacted', label: 'Contacted' },
      { value: 'interested', label: 'Interested' },
      { value: 'not_interested', label: 'Not Interested' },
      { value: 'converted', label: 'Converted' },
    ],
  },
  {
    key: 'referral_source',
    label: 'Referral Source',
    options: [
      { value: 'all', label: 'All' },
      { value: 'member_invitation', label: 'Member Invitation' },
      { value: 'online', label: 'Online' },
      { value: 'walk_in', label: 'Walk-in' },
      { value: 'social_media', label: 'Social Media' },
      { value: 'other', label: 'Other' },
    ],
  },
]

export function VisitorsFilters() {
  return (
    <PageFilters
      searchPlaceholder="Search by name, phone, or email..."
      advancedFilters={visitorFilters}
      basePath="/visitors"
    />
  )
}
