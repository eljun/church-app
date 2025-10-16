'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import type { MissionaryReport } from '@church-app/database'

interface MissionaryActivitiesChartsProps {
  reports: MissionaryReport[]
  stats: {
    totalReports: number
    totalBibleStudies: number
    totalHomeVisits: number
    totalSeminars: number
    totalConferences: number
    totalPublicLectures: number
    totalPamphlets: number
    totalBooks: number
    totalMagazines: number
    totalYouthAnchor: number
    averages: {
      bibleStudies: number
      homeVisits: number
      seminars: number
      conferences: number
      publicLectures: number
      pamphlets: number
      books: number
      magazines: number
      youthAnchor: number
    }
  }
}

export function MissionaryActivitiesCharts({ reports, stats }: MissionaryActivitiesChartsProps) {
  // Process reports into timeline data
  const chartData = reports
    .sort((a, b) => new Date(a.report_date).getTime() - new Date(b.report_date).getTime())
    .map(report => ({
      date: new Date(report.report_date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }),
      bibleStudies: report.bible_studies_given,
      homeVisits: report.home_visits,
      seminars: report.seminars_conducted,
      conferences: report.conferences_conducted,
      publicLectures: report.public_lectures,
      youthAnchor: report.youth_anchor,
    }))

  return (
    <div className="space-y-6">
      {/* Activity Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Trend</CardTitle>
          <CardDescription>Missionary activities over time</CardDescription>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="bibleStudies"
                  stroke="var(--purple)"
                  name="Bible Studies"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="homeVisits"
                  stroke="var(--inactive)"
                  name="Home Visits"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="seminars"
                  stroke="var(--primary)"
                  name="Seminars"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="conferences"
                  stroke="var(--accent)"
                  name="Conferences"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="publicLectures"
                  stroke="var(--primary-light)"
                  name="Public Lectures"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="youthAnchor"
                  stroke="var(--muted-foreground)"
                  name="Youth Anchor"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-96 flex-col items-center justify-center text-muted-foreground space-y-2">
              <p className="text-lg font-medium">No report data available</p>
              <p className="text-sm text-center max-w-md">
                No missionary reports found for the selected time period and filters.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Average Activities Per Report */}
      <Card>
        <CardHeader>
          <CardTitle>Average Activities Per Report</CardTitle>
          <CardDescription>Based on {stats.totalReports} reports</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Bible Studies</p>
              <p className="text-2xl font-bold">{stats.averages.bibleStudies}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Home Visits</p>
              <p className="text-2xl font-bold">{stats.averages.homeVisits}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Seminars</p>
              <p className="text-2xl font-bold">{stats.averages.seminars}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Conferences</p>
              <p className="text-2xl font-bold">{stats.averages.conferences}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Public Lectures</p>
              <p className="text-2xl font-bold">{stats.averages.publicLectures}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Youth Anchor</p>
              <p className="text-2xl font-bold">{stats.averages.youthAnchor}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Pamphlets</p>
              <p className="text-2xl font-bold">{stats.averages.pamphlets}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Books</p>
              <p className="text-2xl font-bold">{stats.averages.books}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Magazines</p>
              <p className="text-2xl font-bold">{stats.averages.magazines}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
