'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { toast } from 'sonner'
import { Loader2, DownloadIcon } from 'lucide-react'
import type {
  MemberField,
  CustomReportFilters,
  MemberReportRow,
} from '@/lib/types/custom-reports'
import { MEMBER_FIELD_LABELS } from '@/lib/types/custom-reports'
import { ChurchSelect } from '@/components/shared'

interface CustomReportBuilderProps {
  churches: Array<{
    id: string
    name: string
    district?: string
    field?: string
    city?: string | null
    province?: string | null
  }>
  userRole: string
  initialTemplate?: string
}

export function CustomReportBuilder({
  churches,
  userRole,
}: CustomReportBuilderProps) {
  const [selectedFields, setSelectedFields] = useState<MemberField[]>([
    'full_name',
    'age',
    'gender',
    'church_name',
  ])
  const [filters, setFilters] = useState<CustomReportFilters>({
    status: ['active'],
  })
  const [reportData, setReportData] = useState<MemberReportRow[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  const availableFields: MemberField[] = [
    'full_name',
    'sp',
    'birthday',
    'age',
    'gender',
    'date_of_baptism',
    'baptized_by',
    'physical_condition',
    'illness_description',
    'spiritual_condition',
    'status',
    'church_name',
    'created_at',
  ]

  const handleFieldToggle = (field: MemberField) => {
    setSelectedFields(prev =>
      prev.includes(field)
        ? prev.filter(f => f !== field)
        : [...prev, field]
    )
  }

  const handleGenerateReport = async () => {
    if (selectedFields.length === 0) {
      toast.error('Please select at least one field')
      return
    }

    setIsGenerating(true)
    try {
      const response = await fetch('/api/reports/custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fields: selectedFields,
          filters,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to generate report')
      }

      const data = await response.json()
      setReportData(data.data || [])
      toast.success(`Report generated: ${data.data?.length || 0} records`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to generate report')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleExportCSV = () => {
    if (reportData.length === 0) {
      toast.error('No data to export. Generate a report first.')
      return
    }

    setIsExporting(true)
    try {
      // Build CSV content
      const headers = selectedFields.map(field => MEMBER_FIELD_LABELS[field])
      const rows = reportData.map(row =>
        selectedFields.map(field => {
          const value = row[field]
          if (value === null || value === undefined) return ''
          // Escape commas and quotes in values
          const stringValue = String(value)
          if (stringValue.includes(',') || stringValue.includes('"')) {
            return `"${stringValue.replace(/"/g, '""')}"`
          }
          return stringValue
        })
      )

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(',')),
      ].join('\n')

      // Create download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `custom-report-${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast.success('Report exported successfully')
    } catch {
      toast.error('Failed to export report')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Step 1: Select Fields */}
      <div className="space-y-3">
        <h3 className="font-medium">1. Select Fields to Include</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 rounded-lg border p-4">
          {availableFields.map(field => (
            <div key={field} className="flex items-center space-x-2">
              <Checkbox
                id={field}
                checked={selectedFields.includes(field)}
                onCheckedChange={() => handleFieldToggle(field)}
              />
              <Label
                htmlFor={field}
                className="text-sm font-normal cursor-pointer"
              >
                {MEMBER_FIELD_LABELS[field]}
              </Label>
            </div>
          ))}
        </div>
        <div className="flex gap-2 flex-wrap">
          <span className="text-sm text-gray-500">Selected:</span>
          {selectedFields.map(field => (
            <Badge key={field} variant="secondary">
              {MEMBER_FIELD_LABELS[field]}
            </Badge>
          ))}
        </div>
      </div>

      {/* Step 2: Apply Filters */}
      <div className="space-y-3">
        <h3 className="font-medium">2. Apply Filters (Optional)</h3>
        <div className="grid gap-4 md:grid-cols-2 rounded-lg border p-4">
          {/* Church Filter */}
          {userRole !== 'church_secretary' && (
            <div className="space-y-2">
              <Label>Church</Label>
              <ChurchSelect
                churches={churches}
                value={filters.church_id}
                onValueChange={(value) =>
                  setFilters(prev => ({
                    ...prev,
                    church_id: value || undefined,
                  }))
                }
                placeholder="All Churches"
                allowEmpty={true}
                showDistrictAndField={true}
                emptyLabel="All Churches"
              />
            </div>
          )}

          {/* Status Filter */}
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={filters.status?.[0] || 'all'}
              onValueChange={(value) =>
                setFilters(prev => ({
                  ...prev,
                  status: value === 'all' ? undefined : [value],
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="transferred_out">Transferred Out</SelectItem>
                <SelectItem value="resigned">Resigned</SelectItem>
                <SelectItem value="disfellowshipped">Disfellowshipped</SelectItem>
                <SelectItem value="deceased">Deceased</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Spiritual Condition Filter */}
          <div className="space-y-2">
            <Label>Spiritual Condition</Label>
            <Select
              value={filters.spiritual_condition?.[0] || 'all'}
              onValueChange={(value) =>
                setFilters(prev => ({
                  ...prev,
                  spiritual_condition: value === 'all' ? undefined : [value],
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Gender Filter */}
          <div className="space-y-2">
            <Label>Gender</Label>
            <Select
              value={filters.gender?.[0] || 'all'}
              onValueChange={(value) =>
                setFilters(prev => ({
                  ...prev,
                  gender: value === 'all' ? undefined : [value],
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All Genders" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Genders</SelectItem>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Age Range */}
          <div className="space-y-2">
            <Label>Age From</Label>
            <Input
              type="number"
              placeholder="Min age"
              value={filters.age_from || ''}
              onChange={(e) =>
                setFilters(prev => ({
                  ...prev,
                  age_from: e.target.value ? Number(e.target.value) : undefined,
                }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Age To</Label>
            <Input
              type="number"
              placeholder="Max age"
              value={filters.age_to || ''}
              onChange={(e) =>
                setFilters(prev => ({
                  ...prev,
                  age_to: e.target.value ? Number(e.target.value) : undefined,
                }))
              }
            />
          </div>

          {/* Baptism Status */}
          <div className="space-y-2">
            <Label>Baptism Status</Label>
            <Select
              value={
                filters.has_baptism_date === undefined
                  ? 'all'
                  : filters.has_baptism_date
                  ? 'baptized'
                  : 'unbaptized'
              }
              onValueChange={(value) =>
                setFilters(prev => ({
                  ...prev,
                  has_baptism_date:
                    value === 'all'
                      ? undefined
                      : value === 'baptized'
                      ? true
                      : false,
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="baptized">Baptized Only</SelectItem>
                <SelectItem value="unbaptized">Not Baptized</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Step 3: Generate Report */}
      <div className="flex items-center justify-between pt-4 border-t">
        <p className="text-sm text-gray-500">
          {reportData.length > 0
            ? `Showing ${reportData.length} records`
            : 'Configure your report and click Generate'}
        </p>
        <div className="flex gap-2">
          <Button
            onClick={handleGenerateReport}
            disabled={isGenerating || selectedFields.length === 0}
          >
            {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Generate Report
          </Button>
          <Button
            onClick={handleExportCSV}
            disabled={reportData.length === 0 || isExporting}
            variant="outline"
          >
            {isExporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <DownloadIcon className="mr-2 h-4 w-4" />
            )}
            Export CSV
          </Button>
        </div>
      </div>

      {/* Report Preview */}
      {reportData.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-medium">Report Preview</h3>
          <div className="border rounded-lg overflow-auto max-h-[500px]">
            <Table>
              <TableHeader>
                <TableRow>
                  {selectedFields.map(field => (
                    <TableHead key={field}>
                      {MEMBER_FIELD_LABELS[field]}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData.slice(0, 50).map((row, index) => (
                  <TableRow key={row.id || index}>
                    {selectedFields.map(field => (
                      <TableCell key={field}>
                        {row[field] !== null && row[field] !== undefined
                          ? String(row[field])
                          : '-'}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {reportData.length > 50 && (
              <div className="p-4 text-center text-sm text-gray-500 border-t">
                Showing first 50 of {reportData.length} records. Export to see all data.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
