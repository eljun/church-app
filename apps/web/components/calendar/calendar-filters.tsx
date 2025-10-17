'use client'

import { CalendarIcon, CakeIcon, CalendarHeartIcon } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent } from '@/components/ui/card'

interface CalendarFiltersProps {
  showEvents: boolean
  showBirthdays: boolean
  showBaptisms: boolean
  onToggleEvents: (checked: boolean) => void
  onToggleBirthdays: (checked: boolean) => void
  onToggleBaptisms: (checked: boolean) => void
}

export function CalendarFilters({
  showEvents,
  showBirthdays,
  showBaptisms,
  onToggleEvents,
  onToggleBirthdays,
  onToggleBaptisms,
}: CalendarFiltersProps) {
  return (
    <Card className="border-0 shadow-none">
      <CardContent className="pt-8 pl-0">
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="show-events"
              checked={showEvents}
              onCheckedChange={onToggleEvents}
            />
            <Label
              htmlFor="show-events"
              className="flex items-center gap-2 cursor-pointer"
            >
              <CalendarIcon className="h-4 w-4 text-primary" />
              <span>Events</span>
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="show-birthdays"
              checked={showBirthdays}
              onCheckedChange={onToggleBirthdays}
            />
            <Label
              htmlFor="show-birthdays"
              className="flex items-center gap-2 cursor-pointer"
            >
              <CakeIcon className="h-4 w-4 text-purple-600" />
              <span>Birthdays</span>
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="show-baptisms"
              checked={showBaptisms}
              onCheckedChange={onToggleBaptisms}
            />
            <Label
              htmlFor="show-baptisms"
              className="flex items-center gap-2 cursor-pointer"
            >
              <CalendarHeartIcon className="h-4 w-4 text-green-600" />
              <span>Baptism Anniversaries</span>
            </Label>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
