'use client'

import { LineChart } from '@/components/shared'

interface AgeDistributionChartProps {
  data: {
    children: number
    youth: number
    adults: number
    seniors: number
  }
}

export function AgeDistributionChart({ data }: AgeDistributionChartProps) {
  // Transform data for chart using brand color scheme
  const chartData = [
    {
      category: 'Children',
      count: data.children,
      label: '< 12 years',
      color: '#9DACC7', // Primary with lighter shade (20% opacity equivalent)
    },
    {
      category: 'Youth',
      count: data.youth,
      label: '12-34 years',
      color: '#B2A675', // Inactive color
    },
    {
      category: 'Adults',
      count: data.adults,
      label: '35-65 years',
      color: '#87B984', // Accent color
    },
    {
      category: 'Seniors',
      count: data.seniors,
      label: '66+ years',
      color: '#2B4C7E', // Primary color
    },
  ]

  const total = data.children + data.youth + data.adults + data.seniors

  return (
    <div className="space-y-4">
      {/* Summary stats */}
      <div className="grid grid-cols-4 gap-4">
        {chartData.map(item => {
          const percentage = total > 0 ? Math.round((item.count / total) * 100) : 0
          return (
            <div key={item.category} className="text-center">
              <div className="text-2xl " style={{ color: item.color }}>
                {item.count}
              </div>
              <div className="text-sm font-medium text-gray-700">{item.category}</div>
              <div className="text-xs text-gray-500">{item.label}</div>
              <div className="text-xs text-gray-500">{percentage}%</div>
            </div>
          )
        })}
      </div>

      {/* Line chart */}
      <LineChart
        data={chartData}
        lines={[
          { dataKey: 'count', name: 'Members by Age Group', color: '#2B4C7E' }
        ]}
        xAxisKey="category"
        height={300}
      />
    </div>
  )
}
