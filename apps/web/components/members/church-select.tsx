'use client'

import * as React from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Input } from '@/components/ui/input'

interface Church {
  id: string
  name: string
  field?: string
  district?: string
}

interface ChurchSelectProps {
  churches: Church[]
  value?: string
  onValueChange: (value: string) => void
  disabled?: boolean
  placeholder?: string
  allowEmpty?: boolean
  showDistrictAndField?: boolean
}

export function ChurchSelect({
  churches,
  value,
  onValueChange,
  disabled,
  placeholder = 'Select a church',
  allowEmpty = false,
  showDistrictAndField = false,
}: ChurchSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState('')

  const selectedChurch = churches.find((church) => church.id === value)

  const filteredChurches = React.useMemo(() => {
    if (!searchQuery) return churches

    return churches.filter((church) =>
      church.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [churches, searchQuery])

  const handleSelect = (churchId: string) => {
    onValueChange(churchId)
    setOpen(false)
    setSearchQuery('')
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-between"
        >
          {selectedChurch ? selectedChurch.name : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <div className="flex flex-col">
          {/* Search Input */}
          <div className="border-b p-2">
            <Input
              placeholder="Search churches..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9"
            />
          </div>

          {/* Church List */}
          <div className="max-h-[300px] overflow-y-auto">
            {filteredChurches.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                No churches found.
              </div>
            ) : (
              <div className="p-1">
                {allowEmpty && (
                  <button
                    onClick={() => handleSelect('')}
                    className={cn(
                      'relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground',
                      !value && 'bg-accent'
                    )}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        !value ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <span className="text-muted-foreground italic">None (All churches)</span>
                  </button>
                )}
                {filteredChurches.map((church) => (
                  <button
                    key={church.id}
                    onClick={() => handleSelect(church.id)}
                    className={cn(
                      'relative flex w-full cursor-pointer select-none items-start rounded-sm px-2 py-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground',
                      value === church.id && 'bg-accent'
                    )}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4 mt-0.5',
                        value === church.id ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <div className="flex flex-col items-start">
                      <span>{church.name}</span>
                      {showDistrictAndField && (church.district || church.field) && (
                        <span className="text-xs text-muted-foreground">
                          {church.district && `District: ${church.district}`}
                          {church.district && church.field && ' • '}
                          {church.field && `Field: ${church.field}`}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
