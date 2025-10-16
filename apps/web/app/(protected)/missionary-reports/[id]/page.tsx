import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { Edit, Calendar, MapPin, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { getMissionaryReportById } from '@/lib/queries/missionary-reports'
import { PageHeader } from '@/components/shared'

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export default async function MissionaryReportDetailPage({ params }: PageProps) {
  const supabase = await createClient()

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Await params
  const { id } = await params

  // Get report
  const report = await getMissionaryReportById(id)

  if (!report) {
    notFound()
  }

  const getReportTypeBadge = (reportType: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'outline', label: string }> = {
      weekly: { variant: 'default', label: 'Weekly' },
      biennial: { variant: 'secondary', label: 'Biennial' },
      triennial: { variant: 'outline', label: 'Triennial' },
    }
    return variants[reportType] || { variant: 'default' as const, label: reportType }
  }

  const reportTypeBadge = getReportTypeBadge(report.report_type)

  const totalActivities =
    report.bible_studies_given +
    report.home_visits +
    report.seminars_conducted +
    report.conferences_conducted +
    report.public_lectures +
    report.pamphlets_distributed +
    report.books_distributed +
    report.magazines_distributed +
    report.youth_anchor

  return (
    <div className="space-y-6">
      <PageHeader
        backHref="/missionary-reports"
        title="Missionary Report Details"
        description="View missionary report information"
        actions={
          <Link href={`/missionary-reports/${id}/edit`}>
            <Button>
              <Edit className="mr-2 h-4 w-4" />
              Edit Report
            </Button>
          </Link>
        }
      />

      {/* Report Information */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">{report.churches?.name || 'Unknown Church'}</CardTitle>
              <CardDescription className="flex items-center gap-4 mt-2">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(report.report_date), 'PPPP')}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {report.churches?.district || 'N/A'} • {report.churches?.field || 'N/A'}
                </span>
              </CardDescription>
            </div>
            <Badge variant={reportTypeBadge.variant}>{reportTypeBadge.label}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Reported By:</span>
              <span className="font-medium">{report.reported_by_user?.email || 'Unknown'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Activities:</span>
              <span className="font-bold text-lg">{totalActivities}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Missionary Activities */}
      <Card>
        <CardHeader>
          <CardTitle>Missionary Activities</CardTitle>
          <CardDescription>Activity breakdown for this reporting period</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex justify-between items-center p-3 bg-muted/50 rounded-md">
              <span className="text-sm font-medium">Bible Studies Given</span>
              <Badge variant="outline" className="text-base">
                {report.bible_studies_given}
              </Badge>
            </div>
            <div className="flex justify-between items-center p-3 bg-muted/50 rounded-md">
              <span className="text-sm font-medium">Home Visits</span>
              <Badge variant="outline" className="text-base">
                {report.home_visits}
              </Badge>
            </div>
            <div className="flex justify-between items-center p-3 bg-muted/50 rounded-md">
              <span className="text-sm font-medium">Seminars Conducted</span>
              <Badge variant="outline" className="text-base">
                {report.seminars_conducted}
              </Badge>
            </div>
            <div className="flex justify-between items-center p-3 bg-muted/50 rounded-md">
              <span className="text-sm font-medium">Conferences Conducted</span>
              <Badge variant="outline" className="text-base">
                {report.conferences_conducted}
              </Badge>
            </div>
            <div className="flex justify-between items-center p-3 bg-muted/50 rounded-md">
              <span className="text-sm font-medium">Public Lectures</span>
              <Badge variant="outline" className="text-base">
                {report.public_lectures}
              </Badge>
            </div>
            <div className="flex justify-between items-center p-3 bg-muted/50 rounded-md">
              <span className="text-sm font-medium">Pamphlets Distributed</span>
              <Badge variant="outline" className="text-base">
                {report.pamphlets_distributed}
              </Badge>
            </div>
            <div className="flex justify-between items-center p-3 bg-muted/50 rounded-md">
              <span className="text-sm font-medium">Books Distributed</span>
              <Badge variant="outline" className="text-base">
                {report.books_distributed}
              </Badge>
            </div>
            <div className="flex justify-between items-center p-3 bg-muted/50 rounded-md">
              <span className="text-sm font-medium">Magazines Distributed</span>
              <Badge variant="outline" className="text-base">
                {report.magazines_distributed}
              </Badge>
            </div>
            <div className="flex justify-between items-center p-3 bg-muted/50 rounded-md">
              <span className="text-sm font-medium">Youth Anchor</span>
              <Badge variant="outline" className="text-base">
                {report.youth_anchor}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Information */}
      {(report.highlights || report.challenges || report.notes) && (
        <Card>
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {report.highlights && (
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Highlights
                </h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{report.highlights}</p>
              </div>
            )}

            {report.highlights && report.challenges && <Separator />}

            {report.challenges && (
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Challenges
                </h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{report.challenges}</p>
              </div>
            )}

            {(report.highlights || report.challenges) && report.notes && <Separator />}

            {report.notes && (
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Notes
                </h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{report.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
