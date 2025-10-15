'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Calendar } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'

export type DateRange = 'week' | 'month' | 'quarter' | 'year'

interface DateFilterSelectProps {
  selectedRange?: DateRange
}

export function DateFilterSelect({ selectedRange = 'month' }: DateFilterSelectProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleRangeChange = (range: DateRange) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('range', range)
    router.push(`?${params.toString()}`)
  }

  return (
    <div className="w-48">
      <Label htmlFor="date-range-filter" className="text-sm font-medium mb-2 block">
        Date Range
      </Label>
      <Select value={selectedRange} onValueChange={handleRangeChange}>
        <SelectTrigger id="date-range-filter" className="w-full">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <SelectValue />
          </div>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="week">This Week</SelectItem>
          <SelectItem value="month">This Month</SelectItem>
          <SelectItem value="quarter">This Quarter</SelectItem>
          <SelectItem value="year">This Year</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
