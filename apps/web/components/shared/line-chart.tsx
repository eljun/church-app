'use client'

import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

export interface LineChartDataPoint {
  [key: string]: string | number
}

export interface LineChartLineConfig {
  dataKey: string
  name: string
  color?: string
  strokeWidth?: number
}

interface LineChartProps {
  data: LineChartDataPoint[]
  lines: LineChartLineConfig[]
  height?: number
  xAxisKey?: string
  showGrid?: boolean
  showLegend?: boolean
  showTooltip?: boolean
  gridDashArray?: string
  fontSize?: number
}

export function LineChart({
  data,
  lines,
  height = 400,
  xAxisKey = 'date',
  showGrid = true,
  showLegend = true,
  showTooltip = true,
  gridDashArray = '0 3',
  fontSize = 10,
}: LineChartProps) {
  // Brand colors matching the theme
  const defaultColors = ['#2B4C7E', '#87B984', '#D4A574', '#E57373', '#64B5F6', '#81C784']

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsLineChart data={data}>
        {showGrid && <CartesianGrid strokeDasharray={gridDashArray} />}
        <XAxis dataKey={xAxisKey} tick={{ fontSize }} />
        <YAxis tick={{ fontSize }} />
        {showTooltip && <Tooltip />}
        {showLegend && <Legend />}
        {lines.map((line, index) => (
          <Line
            key={line.dataKey}
            type="monotone"
            dataKey={line.dataKey}
            stroke={line.color || defaultColors[index % defaultColors.length]}
            name={line.name}
            strokeWidth={line.strokeWidth || 2}
            fill={line.color || defaultColors[index % defaultColors.length]}
          />
        ))}
      </RechartsLineChart>
    </ResponsiveContainer>
  )
}
