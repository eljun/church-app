import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfQuarter,
  endOfQuarter,
  startOfYear,
  endOfYear,
  subDays,
} from 'date-fns'

export type DateRangeType = 'week' | 'month' | 'quarter' | 'year'

export interface DateRangeResult {
  startDate: string
  endDate: string
  label: string
  daysCount: number
}

export function getDateRange(rangeType: DateRangeType = 'month'): DateRangeResult {
  const now = new Date()
  let start: Date
  let end: Date
  let label: string
  let daysCount: number

  switch (rangeType) {
    case 'week':
      start = startOfWeek(now)
      end = endOfWeek(now)
      label = `Week of ${format(start, 'MMM d, yyyy')}`
      daysCount = 7
      break

    case 'month':
      start = startOfMonth(now)
      end = endOfMonth(now)
      label = format(now, 'MMMM yyyy')
      daysCount = 30
      break

    case 'quarter':
      start = startOfQuarter(now)
      end = endOfQuarter(now)
      const quarter = Math.floor(now.getMonth() / 3) + 1
      label = `Q${quarter} ${format(now, 'yyyy')}`
      daysCount = 90
      break

    case 'year':
      start = startOfYear(now)
      end = endOfYear(now)
      label = format(now, 'yyyy')
      daysCount = 365
      break

    default:
      start = startOfMonth(now)
      end = endOfMonth(now)
      label = format(now, 'MMMM yyyy')
      daysCount = 30
  }

  return {
    startDate: format(start, 'yyyy-MM-dd'),
    endDate: format(end, 'yyyy-MM-dd'),
    label,
    daysCount,
  }
}

export function getRecentDateRange(days: number): DateRangeResult {
  const now = new Date()
  const start = subDays(now, days)

  return {
    startDate: format(start, 'yyyy-MM-dd'),
    endDate: format(now, 'yyyy-MM-dd'),
    label: `Last ${days} days`,
    daysCount: days,
  }
}
