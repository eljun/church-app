'use client'

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
import { useState } from 'react'

interface AttendanceFiltersProps {
  searchQuery: string
  onSearchChange: (value: string) => void
  filterChurch: string
  onChurchChange: (value: string) => void
  filterDistrict: string
  onDistrictChange: (value: string) => void
  filterStatus: string
  onStatusChange: (value: string) => void
  churches: { id: string; name: string }[]
  districts: string[]
  activeFiltersCount: number
  onClearFilters: () => void
}

export function AttendanceFilters({
  searchQuery,
  onSearchChange,
  filterChurch,
  onChurchChange,
  filterDistrict,
  onDistrictChange,
  filterStatus,
  onStatusChange,
  churches,
  districts,
  activeFiltersCount,
  onClearFilters,
}: AttendanceFiltersProps) {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false)
  const hasActiveFilters = activeFiltersCount > 0

  return (
    <div className="bg-white border border-primary/15 p-4">
      <div className="flex flex-col gap-4">
        {/* Search */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search by member name..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9"
            />
          </div>
          {hasActiveFilters && (
            <Button
              type="button"
              variant="outline"
              onClick={onClearFilters}
            >
              <X className="mr-2 h-4 w-4" />
              Clear
            </Button>
          )}
        </div>

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
            {/* Church Filter */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Church
              </label>
              <Select value={filterChurch} onValueChange={onChurchChange}>
                <SelectTrigger>
                  <SelectValue placeholder="All Churches" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Churches</SelectItem>
                  {churches.map(church => (
                    <SelectItem key={church.id} value={church.id}>
                      {church.name}
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
              <Select value={filterDistrict} onValueChange={onDistrictChange}>
                <SelectTrigger>
                  <SelectValue placeholder="All Districts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Districts</SelectItem>
                  {districts.map(district => (
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
              <Select value={filterStatus} onValueChange={onStatusChange}>
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="registered">Registered (Pending)</SelectItem>
                  <SelectItem value="attended">Attended</SelectItem>
                  <SelectItem value="no_show">No Show</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Active filters count */}
        {hasActiveFilters && (
          <p className="text-sm text-gray-500">
            {activeFiltersCount} filter(s) active
          </p>
        )}
      </div>
    </div>
  )
}
