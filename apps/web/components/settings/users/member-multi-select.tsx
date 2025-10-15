'use client'

import { useState, useEffect } from 'react'
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react'
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
import { getAssignableMembers } from '@/lib/queries/users'

interface Member {
  id: string
  full_name: string
  church_id: string
  churches: { name: string } | null
}

interface MemberMultiSelectProps {
  churchId?: string
  selectedIds: string[]
  onChange: (selectedIds: string[]) => void
}

export function MemberMultiSelect({
  churchId,
  selectedIds,
  onChange,
}: MemberMultiSelectProps) {
  const [open, setOpen] = useState(false)
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchMembers = async () => {
      setLoading(true)
      try {
        const data = await getAssignableMembers(churchId)
        // Transform the data to match Member interface
        const transformedData: Member[] = data.map((item: any) => ({
          id: item.id,
          full_name: item.full_name,
          church_id: item.church_id,
          churches: item.churches && Array.isArray(item.churches)
            ? item.churches[0]
            : item.churches
        }))
        setMembers(transformedData)
      } catch (error) {
        console.error('Failed to fetch members:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchMembers()
  }, [churchId])

  const selectedMembers = members.filter((m) => selectedIds.includes(m.id))

  const toggleMember = (memberId: string) => {
    if (selectedIds.includes(memberId)) {
      onChange(selectedIds.filter((id) => id !== memberId))
    } else {
      onChange([...selectedIds, memberId])
    }
  }

  const removeMember = (memberId: string) => {
    onChange(selectedIds.filter((id) => id !== memberId))
  }

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {selectedIds.length === 0 ? (
              <span className="text-muted-foreground">Select members...</span>
            ) : (
              <span>{selectedIds.length} member(s) selected</span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search members..." />
            <CommandList>
              {loading ? (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="ml-2 text-sm text-muted-foreground">
                    Loading members...
                  </span>
                </div>
              ) : (
                <>
                  <CommandEmpty>No members found.</CommandEmpty>
                  <CommandGroup>
                    {members.map((member) => {
                      const isSelected = selectedIds.includes(member.id)
                      return (
                        <CommandItem
                          key={member.id}
                          value={member.full_name}
                          onSelect={() => toggleMember(member.id)}
                        >
                          <Check
                            className={cn(
                              'mr-2 h-4 w-4',
                              isSelected ? 'opacity-100' : 'opacity-0'
                            )}
                          />
                          <div className="flex flex-col items-start">
                            <span>{member.full_name}</span>
                            {member.churches && (
                              <span className="text-xs text-muted-foreground">
                                {member.churches.name}
                              </span>
                            )}
                          </div>
                        </CommandItem>
                      )
                    })}
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Selected members display */}
      {selectedMembers.length > 0 && (
        <div className="flex flex-wrap gap-2 rounded-md border p-2 min-h-[42px]">
          {selectedMembers.map((member) => (
            <Badge
              key={member.id}
              variant="secondary"
              className="gap-1 pr-1"
            >
              <span className="text-xs">{member.full_name}</span>
              <button
                type="button"
                className="ml-1 rounded-full hover:bg-muted"
                onClick={() => removeMember(member.id)}
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
