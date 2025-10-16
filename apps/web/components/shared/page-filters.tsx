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

export interface FilterOption {
  value: string
  label: string
}

export interface FilterField {
  key: string
  label: string
  options: FilterOption[] | string[] // Support both array of objects or array of strings
  placeholder?: string
}

interface PageFiltersProps {
  searchPlaceholder?: string
  advancedFilters?: FilterField[]
  basePath: string // e.g., '/members', '/visitors'
  className?: string
}

export function PageFilters({
  searchPlaceholder = 'Search...',
  advancedFilters = [],
  basePath,
  className = '',
}: PageFiltersProps) {
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
      router.push(`${basePath}?${params.toString()}`)
    })
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    updateFilters('query', query)
  }

  const clearFilters = () => {
    setQuery('')
    startTransition(() => {
      router.push(basePath)
    })
  }

  const hasActiveFilters = Array.from(searchParams.keys()).length > 0

  return (
    <div className={`bg-white border border-primary/15 p-4 ${className}`}>
      <div className="flex flex-col gap-4">
        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder={searchPlaceholder}
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
        {advancedFilters.length > 0 && (
          <>
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
              <div className="grid gap-4 pt-2" style={{ gridTemplateColumns: `repeat(${advancedFilters.length}, 1fr)` }}>
                {advancedFilters.map((filter) => (
                  <div key={filter.key} className="w-full">
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      {filter.label}
                    </label>
                    <Select
                      value={searchParams.get(filter.key) || 'all'}
                      onValueChange={(value) => updateFilters(filter.key, value)}
                      disabled={isPending}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={filter.placeholder || 'All'}/>
                      </SelectTrigger>
                      <SelectContent className="w-full">
                        {filter.options.map((option) => {
                          const isStringArray = typeof option === 'string'
                          const optionValue = isStringArray ? option : option.value
                          const optionLabel = isStringArray ? option : option.label

                          return (
                            <SelectItem key={optionValue} value={optionValue}>
                              {optionLabel}
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            )}
          </>
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
