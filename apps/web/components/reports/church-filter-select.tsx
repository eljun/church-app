'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Building2 } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'

interface ChurchFilterSelectProps {
  churches: Array<{ id: string; name: string; district: string; field: string }>
  selectedChurchId?: string
}

export function ChurchFilterSelect({ churches, selectedChurchId }: ChurchFilterSelectProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleChurchChange = (churchId: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('church', churchId)
    router.push(`?${params.toString()}`)
  }

  return (
    <div className="w-80">
      <Label htmlFor="church-filter" className="text-sm font-medium mb-2 block">
        Filter by Church
      </Label>
      <Select value={selectedChurchId} onValueChange={handleChurchChange}>
        <SelectTrigger id="church-filter" className="w-full">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <SelectValue placeholder="Select a church" />
          </div>
        </SelectTrigger>
        <SelectContent>
          {churches.map((church) => (
            <SelectItem key={church.id} value={church.id}>
              <div className="flex flex-col items-start">
                <span className="font-medium">{church.name}</span>
                <span className="text-xs text-muted-foreground">
                  {church.district} • {church.field}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
