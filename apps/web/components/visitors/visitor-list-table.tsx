'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Phone, Mail, Eye, Clock, ChevronLeft, ChevronRight } from 'lucide-react'
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
import { formatDistanceToNow } from 'date-fns'

interface Visitor {
  id: string
  full_name: string
  phone: string | null
  email: string | null
  visitor_type: string
  follow_up_status: string
  first_visit_date: string | null
  associated_church_id: string | null
  created_at: string
}

interface VisitorListTableProps {
  visitors: Visitor[]
  currentPage: number
  totalPages: number
  totalCount: number
}

export function VisitorListTable({
  visitors,
  currentPage,
  totalPages,
  totalCount,
}: VisitorListTableProps) {
  const router = useRouter()

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(window.location.search)
    params.set('page', page.toString())
    router.push(`?${params.toString()}`)
  }


  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'contacted':
        return 'bg-blue-100 text-blue-800'
      case 'interested':
        return 'bg-green-100 text-green-800'
      case 'not_interested':
        return 'bg-gray-100 text-gray-800'
      case 'converted':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // Get type badge color
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'adult':
        return 'bg-blue-100 text-blue-800'
      case 'youth':
        return 'bg-green-100 text-green-800'
      case 'child':
        return 'bg-pink-100 text-pink-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-4">
      {/* Table */}
      <div className="border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Follow-up Status</TableHead>
              <TableHead>First Visit</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visitors.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No visitors found
                </TableCell>
              </TableRow>
            ) : (
              visitors.map((visitor) => (
                <TableRow key={visitor.id}>
                  <TableCell>
                    <div className="font-medium">{visitor.full_name}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {visitor.phone && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          {visitor.phone}
                        </div>
                      )}
                      {visitor.email && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          {visitor.email}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getTypeColor(visitor.visitor_type)}>
                      {visitor.visitor_type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(visitor.follow_up_status)}>
                      {visitor.follow_up_status.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {visitor.first_visit_date ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(visitor.first_visit_date), {
                          addSuffix: true,
                        })}
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/visitors/${visitor.id}`}>
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing page {currentPage} of {totalPages} ({totalCount.toLocaleString()} total visitors)
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
