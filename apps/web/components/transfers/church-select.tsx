'use client'

import { useState } from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

interface Church {
  id: string
  name: string
}

interface ChurchSelectProps {
  churches: Church[]
  value: string
  onChange: (value: string) => void
  excludeChurchId?: string
}

export function ChurchSelect({ churches, value, onChange, excludeChurchId }: ChurchSelectProps) {
  const [open, setOpen] = useState(false)

  const selectedChurch = churches.find((church) => church.id === value)
  const availableChurches = excludeChurchId
    ? churches.filter((church) => church.id !== excludeChurchId)
    : churches

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedChurch ? selectedChurch.name : 'Select church...'}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0">
        <Command>
          <CommandInput placeholder="Search churches..." />
          <CommandEmpty>No church found.</CommandEmpty>
          <CommandGroup className="max-h-64 overflow-auto">
            {availableChurches.map((church) => (
              <CommandItem
                key={church.id}
                value={church.name}
                onSelect={() => {
                  onChange(church.id)
                  setOpen(false)
                }}
              >
                <Check
                  className={cn(
                    'mr-2 h-4 w-4',
                    value === church.id ? 'opacity-100' : 'opacity-0'
                  )}
                />
                {church.name}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
