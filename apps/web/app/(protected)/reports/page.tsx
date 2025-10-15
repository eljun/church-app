import { Suspense } from 'react'
import Link from 'next/link'
import {
  BarChart3Icon,
  TrendingUpIcon,
  ArrowLeftRightIcon,
  CakeIcon,
  CalendarHeartIcon,
  FileTextIcon,
  ClipboardCheckIcon,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const reportCategories = [
  {
    title: 'Attendance Reports',
    description: 'View attendance statistics and trends',
    icon: ClipboardCheckIcon,
    href: '/reports/attendance',
    color: 'text-primary'
  },
  {
    title: 'Member Growth',
    description: 'Track member growth trends over time',
    icon: TrendingUpIcon,
    href: '/reports/member-growth',
    color: 'text-primary'
  },
  {
    title: 'Transfer Reports',
    description: 'Analyze member transfers in and out',
    icon: ArrowLeftRightIcon,
    href: '/reports/transfers',
    color: 'text-primary'
  },
  {
    title: 'Baptism Anniversaries',
    description: 'Upcoming baptism anniversary dates',
    icon: CalendarHeartIcon,
    href: '/reports/baptism-anniversaries',
    color: 'text-primary'
  },
  {
    title: 'Birthdays',
    description: 'Member birthdays and upcoming celebrations',
    icon: CakeIcon,
    href: '/reports/birthdays',
    color: 'text-primary'
  },
  {
    title: 'Statistics Dashboard',
    description: 'Overall church statistics and metrics',
    icon: BarChart3Icon,
    href: '/reports/statistics',
    color: 'text-primary'
  },
  {
    title: 'Custom Reports',
    description: 'Build and export custom reports',
    icon: FileTextIcon,
    href: '/reports/custom',
    color: 'text-primary'
  },
]

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="font-display text-3xl  text-primary ">Reports & Analytics</h1>
        <p className="mt-1 text-sm text-gray-500">
          View insights and generate reports for your church
        </p>
      </div>

      {/* Report categories */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {reportCategories.map((category) => {
          const Icon = category.icon
          return (
            <Card key={category.href} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{category.title}</CardTitle>
                    <CardDescription className="mt-1">
                      {category.description}
                    </CardDescription>
                  </div>
                  <Icon className={`h-6 w-6 ${category.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline" className="w-full">
                  <Link href={category.href}>
                    View Report
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Quick stats */}
      <Suspense fallback={<div className="h-32 animate-pulse bg-gray-100 rounded-lg" />}>
        <QuickStats />
      </Suspense>
    </div>
  )
}

async function QuickStats() {
  // This will be enhanced with actual data later
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Overview</CardTitle>
        <CardDescription>Key metrics at a glance</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-4">
          <div className="space-y-1">
            <p className="text-sm text-gray-500">Total Members</p>
            <p className="text-2xl ">-</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-gray-500">Active Members</p>
            <p className="text-2xl ">-</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-gray-500">Pending Transfers</p>
            <p className="text-2xl ">-</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-gray-500">This Month</p>
            <p className="text-2xl ">-</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
