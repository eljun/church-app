import { createClient } from '@/lib/supabase/server'

export type CalendarItemType = 'event' | 'birthday' | 'baptism'

export interface CalendarItem {
  id: string
  type: CalendarItemType
  date: string // YYYY-MM-DD format
  title: string
  description?: string
  church?: { id: string; name: string }
  member?: { id: string; name: string }
  metadata?: {
    age?: number // for birthdays
    years?: number // for baptism anniversaries
    eventType?: string // for events
  }
}

export interface CalendarFilters {
  showEvents?: boolean
  showBirthdays?: boolean
  showBaptisms?: boolean
  churchId?: string
}

/**
 * Get events for calendar view
 */
async function getEventsForCalendar(
  startDate: string,
  endDate: string,
  churchId?: string
): Promise<CalendarItem[]> {
  const supabase = await createClient()

  let query = supabase
    .from('events')
    .select(`
      id,
      title,
      description,
      start_date,
      event_type,
      church_id,
      churches (
        id,
        name
      )
    `)
    .gte('start_date', startDate)
    .lte('start_date', endDate)
    .order('start_date', { ascending: true })

  if (churchId) {
    query = query.eq('church_id', churchId)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching events for calendar:', error)
    return []
  }

  return (data || []).map((event) => {
    const church = Array.isArray(event.churches) ? event.churches[0] : event.churches
    return {
      id: event.id,
      type: 'event' as const,
      date: event.start_date.split('T')[0], // Extract just the date part
      title: event.title,
      description: event.description || undefined,
      church: church ? { id: church.id, name: church.name } : undefined,
      metadata: {
        eventType: event.event_type,
      },
    }
  })
}

/**
 * Get birthdays for calendar view (handles recurring yearly dates)
 */
async function getBirthdaysForCalendar(
  startDate: string,
  endDate: string,
  churchId?: string
): Promise<CalendarItem[]> {
  const supabase = await createClient()

  let query = supabase
    .from('members')
    .select(`
      id,
      full_name,
      birthday,
      age,
      church_id,
      churches:church_id (
        id,
        name
      )
    `)
    .not('birthday', 'is', null)
    .eq('status', 'active')

  if (churchId) {
    query = query.eq('church_id', churchId)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching birthdays for calendar:', error)
    return []
  }

  const start = new Date(startDate)
  const end = new Date(endDate)

  // Filter and map birthdays that fall within the date range
  const items: CalendarItem[] = []

  for (const member of data || []) {
    const birthday = new Date(member.birthday!)
    const church = Array.isArray(member.churches) ? member.churches[0] : member.churches

    // Calculate next birthday occurrence within the range
    const nextBirthday = getNextOccurrence(birthday, start, end)
    if (!nextBirthday) continue

    items.push({
      id: `birthday-${member.id}`,
      type: 'birthday',
      date: nextBirthday.toISOString().split('T')[0],
      title: `${member.full_name}'s Birthday`,
      member: { id: member.id, name: member.full_name },
      church: church ? { id: church.id, name: church.name } : undefined,
      metadata: {
        age: member.age || undefined,
      },
    })
  }

  return items
}

/**
 * Get baptism anniversaries for calendar view (handles recurring yearly dates)
 */
async function getBaptismsForCalendar(
  startDate: string,
  endDate: string,
  churchId?: string
): Promise<CalendarItem[]> {
  const supabase = await createClient()

  let query = supabase
    .from('members')
    .select(`
      id,
      full_name,
      date_of_baptism,
      church_id,
      churches:church_id (
        id,
        name
      )
    `)
    .not('date_of_baptism', 'is', null)
    .eq('status', 'active')

  if (churchId) {
    query = query.eq('church_id', churchId)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching baptisms for calendar:', error)
    return []
  }

  const start = new Date(startDate)
  const end = new Date(endDate)
  const today = new Date()

  // Filter and map baptism anniversaries that fall within the date range
  const items: CalendarItem[] = []

  for (const member of data || []) {
    const baptismDate = new Date(member.date_of_baptism!)
    const church = Array.isArray(member.churches) ? member.churches[0] : member.churches

    // Calculate next anniversary occurrence within the range
    const nextAnniversary = getNextOccurrence(baptismDate, start, end)
    if (!nextAnniversary) continue

    // Calculate years since baptism
    const yearsSince = today.getFullYear() - baptismDate.getFullYear()

    items.push({
      id: `baptism-${member.id}`,
      type: 'baptism',
      date: nextAnniversary.toISOString().split('T')[0],
      title: `${member.full_name} - Baptism Anniversary`,
      member: { id: member.id, name: member.full_name },
      church: church ? { id: church.id, name: church.name } : undefined,
      metadata: {
        years: yearsSince,
      },
    })
  }

  return items
}

/**
 * Helper function to get the next occurrence of a recurring date within a range
 */
function getNextOccurrence(
  originalDate: Date,
  rangeStart: Date,
  rangeEnd: Date
): Date | null {
  const month = originalDate.getMonth()
  const day = originalDate.getDate()

  // Check current year
  const currentYearDate = new Date(rangeStart.getFullYear(), month, day)
  if (currentYearDate >= rangeStart && currentYearDate <= rangeEnd) {
    return currentYearDate
  }

  // Check next year
  const nextYearDate = new Date(rangeStart.getFullYear() + 1, month, day)
  if (nextYearDate >= rangeStart && nextYearDate <= rangeEnd) {
    return nextYearDate
  }

  // Check previous year (in case range spans across year boundary)
  const prevYearDate = new Date(rangeStart.getFullYear() - 1, month, day)
  if (prevYearDate >= rangeStart && prevYearDate <= rangeEnd) {
    return prevYearDate
  }

  return null
}

/**
 * Get all calendar items for a date range
 */
export async function getCalendarItems(
  startDate: string,
  endDate: string,
  filters: CalendarFilters = {}
): Promise<CalendarItem[]> {
  const {
    showEvents = true,
    showBirthdays = true,
    showBaptisms = true,
    churchId,
  } = filters

  // Fetch all data types in parallel
  const [events, birthdays, baptisms] = await Promise.all([
    showEvents ? getEventsForCalendar(startDate, endDate, churchId) : [],
    showBirthdays ? getBirthdaysForCalendar(startDate, endDate, churchId) : [],
    showBaptisms ? getBaptismsForCalendar(startDate, endDate, churchId) : [],
  ])

  // Combine and sort by date
  const allItems = [...events, ...birthdays, ...baptisms]
  return allItems.sort((a, b) => a.date.localeCompare(b.date))
}

/**
 * Get calendar items grouped by date
 */
export async function getCalendarItemsByDate(
  startDate: string,
  endDate: string,
  filters: CalendarFilters = {}
): Promise<Record<string, CalendarItem[]>> {
  const items = await getCalendarItems(startDate, endDate, filters)

  // Group by date
  return items.reduce((acc, item) => {
    if (!acc[item.date]) {
      acc[item.date] = []
    }
    acc[item.date].push(item)
    return acc
  }, {} as Record<string, CalendarItem[]>)
}
