'use client'

import { PageFilters, type FilterField } from '@/components/shared'

const eventFilters: FilterField[] = [
  {
    key: 'event_type',
    label: 'Event Type',
    options: [
      { value: 'all', label: 'All' },
      { value: 'service', label: 'Service' },
      { value: 'baptism', label: 'Baptism' },
      { value: 'conference', label: 'Conference' },
      { value: 'social', label: 'Social' },
      { value: 'other', label: 'Other' },
    ],
    placeholder: 'All',
  },
  {
    key: 'is_public',
    label: 'Visibility',
    options: [
      { value: 'all', label: 'All' },
      { value: 'true', label: 'Public' },
      { value: 'false', label: 'Private' },
    ],
    placeholder: 'All',
  },
  {
    key: 'time_filter',
    label: 'Time Period',
    options: [
      { value: 'all', label: 'All Events' },
      { value: 'upcoming', label: 'Upcoming' },
      { value: 'past', label: 'Past' },
    ],
    placeholder: 'All',
  },
]

export function EventsFilters() {
  return (
    <PageFilters
      searchPlaceholder="Search events by title..."
      advancedFilters={eventFilters}
      basePath="/events"
    />
  )
}
