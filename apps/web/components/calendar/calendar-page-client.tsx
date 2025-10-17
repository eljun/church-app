'use client'

import { useState } from 'react'
import { CalendarView } from '@/components/calendar/calendar-view'
import { CalendarFilters } from '@/components/calendar/calendar-filters'
import type { CalendarItem } from '@/lib/queries/calendar'

interface CalendarPageClientProps {
  initialItems: Record<string, CalendarItem[]>
  initialMonth: string
}

export function CalendarPageClient({ initialItems, initialMonth }: CalendarPageClientProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date(initialMonth))
  const [items, setItems] = useState(initialItems)
  const [showEvents, setShowEvents] = useState(true)
  const [showBirthdays, setShowBirthdays] = useState(true)
  const [showBaptisms, setShowBaptisms] = useState(true)

  // Filter items based on toggles
  const filteredItems: Record<string, CalendarItem[]> = {}

  Object.entries(items).forEach(([date, dateItems]) => {
    const filtered = dateItems.filter(item => {
      if (item.type === 'event' && !showEvents) return false
      if (item.type === 'birthday' && !showBirthdays) return false
      if (item.type === 'baptism' && !showBaptisms) return false
      return true
    })

    if (filtered.length > 0) {
      filteredItems[date] = filtered
    }
  })

  const handleMonthChange = async (newMonth: Date) => {
    setCurrentMonth(newMonth)

    // Fetch new data for the new month
    const start = new Date(newMonth.getFullYear(), newMonth.getMonth(), 1)
      .toISOString().split('T')[0]
    const end = new Date(newMonth.getFullYear(), newMonth.getMonth() + 1, 0)
      .toISOString().split('T')[0]

    try {
      const response = await fetch(
        `/api/calendar?start=${start}&end=${end}`
      )
      const data = await response.json()
      setItems(data)
    } catch (error) {
      console.error('Error fetching calendar items:', error)
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-[250px_1fr]">
      {/* Filters sidebar */}
      <div>
        <CalendarFilters
          showEvents={showEvents}
          showBirthdays={showBirthdays}
          showBaptisms={showBaptisms}
          onToggleEvents={setShowEvents}
          onToggleBirthdays={setShowBirthdays}
          onToggleBaptisms={setShowBaptisms}
        />
      </div>

      {/* Calendar view */}
      <div>
        <CalendarView
          items={filteredItems}
          currentMonth={currentMonth}
          onMonthChange={handleMonthChange}
        />
      </div>
    </div>
  )
}
