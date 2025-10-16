'use client'

import { format } from 'date-fns'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { MissionaryReport } from '@church-app/database'

type MissionaryReportWithChurch = MissionaryReport & {
  churches?: {
    id: string
    name: string
    field: string
    district: string
  } | null
}

interface MissionaryActivitiesTableProps {
  reports: MissionaryReportWithChurch[]
  currentPage: number
  totalPages: number
  totalCount: number
}

export function MissionaryActivitiesTable({
  reports,
  currentPage,
  totalPages,
  totalCount,
}: MissionaryActivitiesTableProps) {
  const router = useRouter()

  if (reports.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No missionary reports found for the selected filters.
      </div>
    )
  }

  const getReportTypeBadge = (reportType: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'outline', label: string }> = {
      weekly: { variant: 'default', label: 'Weekly' },
      biennial: { variant: 'secondary', label: 'Biennial' },
      triennial: { variant: 'outline', label: 'Triennial' },
    }
    return variants[reportType] || { variant: 'default' as const, label: reportType }
  }

  const itemsPerPage = 50
  const startItem = (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalCount)

  return (
    <div className="space-y-4">
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Church</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Bible Studies</TableHead>
              <TableHead className="text-right">Home Visits</TableHead>
              <TableHead className="text-right">Seminars</TableHead>
              <TableHead className="text-right">Literature</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reports.map((report) => {
              const totalLiterature =
                report.pamphlets_distributed + report.books_distributed + report.magazines_distributed
              const totalActivities =
                report.bible_studies_given +
                report.home_visits +
                report.seminars_conducted +
                report.conferences_conducted +
                report.public_lectures +
                totalLiterature +
                report.youth_anchor

              const badgeConfig = getReportTypeBadge(report.report_type)

              return (
                <TableRow key={report.id}>
                  <TableCell className="font-medium">
                    {format(new Date(report.report_date), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{report.churches?.name || 'Unknown'}</div>
                      <div className="text-xs text-muted-foreground">
                        {report.churches?.district || 'N/A'}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={badgeConfig.variant}>{badgeConfig.label}</Badge>
                  </TableCell>
                  <TableCell className="text-right">{report.bible_studies_given}</TableCell>
                  <TableCell className="text-right">{report.home_visits}</TableCell>
                  <TableCell className="text-right">{report.seminars_conducted}</TableCell>
                  <TableCell className="text-right">{totalLiterature}</TableCell>
                  <TableCell className="text-right">
                    <span className="font-semibold">{totalActivities}</span>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {startItem} to {endItem} of {totalCount} reports
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => router.push(`/reports/missionary-activities?page=${currentPage - 1}`)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => router.push(`/reports/missionary-activities?page=${currentPage + 1}`)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
