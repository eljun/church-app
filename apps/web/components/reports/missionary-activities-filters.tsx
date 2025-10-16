'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Calendar, Filter, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ChurchSelect } from '@/components/shared'
import type { Church } from '@church-app/database'

interface MissionaryActivitiesFiltersProps {
  churches: Church[]
  userRole: string
  userChurchId: string | null
  currentFilters: {
    church_id?: string
    start_date?: string
    end_date?: string
    report_type?: string
    period?: string
  }
}

export function MissionaryActivitiesFilters({
  churches,
  userRole,
  userChurchId,
  currentFilters,
}: MissionaryActivitiesFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [filters, setFilters] = useState({
    church_id: currentFilters.church_id || '',
    start_date: currentFilters.start_date || '',
    end_date: currentFilters.end_date || '',
    report_type: currentFilters.report_type || '',
    period: currentFilters.period || 'month',
  })

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      // If period changes to something other than custom, clear custom dates
      ...(key === 'period' && value !== 'custom' ? { start_date: '', end_date: '' } : {}),
    }))
  }

  const applyFilters = () => {
    const params = new URLSearchParams(searchParams.toString())

    // Clear all existing filter params
    params.delete('church_id')
    params.delete('start_date')
    params.delete('end_date')
    params.delete('report_type')
    params.delete('period')
    params.delete('page')

    // Add new filter params
    if (filters.church_id) params.set('church_id', filters.church_id)
    if (filters.report_type) params.set('report_type', filters.report_type)
    if (filters.period) params.set('period', filters.period)

    // Only add custom dates if period is custom
    if (filters.period === 'custom') {
      if (filters.start_date) params.set('start_date', filters.start_date)
      if (filters.end_date) params.set('end_date', filters.end_date)
    }

    router.push(`/reports/missionary-activities?${params.toString()}`)
  }

  const clearFilters = () => {
    setFilters({
      church_id: userRole === 'admin' && userChurchId ? userChurchId : '',
      start_date: '',
      end_date: '',
      report_type: '',
      period: 'month',
    })
    router.push('/reports/missionary-activities')
  }

  const hasActiveFilters =
    !!filters.church_id ||
    !!filters.report_type ||
    (filters.period && filters.period !== 'month') ||
    (filters.period === 'custom' && (!!filters.start_date || !!filters.end_date))

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Church Filter (not for admins) */}
            {userRole !== 'admin' && (
              <div className="space-y-2">
                <Label>Church</Label>
                <ChurchSelect
                  churches={churches}
                  value={filters.church_id}
                  onValueChange={(value) => handleFilterChange('church_id', value)}
                  placeholder="All Churches"
                  allowEmpty
                />
              </div>
            )}

            {/* Period Filter */}
            <div className="space-y-2">
              <Label>Time Period</Label>
              <Select value={filters.period} onValueChange={(value) => handleFilterChange('period', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Last 7 Days</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="quarter">This Quarter</SelectItem>
                  <SelectItem value="year">This Year</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Report Type Filter */}
            <div className="space-y-2">
              <Label>Report Type</Label>
              <Select value={filters.report_type || 'all'} onValueChange={(value) => handleFilterChange('report_type', value === 'all' ? '' : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="biennial">Biennial</SelectItem>
                  <SelectItem value="triennial">Triennial</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Custom Date Range (only show if period is custom) */}
          {filters.period === 'custom' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="start_date">Start Date</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="start_date"
                    type="date"
                    value={filters.start_date}
                    onChange={(e) => handleFilterChange('start_date', e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_date">End Date</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="end_date"
                    type="date"
                    value={filters.end_date}
                    onChange={(e) => handleFilterChange('end_date', e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-2">
            <Button onClick={applyFilters}>
              <Filter className="mr-2 h-4 w-4" />
              Apply Filters
            </Button>
            {hasActiveFilters && (
              <Button variant="outline" onClick={clearFilters}>
                <X className="mr-2 h-4 w-4" />
                Clear Filters
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
