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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'

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

  const selectedChurch = churches.find((church) => church.id === value)

  const handleSelect = (churchId: string) => {
    onValueChange(churchId === value ? '' : churchId)
    setOpen(false)
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
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search churches..." />
          <CommandList>
            <CommandEmpty>No churches found.</CommandEmpty>
            <CommandGroup>
              {allowEmpty && (
                <CommandItem
                  value="empty-selection"
                  onSelect={() => handleSelect('')}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      !value ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  <span className="text-muted-foreground italic">
                    None (All churches)
                  </span>
                </CommandItem>
              )}
              {churches.map((church) => (
                <CommandItem
                  key={church.id}
                  value={church.name}
                  onSelect={() => handleSelect(church.id)}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
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
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
