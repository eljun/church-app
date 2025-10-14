import { Suspense } from 'react'
import Link from 'next/link'
import { PlusIcon, CalendarDays, Grid3x3, List } from 'lucide-react'
import { getEvents } from '@/lib/queries/events'
import { EventsTable } from '@/components/events/events-table'
import { EventsFilters } from '@/components/events/events-filters'
import { EventCard } from '@/components/events/event-card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { SearchEventsInput } from '@/lib/validations/event'

interface EventsPageProps {
  searchParams: Promise<{
    query?: string
    church_id?: string
    event_type?: 'service' | 'baptism' | 'conference' | 'social' | 'other'
    is_public?: string
    time_filter?: 'upcoming' | 'past' | 'all'
    page?: string
    view?: 'list' | 'grid'
  }>
}

export default async function EventsPage({ searchParams }: EventsPageProps) {
  const params = await searchParams
  const page = parseInt(params.page || '1')
  const limit = 50
  const offset = (page - 1) * limit
  const view = params.view || 'list'

  // Build filter params
  const filters: SearchEventsInput = {
    query: params.query,
    church_id: params.church_id,
    event_type: params.event_type,
    is_public: params.is_public === 'true' ? true : params.is_public === 'false' ? false : undefined,
    limit,
    offset,
  }

  // Handle time filter
  if (params.time_filter === 'upcoming') {
    filters.start_date = new Date().toISOString()
  } else if (params.time_filter === 'past') {
    filters.end_date = new Date().toISOString()
  }

  // Fetch events
  const { data: events, count } = await getEvents(filters)

  const totalPages = Math.ceil(count / limit)

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl  text-primary">Events & Activities</h1>
          <p className="mt-1 text-sm text-foreground">
            Manage church events and activities ({count.toLocaleString()} total)
          </p>
        </div>
        <Button asChild>
          <Link href="/events/new">
            <PlusIcon className="mr-2 h-4 w-4" />
            Create Event
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Suspense fallback={<div className="h-20 animate-pulse bg-gray-100 rounded-lg" />}>
        <EventsFilters />
      </Suspense>

      {/* View Toggle */}
      <Tabs defaultValue={view} className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="list" asChild>
              <Link href={`/events?${new URLSearchParams({ ...params, view: 'list' } as Record<string, string>).toString()}`}>
                <List className="h-4 w-4 mr-2" />
                List View
              </Link>
            </TabsTrigger>
            <TabsTrigger value="grid" asChild>
              <Link href={`/events?${new URLSearchParams({ ...params, view: 'grid' } as Record<string, string>).toString()}`}>
                <Grid3x3 className="h-4 w-4 mr-2" />
                Grid View
              </Link>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* List View */}
        <TabsContent value="list" className="space-y-4">
          <Suspense fallback={<div className="h-96 animate-pulse bg-gray-100 rounded-lg" />}>
            <EventsTable
              events={events}
              currentPage={page}
              totalPages={totalPages}
              totalCount={count}
            />
          </Suspense>
        </TabsContent>

        {/* Grid View */}
        <TabsContent value="grid" className="space-y-4">
          <Suspense fallback={<div className="h-96 animate-pulse bg-gray-100 rounded-lg" />}>
            {events.length === 0 ? (
              <div className="text-center py-12 bg-white border border-primary/20 rounded-lg">
                <CalendarDays className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-semibold text-gray-900">No events found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by creating a new event.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            )}
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  )
}
