'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface MemberGrowthChartProps {
  data: Array<{
    date: string
    count: number
    cumulative: number
  }>
}

export function MemberGrowthChart({ data }: MemberGrowthChartProps) {
  // Brand colors matching the theme
  const primaryColor = '#2B4C7E' // Primary color from theme
  const accentColor = '#87B984' // Accent color from theme

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="0 3" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 10 }}
        />
        <YAxis tick={{ fontSize: 10 }} />
        <Tooltip />
        <Legend />
        <Line
          type="monotone"
          dataKey="count"
          stroke={primaryColor}
          name="New Baptisms"
          strokeWidth={2}
          fill={primaryColor}
        />
        <Line
          type="monotone"
          dataKey="cumulative"
          stroke={accentColor}
          name="Cumulative Baptisms"
          strokeWidth={2}
          fill={accentColor}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
