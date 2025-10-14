import { Suspense } from 'react'
import Link from 'next/link'
import { ArrowLeftIcon, FilterIcon } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'
import { CustomReportBuilder } from '@/components/reports/custom-report-builder'

interface CustomReportsPageProps {
  searchParams: Promise<{
    template?: string
  }>
}

export default async function CustomReportsPage({ searchParams }: CustomReportsPageProps) {
  const params = await searchParams
  const supabase = await createClient()

  // Get user info
  const { data: { user } } = await supabase.auth.getUser()
  const { data: userData } = await supabase
    .from('users')
    .select('role, church_id')
    .eq('id', user?.id || '')
    .single()

  // Get churches for filter
  const { data: churches } = await supabase
    .from('churches')
    .select('id, name')
    .eq('is_active', true)
    .order('name')

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
            <h1 className="font-display text-3xl  text-primary ">
              Custom Reports
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Build and export custom reports with your own filters
            </p>
          </div>
        </div>
      </div>

      {/* Report builder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FilterIcon className="h-5 w-5" />
            Report Builder
          </CardTitle>
          <CardDescription>
            Select the data fields and filters for your custom report
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div className="h-96 animate-pulse bg-gray-100 rounded-lg" />}>
            <CustomReportBuilder
              churches={churches || []}
              userRole={userData?.role || 'member'}
              initialTemplate={params.template}
            />
          </Suspense>
        </CardContent>
      </Card>

      {/* Quick Report Templates */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Report Templates</CardTitle>
          <CardDescription>
            Pre-configured reports you can generate instantly
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <ReportTemplate
              title="Active Members List"
              description="All active members with contact information"
              fields={['Full Name', 'Age', 'Gender', 'Church']}
            />
            <ReportTemplate
              title="Inactive Members"
              description="Members with inactive spiritual condition"
              fields={['Full Name', 'Age', 'Church', 'Status']}
            />
            <ReportTemplate
              title="New Members This Year"
              description="Members who joined in the current year"
              fields={['Full Name', 'Birthday', 'Age', 'Church']}
            />
            <ReportTemplate
              title="Members by Gender"
              description="Gender distribution breakdown"
              fields={['Full Name', 'Age', 'Gender', 'Church']}
            />
            <ReportTemplate
              title="Members Without Baptism"
              description="Members who haven't been baptized yet"
              fields={['Full Name', 'Age', 'Gender', 'Church']}
            />
            <ReportTemplate
              title="Contact Directory"
              description="Complete member contact information"
              fields={['Full Name', 'Birthday', 'Age', 'Church', 'SP']}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function ReportTemplate({
  title,
  description,
  fields,
}: {
  title: string
  description: string
  fields: string[]
}) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription className="text-sm">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p className="text-xs text-gray-500">Includes:</p>
          <div className="flex flex-wrap gap-1">
            {fields.map(field => (
              <span
                key={field}
                className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700"
              >
                {field}
              </span>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
