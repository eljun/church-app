'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { MemberGrowthChart } from './member-growth-chart'
import { DownloadIcon } from 'lucide-react'

interface MemberGrowthReportProps {
  initialData: Array<{ date_of_baptism: string }>
  stats: {
    total: number
    active: number
    inactive: number
    male: number
    female: number
    baptized: number
  }
}

export function MemberGrowthReport({ initialData, stats }: MemberGrowthReportProps) {
  const [period, setPeriod] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly')

  // Process data for chart
  const chartData = processGrowthData(initialData, period)

  // Debug: Log data to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log('Member Growth Report Data:', {
      rawDataCount: initialData.length,
      chartDataCount: chartData.length,
      stats,
    })
  }

  return (
    <div className="space-y-6">
      {/* Statistics cards */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Members</CardDescription>
            <CardTitle className="text-3xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Active Members</CardDescription>
            <CardTitle className="text-3xl">{stats.active}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Male / Female</CardDescription>
            <CardTitle className="text-3xl">{stats.male} / {stats.female}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Baptized</CardDescription>
            <CardTitle className="text-3xl">{stats.baptized}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Growth chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Baptism Growth Trend</CardTitle>
              <CardDescription>
                New baptisms and cumulative total based on baptism dates
              </CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <Select value={period} onValueChange={(value: string) => setPeriod(value as 'monthly' | 'quarterly' | 'yearly')}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm">
                <DownloadIcon className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <MemberGrowthChart data={chartData} />
          ) : (
            <div className="flex h-96 flex-col items-center justify-center text-gray-500 space-y-2">
              <p className="text-lg font-medium">No baptism data available</p>
              <p className="text-sm text-center max-w-md">
                No baptisms recorded in the selected time period (last 5 years by default).
                Members without baptism dates are not included in this chart.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
          <CardDescription>Member statistics breakdown</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Members</span>
                <span className="font-semibold">{stats.total}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Active</span>
                <span className="font-semibold text-green-600">{stats.active}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Inactive</span>
                <span className="font-semibold text-gray-500">{stats.inactive}</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Male</span>
                <span className="font-semibold">{stats.male}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Female</span>
                <span className="font-semibold">{stats.female}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Baptized</span>
                <span className="font-semibold text-blue-600">{stats.baptized}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Process growth data into chart format
 * Tracks baptism dates to show spiritual growth trends
 */
function processGrowthData(
  data: Array<{ date_of_baptism: string }>,
  period: 'monthly' | 'quarterly' | 'yearly'
) {
  if (data.length === 0) return []

  // Group by period based on baptism date
  const grouped = new Map<string, number>()

  data.forEach(member => {
    const date = new Date(member.date_of_baptism)
    let key: string

    if (period === 'monthly') {
      key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    } else if (period === 'quarterly') {
      const quarter = Math.floor(date.getMonth() / 3) + 1
      key = `${date.getFullYear()}-Q${quarter}`
    } else {
      key = `${date.getFullYear()}`
    }

    grouped.set(key, (grouped.get(key) || 0) + 1)
  })

  // Convert to array and calculate cumulative
  const sorted = Array.from(grouped.entries()).sort((a, b) => a[0].localeCompare(b[0]))
  let cumulative = 0

  return sorted.map(([date, count]) => {
    cumulative += count
    return {
      date,
      count,
      cumulative,
    }
  })
}
