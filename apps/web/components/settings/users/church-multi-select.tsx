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
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'

interface Church {
  id: string
  name: string
  field: string
  district: string
}

interface ChurchMultiSelectProps {
  churches: Church[]
  selectedIds: string[]
  onChange: (selectedIds: string[]) => void
}

export function ChurchMultiSelect({
  churches,
  selectedIds,
  onChange,
}: ChurchMultiSelectProps) {
  const [open, setOpen] = useState(false)

  const selectedChurches = churches.filter((c) => selectedIds.includes(c.id))

  const toggleChurch = (churchId: string) => {
    if (selectedIds.includes(churchId)) {
      onChange(selectedIds.filter((id) => id !== churchId))
    } else {
      onChange([...selectedIds, churchId])
    }
  }

  const removeChurch = (churchId: string) => {
    onChange(selectedIds.filter((id) => id !== churchId))
  }

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen} modal={false}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {selectedIds.length === 0 ? (
              <span className="text-muted-foreground">Select churches...</span>
            ) : (
              <span>{selectedIds.length} church(es) selected</span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search churches..." />
            <CommandList>
              <CommandEmpty>No churches found.</CommandEmpty>
              <CommandGroup className="max-h-64 overflow-auto">
                {churches.map((church) => {
                  const isSelected = selectedIds.includes(church.id)
                  return (
                    <CommandItem
                      key={church.id}
                      value={church.name}
                      onSelect={() => toggleChurch(church.id)}
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          isSelected ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      <div className="flex flex-col items-start">
                        <span className="font-medium">{church.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {church.field} • {church.district}
                        </span>
                      </div>
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Selected churches display */}
      {selectedChurches.length > 0 && (
        <div className="flex flex-wrap gap-2 rounded-md border p-2 min-h-[42px]">
          {selectedChurches.map((church) => (
            <Badge
              key={church.id}
              variant="secondary"
              className="gap-1 pr-1"
            >
              <span className="text-xs">{church.name}</span>
              <button
                type="button"
                className="ml-1 rounded-full hover:bg-muted"
                onClick={() => removeChurch(church.id)}
              >
                <span className="sr-only">Remove</span>
                <span className="h-3 w-3 flex items-center justify-center">×</span>
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
