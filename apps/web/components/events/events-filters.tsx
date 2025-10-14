'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Search, X, ChevronDown, ChevronUp } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { useState, useTransition } from 'react'

export function EventsFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false)

  const [query, setQuery] = useState(searchParams.get('query') || '')

  const updateFilters = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())

    if (value && value !== 'all') {
      params.set(key, value)
    } else {
      params.delete(key)
    }

    // Reset to page 1 when filters change
    params.delete('page')

    startTransition(() => {
      router.push(`/events?${params.toString()}`)
    })
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    updateFilters('query', query)
  }

  const clearFilters = () => {
    setQuery('')
    startTransition(() => {
      router.push('/events')
    })
  }

  const hasActiveFilters = Array.from(searchParams.keys()).length > 0

  return (
    <div className="bg-white border border-primary/15 p-4">
      <div className="flex flex-col gap-4">
        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search events by title..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button type="submit" variant="outline" disabled={isPending}>
            Search
          </Button>
          {hasActiveFilters && (
            <Button
              type="button"
              variant="outline"
              onClick={clearFilters}
              disabled={isPending}
            >
              <X className="mr-2 h-4 w-4" />
              Clear
            </Button>
          )}
        </form>

        {/* Advanced Filter Toggle */}
        <button
          type="button"
          onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
          className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
        >
          Advanced Filter
          {isAdvancedOpen ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>

        {/* Collapsible Filters */}
        {isAdvancedOpen && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {/* Event Type */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Event Type
              </label>
              <Select
                value={searchParams.get('event_type') || 'all'}
                onValueChange={(value) => updateFilters('event_type', value)}
                disabled={isPending}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="service">Service</SelectItem>
                  <SelectItem value="baptism">Baptism</SelectItem>
                  <SelectItem value="conference">Conference</SelectItem>
                  <SelectItem value="social">Social</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Visibility */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Visibility
              </label>
              <Select
                value={searchParams.get('is_public') || 'all'}
                onValueChange={(value) => updateFilters('is_public', value)}
                disabled={isPending}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="true">Public</SelectItem>
                  <SelectItem value="false">Private</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Time Filter */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Time Period
              </label>
              <Select
                value={searchParams.get('time_filter') || 'all'}
                onValueChange={(value) => updateFilters('time_filter', value)}
                disabled={isPending}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Events</SelectItem>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="past">Past</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Active filters count */}
        {hasActiveFilters && (
          <p className="text-sm text-gray-500">
            {Array.from(searchParams.keys()).length} filter(s) active
          </p>
        )}
      </div>
    </div>
  )
}
