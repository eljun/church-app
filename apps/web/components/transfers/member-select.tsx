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

interface Member {
  id: string
  full_name: string
  churches: {
    name: string
  } | null
}

interface MemberSelectProps {
  members: Member[]
  value: string
  onChange: (value: string) => void
}

export function MemberSelect({ members, value, onChange }: MemberSelectProps) {
  const [open, setOpen] = useState(false)

  const selectedMember = members.find((member) => member.id === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedMember ? (
            <span className="flex items-center gap-2">
              <span>{selectedMember.full_name}</span>
              <span className="text-xs text-gray-500">
                ({selectedMember.churches?.name || 'No church'})
              </span>
            </span>
          ) : (
            'Select member...'
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0">
        <Command>
          <CommandInput placeholder="Search members..." />
          <CommandEmpty>No member found.</CommandEmpty>
          <CommandGroup className="max-h-64 overflow-auto">
            {members.map((member) => (
              <CommandItem
                key={member.id}
                value={`${member.full_name} ${member.churches?.name || ''}`}
                onSelect={() => {
                  onChange(member.id)
                  setOpen(false)
                }}
              >
                <Check
                  className={cn(
                    'mr-2 h-4 w-4',
                    value === member.id ? 'opacity-100' : 'opacity-0'
                  )}
                />
                <div className="flex flex-col">
                  <span>{member.full_name}</span>
                  <span className="text-xs text-gray-500">
                    {member.churches?.name || 'No church'}
                  </span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
