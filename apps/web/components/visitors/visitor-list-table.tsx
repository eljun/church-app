'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Search, Phone, Mail, Eye, Clock } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
}

export function VisitorListTable({ visitors }: VisitorListTableProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')

  // Filter visitors
  const filteredVisitors = useMemo(() => {
    return visitors.filter((visitor) => {
      // Search filter
      const matchesSearch =
        searchQuery === '' ||
        visitor.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        visitor.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        visitor.email?.toLowerCase().includes(searchQuery.toLowerCase())

      // Status filter
      const matchesStatus =
        statusFilter === 'all' || visitor.follow_up_status === statusFilter

      // Type filter
      const matchesType = typeFilter === 'all' || visitor.visitor_type === typeFilter

      return matchesSearch && matchesStatus && matchesType
    })
  }, [visitors, searchQuery, statusFilter, typeFilter])

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
      {/* Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 gap-4">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, phone, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="contacted">Contacted</SelectItem>
              <SelectItem value="interested">Interested</SelectItem>
              <SelectItem value="not_interested">Not Interested</SelectItem>
              <SelectItem value="converted">Converted</SelectItem>
            </SelectContent>
          </Select>

          {/* Type Filter */}
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="adult">Adult</SelectItem>
              <SelectItem value="youth">Youth</SelectItem>
              <SelectItem value="child">Child</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Results count */}
        <div className="text-sm text-muted-foreground">
          Showing {filteredVisitors.length} of {visitors.length} visitors
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
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
            {filteredVisitors.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No visitors found
                </TableCell>
              </TableRow>
            ) : (
              filteredVisitors.map((visitor) => (
                <TableRow key={visitor.id}>
                  {/* Name */}
                  <TableCell className="font-medium">
                    <Link
                      href={`/visitors/${visitor.id}`}
                      className="hover:underline"
                    >
                      {visitor.full_name}
                    </Link>
                  </TableCell>

                  {/* Contact */}
                  <TableCell>
                    <div className="flex flex-col gap-1 text-sm">
                      {visitor.phone && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          <span>{visitor.phone}</span>
                        </div>
                      )}
                      {visitor.email && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          <span className="truncate max-w-[200px]">{visitor.email}</span>
                        </div>
                      )}
                    </div>
                  </TableCell>

                  {/* Type */}
                  <TableCell>
                    <Badge className={getTypeColor(visitor.visitor_type)}>
                      {visitor.visitor_type}
                    </Badge>
                  </TableCell>

                  {/* Follow-up Status */}
                  <TableCell>
                    <Badge className={getStatusColor(visitor.follow_up_status)}>
                      {visitor.follow_up_status.replace('_', ' ')}
                    </Badge>
                  </TableCell>

                  {/* First Visit */}
                  <TableCell className="text-sm text-muted-foreground">
                    {visitor.first_visit_date ? (
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(visitor.first_visit_date), {
                          addSuffix: true,
                        })}
                      </div>
                    ) : (
                      '-'
                    )}
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="text-right">
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/visitors/${visitor.id}`}>
                        <Eye className="h-4 w-4 mr-1" />
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
    </div>
  )
}
