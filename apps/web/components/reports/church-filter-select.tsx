'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { ChurchSelect } from '@/components/shared'
import { Label } from '@/components/ui/label'

interface ChurchFilterSelectProps {
  churches: Array<{
    id: string
    name: string
    district?: string
    field?: string
    city?: string | null
    province?: string | null
  }>
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
      <ChurchSelect
        churches={churches}
        value={selectedChurchId}
        onValueChange={handleChurchChange}
        placeholder="Select a church"
        showDistrictAndField={true}
      />
    </div>
  )
}
