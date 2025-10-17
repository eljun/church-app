import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
} from 'date-fns'

/**
 * Get all days to display in a calendar month grid (including padding days)
 */
export function getCalendarDays(date: Date): Date[] {
  const monthStart = startOfMonth(date)
  const monthEnd = endOfMonth(date)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 }) // Sunday
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })

  return eachDayOfInterval({ start: calendarStart, end: calendarEnd })
}

/**
 * Get start and end dates for a month
 */
export function getMonthRange(date: Date): { start: string; end: string } {
  const start = startOfMonth(date)
  const end = endOfMonth(date)

  return {
    start: format(start, 'yyyy-MM-dd'),
    end: format(end, 'yyyy-MM-dd'),
  }
}

/**
 * Check if a date is in the current month
 */
export function isInMonth(date: Date, currentMonth: Date): boolean {
  return isSameMonth(date, currentMonth)
}

/**
 * Check if a date is today
 */
export function isToday(date: Date): boolean {
  return isSameDay(date, new Date())
}

/**
 * Format date for display
 */
export function formatCalendarDate(date: Date, formatStr: string = 'yyyy-MM-dd'): string {
  return format(date, formatStr)
}

/**
 * Get previous month
 */
export function getPreviousMonth(date: Date): Date {
  return subMonths(date, 1)
}

/**
 * Get next month
 */
export function getNextMonth(date: Date): Date {
  return addMonths(date, 1)
}

/**
 * Get month name and year for display
 */
export function getMonthYearDisplay(date: Date): string {
  return format(date, 'MMMM yyyy')
}

/**
 * Get day of month number
 */
export function getDayOfMonth(date: Date): number {
  return date.getDate()
}

/**
 * Get weekday names
 */
export function getWeekdayNames(short: boolean = false): string[] {
  if (short) {
    return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  }
  return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
}
