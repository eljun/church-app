'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CalendarIcon, CakeIcon, CalendarHeartIcon, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { CalendarItem } from '@/lib/queries/calendar'
import {
  getCalendarDays,
  isInMonth,
  isToday,
  getDayOfMonth,
  getWeekdayNames,
  getPreviousMonth,
  getNextMonth,
  getMonthYearDisplay,
  formatCalendarDate,
} from '@/lib/utils/calendar-helpers'
import { cn } from '@/lib/utils'

interface CalendarViewProps {
  items: Record<string, CalendarItem[]>
  currentMonth: Date
  onMonthChange: (newMonth: Date) => void
}

export function CalendarView({ items, currentMonth, onMonthChange }: CalendarViewProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const days = getCalendarDays(currentMonth)
  const weekdays = getWeekdayNames(true)

  const handlePreviousMonth = () => {
    onMonthChange(getPreviousMonth(currentMonth))
  }

  const handleNextMonth = () => {
    onMonthChange(getNextMonth(currentMonth))
  }

  const handleToday = () => {
    onMonthChange(new Date())
  }

  const handleDayClick = (date: Date) => {
    const dateStr = formatCalendarDate(date)
    setSelectedDate(dateStr)
  }

  const getItemsForDate = (date: Date): CalendarItem[] => {
    const dateStr = formatCalendarDate(date)
    return items[dateStr] || []
  }

  const selectedDateItems = selectedDate ? items[selectedDate] || [] : []

  return (
    <div className="space-y-4">
      {/* Calendar header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">{getMonthYearDisplay(currentMonth)}</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="py-4" onClick={handleToday}>
            Today
          </Button>
          <Button variant="outline" size="icon" onClick={handlePreviousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Calendar grid */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-7 gap-1">
            {/* Weekday headers */}
            {weekdays.map((day) => (
              <div
                key={day}
                className="text-center text-sm font-medium text-muted-foreground py-2"
              >
                {day}
              </div>
            ))}

            {/* Calendar days */}
            {days.map((date) => {
              const dayItems = getItemsForDate(date)
              const isCurrentMonth = isInMonth(date, currentMonth)
              const isTodayDate = isToday(date)
              const isPastDate = date < new Date(new Date().setHours(0, 0, 0, 0))
              const hasItems = dayItems.length > 0

              return (
                <button
                  key={date.toISOString()}
                  onClick={() => handleDayClick(date)}
                  className={cn(
                    'relative min-h-24 p-1.5 text-sm transition-colors text-left',
                    'hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-primary',
                    !isCurrentMonth && 'text-muted-foreground opacity-50',
                    isTodayDate && 'bg-accent/10 ring-primary ring-inset',
                    hasItems && isCurrentMonth && 'font-medium',
                    isPastDate && 'opacity-60'
                  )}
                >
                  <div className="flex flex-col h-full space-y-1">
                    <span className={cn(
                      'text-xs font-semibold',
                      isTodayDate && 'text-primary',
                      isPastDate && 'text-muted-foreground'
                    )}>
                      {getDayOfMonth(date)}
                    </span>

                    {/* Event items */}
                    {hasItems && (
                      <div className="flex-1 space-y-0.5">
                        {dayItems.slice(0, 2).map((item) => (
                          <div
                            key={item.id}
                            className={cn(
                              'text-xs leading-tight px-1.5 py-1 truncate font-medium',
                              isPastDate ? 'bg-gray-100 text-gray-500' : [
                                item.type === 'event' && 'bg-primary/10 text-primary',
                                item.type === 'birthday' && 'bg-purple-100 text-purple-800',
                                item.type === 'baptism' && 'bg-green-100 text-green-700'
                              ]
                            )}
                            title={item.title}
                          >
                            {item.title}
                          </div>
                        ))}
                        {dayItems.length > 2 && (
                          <div className="text-xs text-muted-foreground px-1.5 hover:underline font-medium">
                            +{dayItems.length - 2} more
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Day details dialog */}
      <Dialog open={selectedDate !== null} onOpenChange={(open) => !open && setSelectedDate(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedDate && new Date(selectedDate).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </DialogTitle>
            <DialogDescription>
              {selectedDateItems.length} {selectedDateItems.length === 1 ? 'item' : 'items'} on this date
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {selectedDateItems.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No events on this date</p>
            ) : (
              selectedDateItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start gap-3 p-3 border border-primary/20 hover:bg-primary/10 transition-colors"
                >
                  {/* Icon */}
                  <div className="mt-0.5">
                    {item.type === 'event' && (
                      <CalendarIcon className="h-5 w-5 text-primary" />
                    )}
                    {item.type === 'birthday' && (
                      <CakeIcon className="h-5 w-5 text-pink-600" />
                    )}
                    {item.type === 'baptism' && (
                      <CalendarHeartIcon className="h-5 w-5 text-green-600" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        {item.type === 'event' ? (
                          <Link
                            href={`/events/${item.id}`}
                            className="font-medium hover:text-primary hover:underline"
                          >
                            {item.title}
                          </Link>
                        ) : item.member ? (
                          <Link
                            href={`/members/${item.member.id}`}
                            className="font-medium hover:text-primary hover:underline"
                          >
                            {item.title}
                          </Link>
                        ) : (
                          <span className="font-medium">{item.title}</span>
                        )}
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {item.type === 'event' && 'Event'}
                        {item.type === 'birthday' && 'Birthday'}
                        {item.type === 'baptism' && 'Anniversary'}
                      </Badge>
                    </div>

                    {item.church && (
                      <Link
                        href={`/churches/${item.church.id}`}
                        className="text-sm text-muted-foreground hover:text-primary hover:underline block"
                      >
                        {item.church.name}
                      </Link>
                    )}

                    {item.description && (
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    )}

                    {/* Metadata */}
                    {item.metadata && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {item.metadata.age && <span>Age: {item.metadata.age}</span>}
                        {item.metadata.years && <span>{item.metadata.years} years</span>}
                        {item.metadata.eventType && (
                          <Badge variant="secondary" className="text-xs">
                            {item.metadata.eventType}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
