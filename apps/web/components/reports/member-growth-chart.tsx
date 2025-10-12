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
          stroke="#8ED8F8"
          name="New Baptisms"
          strokeWidth={2}
        />
        <Line
          type="monotone"
          dataKey="cumulative"
          stroke="#9BD3AE"
          name="Cumulative Baptisms"
          strokeWidth={2}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
