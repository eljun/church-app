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

interface ChurchesFiltersProps {
  fields: string[]
  districts: string[]
}

export function ChurchesFilters({ fields, districts }: ChurchesFiltersProps) {
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
      router.push(`/churches?${params.toString()}`)
    })
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    updateFilters('query', query)
  }

  const clearFilters = () => {
    setQuery('')
    startTransition(() => {
      router.push('/churches')
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
              placeholder="Search by church name..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button type="submit" variant="secondary" disabled={isPending}>
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
          {/* Field Filter */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Field
            </label>
            <Select
              value={searchParams.get('field') || 'all'}
              onValueChange={(value) => updateFilters('field', value)}
              disabled={isPending}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Fields" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Fields</SelectItem>
                {fields.map((field) => (
                  <SelectItem key={field} value={field}>
                    {field}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* District Filter */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              District
            </label>
            <Select
              value={searchParams.get('district') || 'all'}
              onValueChange={(value) => updateFilters('district', value)}
              disabled={isPending}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Districts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Districts</SelectItem>
                {districts.map((district) => (
                  <SelectItem key={district} value={district}>
                    {district}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Status
            </label>
            <Select
              value={searchParams.get('is_active') || 'all'}
              onValueChange={(value) => updateFilters('is_active', value)}
              disabled={isPending}
            >
              <SelectTrigger>
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="true">Active</SelectItem>
                <SelectItem value="false">Inactive</SelectItem>
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
