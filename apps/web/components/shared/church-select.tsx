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
  city?: string | null
  province?: string | null
}

interface ChurchSelectProps {
  churches: Church[]
  value?: string
  onValueChange: (value: string) => void
  disabled?: boolean
  placeholder?: string
  allowEmpty?: boolean
  showDistrictAndField?: boolean
  excludeChurchId?: string
  emptyLabel?: string
}

export function ChurchSelect({
  churches,
  value,
  onValueChange,
  disabled,
  placeholder = 'Select a church',
  allowEmpty = false,
  showDistrictAndField = true,
  excludeChurchId,
  emptyLabel = 'None (All churches)',
}: ChurchSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState('')

  const selectedChurch = churches.find((church) => church.id === value)

  // Filter out excluded church if specified and sort alphabetically
  const availableChurches = React.useMemo(() => {
    const filtered = excludeChurchId
      ? churches.filter((church) => church.id !== excludeChurchId)
      : churches

    // Sort alphabetically by church name
    return filtered.sort((a, b) => a.name.localeCompare(b.name))
  }, [churches, excludeChurchId])

  // Client-side search filtering
  const filteredChurches = React.useMemo(() => {
    if (!search) return availableChurches

    const searchLower = search.toLowerCase()
    return availableChurches.filter((church) => {
      const searchableText = [
        church.name,
        church.city,
        church.province,
        church.district,
        church.field,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return searchableText.includes(searchLower)
    })
  }, [availableChurches, search])

  const handleSelect = (churchId: string) => {
    if (allowEmpty && churchId === value) {
      // Allow deselection if allowEmpty is true
      onValueChange('')
    } else {
      onValueChange(churchId)
    }
    setOpen(false)
    setSearch('') // Reset search when closing
  }

  return (
    <Popover open={open} onOpenChange={setOpen} modal={false}>
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
      <PopoverContent className="w-[400px] p-0" align="start" sideOffset={5}>
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search churches..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList className="max-h-[300px] overflow-y-auto">
            <CommandEmpty>No churches found.</CommandEmpty>
            <CommandGroup>
              {allowEmpty && !search && (
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
                    {emptyLabel}
                  </span>
                </CommandItem>
              )}
              {filteredChurches.map((church) => (
                <CommandItem
                  key={church.id}
                  value={church.name}
                  onSelect={() => handleSelect(church.id)}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === church.id ? 'opacity-100 text-accent' : 'opacity-0'
                    )}
                  />
                  <div className="flex flex-col items-start gap-0.5">
                    <span className="font-medium text-primary">{church.name}</span>
                    {showDistrictAndField && (
                      <div className="text-xs text-muted-foreground">
                        {[
                          church.city,
                          church.province,
                          church.district,
                          church.field,
                        ]
                          .filter(Boolean)
                          .join(' • ')}
                      </div>
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
