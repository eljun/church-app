import { Suspense } from 'react'
import Link from 'next/link'
import { ArrowLeftIcon, DownloadIcon, CalendarHeartIcon } from 'lucide-react'
import { getUpcomingBaptismAnniversaries } from '@/lib/queries/reports'
import { formatDate, formatLongMonthDay } from '@/lib/utils/format-date'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface BaptismAnniversariesPageProps {
  searchParams: Promise<{
    church_id?: string
    months_ahead?: string
  }>
}

export default async function BaptismAnniversariesPage({
  searchParams,
}: BaptismAnniversariesPageProps) {
  const params = await searchParams
  const monthsAhead = parseInt(params.months_ahead || '3')

  // Fetch upcoming anniversaries
  const anniversaries = await getUpcomingBaptismAnniversaries({
    church_id: params.church_id,
    months_ahead: monthsAhead,
  })

  // Sort by next anniversary date
  const sorted = anniversaries.sort((a, b) => {
    const aDate = getNextAnniversaryDate(a.date_of_baptism!)
    const bDate = getNextAnniversaryDate(b.date_of_baptism!)
    return aDate.getTime() - bDate.getTime()
  })

  // Group by milestone years (5, 10, 15, 20, 25, etc.)
  const milestones = sorted.filter(
    (member) => member.years_since_baptism % 5 === 0 && member.years_since_baptism > 0
  )

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="icon">
            <Link href="/reports">
              <ArrowLeftIcon className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="font-display text-3xl font-bold text-primary ">
              Baptism Anniversaries
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Upcoming baptism anniversary dates for your members
            </p>
          </div>
        </div>
        <Button variant="outline">
          <DownloadIcon className="mr-2 h-4 w-4" />
          Export Report
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Upcoming</CardDescription>
            <CardTitle className="text-3xl">{anniversaries.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">
              In the next {monthsAhead} months
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Milestone Anniversaries</CardDescription>
            <CardTitle className="text-3xl">{milestones.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">
              5, 10, 15, 20+ year milestones
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>This Month</CardDescription>
            <CardTitle className="text-3xl">
              {
                sorted.filter((member) => {
                  const nextDate = getNextAnniversaryDate(member.date_of_baptism!)
                  const today = new Date()
                  return (
                    nextDate.getMonth() === today.getMonth() &&
                    nextDate.getFullYear() === today.getFullYear()
                  )
                }).length
              }
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Milestone anniversaries */}
      {milestones.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarHeartIcon className="h-5 w-5 text-green-600" />
              Milestone Anniversaries
            </CardTitle>
            <CardDescription>
              Special anniversaries (5, 10, 15, 20+ years)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member Name</TableHead>
                    <TableHead>Church</TableHead>
                    <TableHead>Baptism Date</TableHead>
                    <TableHead>Next Anniversary</TableHead>
                    <TableHead>Years</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {milestones.map((member) => {
                    const nextDate = getNextAnniversaryDate(member.date_of_baptism!)
                    const daysUntil = Math.ceil(
                      (nextDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                    )
                    return (
                      <TableRow key={member.id}>
                        <TableCell className="font-medium">{member.full_name}</TableCell>
                        <TableCell>{member.churches?.name}</TableCell>
                        <TableCell>
                          {formatDate(member.date_of_baptism!)}
                        </TableCell>
                        <TableCell>
                          {formatDate(nextDate)}
                          <span className="ml-2 text-sm text-gray-500">
                            ({daysUntil} days)
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="default" className="bg-green-600">
                            {member.years_since_baptism} Years
                          </Badge>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* All upcoming anniversaries */}
      <Card>
        <CardHeader>
          <CardTitle>All Upcoming Anniversaries</CardTitle>
          <CardDescription>
            All baptism anniversaries in the next {monthsAhead} months
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div className="h-96 animate-pulse bg-gray-100 rounded-lg" />}>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member Name</TableHead>
                    <TableHead>Church</TableHead>
                    <TableHead>Baptism Date</TableHead>
                    <TableHead>Next Anniversary</TableHead>
                    <TableHead>Years</TableHead>
                    <TableHead>Contact</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sorted.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        No upcoming baptism anniversaries found
                      </TableCell>
                    </TableRow>
                  ) : (
                    sorted.map((member) => {
                      const nextDate = getNextAnniversaryDate(member.date_of_baptism!)
                      const daysUntil = Math.ceil(
                        (nextDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                      )
                      const isMilestone = member.years_since_baptism % 5 === 0
                      return (
                        <TableRow key={member.id}>
                          <TableCell className="font-medium">
                            {member.full_name}
                            {isMilestone && (
                              <CalendarHeartIcon className="ml-2 inline h-4 w-4 text-green-600" />
                            )}
                          </TableCell>
                          <TableCell>{member.churches?.name}</TableCell>
                          <TableCell>
                            {formatLongMonthDay(member.date_of_baptism!)}
                          </TableCell>
                          <TableCell>
                            {formatDate(nextDate)}
                            <span className="ml-2 text-sm text-gray-500">
                              ({daysUntil} days)
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge variant={isMilestone ? 'default' : 'outline'}>
                              {member.years_since_baptism} Years
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-gray-500">
                            {member.phone_number || member.email || '-'}
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Get the next anniversary date for a given baptism date
 */
function getNextAnniversaryDate(baptismDate: string): Date {
  const baptism = new Date(baptismDate)
  const today = new Date()
  const thisYearAnniversary = new Date(
    today.getFullYear(),
    baptism.getMonth(),
    baptism.getDate()
  )

  // If anniversary already passed this year, return next year's date
  if (thisYearAnniversary < today) {
    return new Date(
      today.getFullYear() + 1,
      baptism.getMonth(),
      baptism.getDate()
    )
  }

  return thisYearAnniversary
}
