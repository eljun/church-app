import Link from 'next/link'
import { ArrowLeftIcon, DownloadIcon, CakeIcon } from 'lucide-react'
import { getUpcomingBirthdays } from '@/lib/queries/reports'
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

interface BirthdaysPageProps {
  searchParams: Promise<{
    church_id?: string
    months_ahead?: string
  }>
}

export default async function BirthdaysPage({ searchParams }: BirthdaysPageProps) {
  const params = await searchParams
  const monthsAhead = parseInt(params.months_ahead || '3')

  // Fetch upcoming birthdays
  const birthdays = await getUpcomingBirthdays({
    church_id: params.church_id,
    months_ahead: monthsAhead,
  })

  // Sort by next birthday date
  const sorted = birthdays.sort((a, b) => {
    const aDate = getNextBirthdayDate(a.birthday!)
    const bDate = getNextBirthdayDate(b.birthday!)
    return aDate.getTime() - bDate.getTime()
  })

  // Group by month
  type BirthdayMember = typeof birthdays[number]
  const byMonth = sorted.reduce((acc, member) => {
    const nextDate = getNextBirthdayDate(member.birthday!)
    const monthKey = nextDate.toLocaleString('default', { month: 'long', year: 'numeric' })
    if (!acc[monthKey]) acc[monthKey] = []
    acc[monthKey].push(member)
    return acc
  }, {} as Record<string, BirthdayMember[]>)

  // Count birthdays this month
  const thisMonth = sorted.filter((member) => {
    const nextDate = getNextBirthdayDate(member.birthday!)
    const today = new Date()
    return (
      nextDate.getMonth() === today.getMonth() &&
      nextDate.getFullYear() === today.getFullYear()
    )
  }).length

  // Count milestone birthdays (50, 60, 70, 80, etc.)
  const milestones = sorted.filter(
    (member) => member.age >= 50 && member.age % 10 === 0
  ).length

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
            <h1 className="font-display text-3xl font-bold ">
              Birthday Report
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Upcoming member birthdays and celebrations
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
            <CardTitle className="text-3xl">{birthdays.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">
              In the next {monthsAhead} months
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>This Month</CardDescription>
            <CardTitle className="text-3xl">{thisMonth}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Milestone Birthdays</CardDescription>
            <CardTitle className="text-3xl">{milestones}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">
              50, 60, 70+ year birthdays
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Birthdays grouped by month */}
      {(Object.entries(byMonth) as [string, BirthdayMember[]][]).map(([month, members]) => (
        <Card key={month}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CakeIcon className="h-5 w-5 text-pink-600" />
              {month}
            </CardTitle>
            <CardDescription>
              {members.length} {members.length === 1 ? 'birthday' : 'birthdays'} this month
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member Name</TableHead>
                    <TableHead>Church</TableHead>
                    <TableHead>Birthday</TableHead>
                    <TableHead>Days Until</TableHead>
                    <TableHead>Turning Age</TableHead>
                    <TableHead>Contact</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((member) => {
                    const nextDate = getNextBirthdayDate(member.birthday!)
                    const daysUntil = Math.ceil(
                      (nextDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                    )
                    const isMilestone = member.age >= 50 && member.age % 10 === 0
                    return (
                      <TableRow key={member.id}>
                        <TableCell className="font-medium">
                          {member.full_name}
                          {isMilestone && (
                            <CakeIcon className="ml-2 inline h-4 w-4 text-pink-600" />
                          )}
                        </TableCell>
                        <TableCell>{member.churches?.name}</TableCell>
                        <TableCell>
                          {new Date(member.birthday!).toLocaleDateString('default', {
                            month: 'long',
                            day: 'numeric',
                          })}
                        </TableCell>
                        <TableCell>
                          {daysUntil === 0 ? (
                            <Badge variant="default" className="bg-pink-600">
                              Today!
                            </Badge>
                          ) : daysUntil === 1 ? (
                            <Badge variant="default" className="bg-pink-500">
                              Tomorrow
                            </Badge>
                          ) : (
                            <span className="text-sm text-gray-500">{daysUntil} days</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={isMilestone ? 'default' : 'outline'}>
                            {member.age} {isMilestone && 'Years'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {member.phone_number || member.email || '-'}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Empty state */}
      {birthdays.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CakeIcon className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-lg font-medium ">No upcoming birthdays</p>
            <p className="text-sm text-gray-500 mt-1">
              No birthdays found in the next {monthsAhead} months
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

/**
 * Get the next birthday date for a given date of birth
 */
function getNextBirthdayDate(birthday: string): Date {
  const birth = new Date(birthday)
  const today = new Date()
  const thisYearBirthday = new Date(
    today.getFullYear(),
    birth.getMonth(),
    birth.getDate()
  )

  // If birthday already passed this year, return next year's date
  if (thisYearBirthday < today) {
    return new Date(
      today.getFullYear() + 1,
      birth.getMonth(),
      birth.getDate()
    )
  }

  return thisYearBirthday
}
