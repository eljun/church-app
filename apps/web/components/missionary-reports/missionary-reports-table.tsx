'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { Eye, Edit, Trash2, FileText } from 'lucide-react'
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { deleteMissionaryReport } from '@/lib/actions/missionary-reports'
import type { MissionaryReport } from '@church-app/database'

type MissionaryReportWithChurch = MissionaryReport & {
  churches?: {
    id: string
    name: string
    field: string
    district: string
  } | null
  reported_by_user?: {
    id: string
    email: string
  } | null
}

interface MissionaryReportsTableProps {
  reports: MissionaryReportWithChurch[]
  userRole: string
  currentPage: number
  totalPages: number
  totalCount: number
}

export function MissionaryReportsTable({
  reports,
  userRole,
  currentPage,
  totalPages,
  totalCount,
}: MissionaryReportsTableProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  const getReportTypeBadge = (reportType: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'outline', label: string }> = {
      weekly: { variant: 'default', label: 'Weekly' },
      biennial: { variant: 'secondary', label: 'Biennial' },
      triennial: { variant: 'outline', label: 'Triennial' },
    }

    const config = variants[reportType] || { variant: 'default' as const, label: reportType }

    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const calculateTotalActivities = (report: MissionaryReport) => {
    return (
      report.bible_studies_given +
      report.home_visits +
      report.seminars_conducted +
      report.conferences_conducted +
      report.public_lectures +
      report.pamphlets_distributed +
      report.books_distributed +
      report.magazines_distributed +
      report.youth_anchor
    )
  }

  const handleDeleteClick = (reportId: string) => {
    setSelectedReportId(reportId)
    setDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!selectedReportId) return

    setIsDeleting(true)
    const result = await deleteMissionaryReport(selectedReportId)

    if ('error' in result) {
      toast.error(result.error)
    } else {
      toast.success('Missionary report deleted successfully')
      router.refresh()
    }

    setIsDeleting(false)
    setDeleteDialogOpen(false)
    setSelectedReportId(null)
  }

  const formatDate = (date: string) => {
    return format(new Date(date), 'PPP')
  }

  if (reports.length === 0) {
    return (
      <div className="text-center py-12 border bg-muted/20">
        <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground mb-4">No missionary reports found</p>
        <Link href="/missionary-reports/new">
          <Button>Create Your First Report</Button>
        </Link>
      </div>
    )
  }

  const itemsPerPage = 20
  const startItem = (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalCount)

  return (
    <div className="space-y-4">
      {/* Table */}
      <div className="bg-white border border-primary/20">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Report Date</TableHead>
              <TableHead>Church</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-center">Bible Studies</TableHead>
              <TableHead className="text-center">Home Visits</TableHead>
              <TableHead className="text-center">Literature</TableHead>
              <TableHead className="text-center">Total Activities</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reports.map((report) => {
              const totalLiterature =
                report.pamphlets_distributed + report.books_distributed + report.magazines_distributed
              const totalActivities = calculateTotalActivities(report)

              return (
                <TableRow key={report.id}>
                  <TableCell className="font-medium">{formatDate(report.report_date)}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{report.churches?.name || 'Unknown Church'}</div>
                      <div className="text-sm text-muted-foreground">
                        {report.churches?.district || 'N/A'} • {report.churches?.field || 'N/A'}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getReportTypeBadge(report.report_type)}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline">{report.bible_studies_given}</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline">{report.home_visits}</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline">{totalLiterature}</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge>{totalActivities}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          Actions
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/missionary-reports/${report.id}`} className="cursor-pointer">
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/missionary-reports/${report.id}/edit`} className="cursor-pointer">
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </Link>
                        </DropdownMenuItem>
                        {(userRole === 'superadmin' || userRole === 'admin' || userRole === 'pastor') && (
                          <DropdownMenuItem
                            onClick={() => handleDeleteClick(report.id)}
                            className="text-destructive cursor-pointer"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
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
              onClick={() => router.push(`/missionary-reports?page=${currentPage - 1}`)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => router.push(`/missionary-reports?page=${currentPage + 1}`)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Missionary Report?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this missionary report. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive text-destructive-foreground">
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
