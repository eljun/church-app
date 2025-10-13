'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts'

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
              <div className="text-2xl font-bold" style={{ color: item.color }}>
                {item.count}
              </div>
              <div className="text-sm font-medium text-gray-700">{item.category}</div>
              <div className="text-xs text-gray-500">{item.label}</div>
              <div className="text-xs text-gray-500">{percentage}%</div>
            </div>
          )
        })}
      </div>

      {/* Bar chart */}
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="6 6" />
          <XAxis
            dataKey="category"
            tick={{ fontSize: 12 }}
          />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload
                const percentage = total > 0 ? Math.round((data.count / total) * 100) : 0
                return (
                  <div className="bg-white p-3 border rounded-lg shadow-lg">
                    <p className="font-semibold">{data.category}</p>
                    <p className="text-sm text-gray-600">{data.label}</p>
                    <p className="text-sm">
                      <span className="font-medium">Count:</span> {data.count}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Percentage:</span> {percentage}%
                    </p>
                  </div>
                )
              }
              return null
            }}
          />
          <Legend />
          <Bar dataKey="count" name="Members" radius={[8, 8, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
