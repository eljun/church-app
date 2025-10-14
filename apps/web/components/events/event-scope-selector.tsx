'use client'

import { useEffect, useState } from 'react'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { FIELDS, type EventScope } from '@/lib/constants/organization'
import { ChurchSelect } from '@/components/members/church-select'

interface Church {
  id: string
  name: string
  field?: string
  district?: string
}

interface EventScopeSelectorProps {
  scope: EventScope
  scopeValue: string | null
  churchId: string | null
  onScopeChange: (scope: EventScope) => void
  onScopeValueChange: (value: string | null) => void
  onChurchIdChange: (value: string | null) => void
  countries: string[]
  districts: string[]
  churches: Church[]
}

export function EventScopeSelector({
  scope,
  scopeValue,
  churchId,
  onScopeChange,
  onScopeValueChange,
  onChurchIdChange,
  countries,
  districts,
  churches,
}: EventScopeSelectorProps) {
  const [mounted, setMounted] = useState(false)
  const [selectedDistricts, setSelectedDistricts] = useState<string[]>([])

  useEffect(() => {
    setMounted(true)
  }, [])

  // Parse selected districts from scope_value (comma-separated)
  useEffect(() => {
    if (scope === 'district' && scopeValue) {
      setSelectedDistricts(scopeValue.split(',').filter(Boolean))
    } else {
      setSelectedDistricts([])
    }
  }, [scope, scopeValue])

  // Handle scope change and reset dependent values
  const handleScopeChange = (newScope: EventScope) => {
    onScopeChange(newScope)
    onScopeValueChange(null)
    setSelectedDistricts([])

    // For church scope, keep church_id, for others set to null
    if (newScope !== 'church') {
      onChurchIdChange(null)
    }
  }

  // Handle district checkbox toggle
  const handleDistrictToggle = (district: string) => {
    const newSelected = selectedDistricts.includes(district)
      ? selectedDistricts.filter((d) => d !== district)
      : [...selectedDistricts, district]

    setSelectedDistricts(newSelected)
    // Store as comma-separated string
    onScopeValueChange(newSelected.length > 0 ? newSelected.join(',') : null)
  }

  if (!mounted) {
    return null
  }

  return (
    <div className="space-y-4">
      {/* Scope Level Selector */}
      <div className="space-y-2">
        <Label htmlFor="event_scope">Event Scope</Label>
        <Select value={scope} onValueChange={handleScopeChange}>
          <SelectTrigger id="event_scope">
            <SelectValue placeholder="Select event scope" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="church">Church Level</SelectItem>
            <SelectItem value="district">District Level</SelectItem>
            <SelectItem value="field">Field Level</SelectItem>
            <SelectItem value="national">National Level</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground">
          {scope === 'national' && 'Event visible to all churches in the country'}
          {scope === 'field' && 'Event visible to all churches in the selected field'}
          {scope === 'district' && 'Event visible to all churches in the selected districts'}
          {scope === 'church' && 'Event visible only to the selected church'}
        </p>
      </div>

      {/* Scope Value Selector - Changes based on scope */}
      {scope === 'national' && (
        <div className="space-y-2">
          <Label htmlFor="country">Country</Label>
          <Select
            value={scopeValue || undefined}
            onValueChange={onScopeValueChange}
          >
            <SelectTrigger id="country">
              <SelectValue placeholder="Select country" />
            </SelectTrigger>
            <SelectContent>
              {countries.length === 0 ? (
                <SelectItem value="no-countries" disabled>
                  No countries available
                </SelectItem>
              ) : (
                countries.map((country) => (
                  <SelectItem key={country} value={country}>
                    {country}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
      )}

      {scope === 'field' && (
        <div className="space-y-2">
          <Label htmlFor="field">Field</Label>
          <Select
            value={scopeValue || undefined}
            onValueChange={onScopeValueChange}
          >
            <SelectTrigger id="field">
              <SelectValue placeholder="Select field" />
            </SelectTrigger>
            <SelectContent>
              {FIELDS.map((field) => (
                <SelectItem key={field.value} value={field.value}>
                  {field.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {scope === 'district' && (
        <div className="space-y-2">
          <Label>Districts (Select multiple)</Label>
          <div className="border rounded-md p-3 space-y-2 max-h-[150px] overflow-y-auto bg-muted/10">
            {districts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No districts available</p>
            ) : (
              districts.map((district) => (
                <div key={district} className="flex items-center space-x-2">
                  <Checkbox
                    id={`district-${district}`}
                    checked={selectedDistricts.includes(district)}
                    onCheckedChange={() => handleDistrictToggle(district)}
                  />
                  <label
                    htmlFor={`district-${district}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {district}
                  </label>
                </div>
              ))
            )}
          </div>
          {selectedDistricts.length > 0 && (
            <p className="text-sm text-muted-foreground">
              Selected: {selectedDistricts.join(', ')}
            </p>
          )}
        </div>
      )}

      {scope === 'church' && (
        <div className="space-y-2">
          <Label htmlFor="church">Church</Label>
          <ChurchSelect
            churches={churches}
            value={churchId || undefined}
            onValueChange={(value) => {
              onChurchIdChange(value)
              // For church scope, scope_value should be the church_id
              onScopeValueChange(value)
            }}
            showDistrictAndField
          />
        </div>
      )}
    </div>
  )
}
