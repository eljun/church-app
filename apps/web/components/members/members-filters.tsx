'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Search, X } from 'lucide-react'
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

export function MembersFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

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
      router.push(`/members?${params.toString()}`)
    })
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    updateFilters('query', query)
  }

  const clearFilters = () => {
    setQuery('')
    startTransition(() => {
      router.push('/members')
    })
  }

  const hasActiveFilters = Array.from(searchParams.keys()).length > 0

  return (
    <div className="bg-white rounded-lg border p-4">
      <div className="flex flex-col gap-4">
        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search by name..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button type="submit" disabled={isPending}>
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

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Spiritual Condition */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Spiritual Condition
            </label>
            <Select
              value={searchParams.get('spiritual_condition') || 'all'}
              onValueChange={(value) => updateFilters('spiritual_condition', value)}
              disabled={isPending}
            >
              <SelectTrigger>
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Status */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Status
            </label>
            <Select
              value={searchParams.get('status') || 'all'}
              onValueChange={(value) => updateFilters('status', value)}
              disabled={isPending}
            >
              <SelectTrigger>
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="transferred_out">Transferred Out</SelectItem>
                <SelectItem value="resigned">Resigned</SelectItem>
                <SelectItem value="disfellowshipped">Disfellowshipped</SelectItem>
                <SelectItem value="deceased">Deceased</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Physical Condition */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Physical Condition
            </label>
            <Select
              value={searchParams.get('physical_condition') || 'all'}
              onValueChange={(value) => updateFilters('physical_condition', value)}
              disabled={isPending}
            >
              <SelectTrigger>
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="fit">Fit</SelectItem>
                <SelectItem value="sickly">Sickly</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

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
