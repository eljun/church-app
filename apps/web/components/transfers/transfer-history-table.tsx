'use client'

import Link from 'next/link'
import { Calendar } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

interface TransferHistory {
  id: string
  transfer_date: string
  from_church: string
  to_church: string
  from_church_id: string
  to_church_id: string
  notes: string | null
  status?: 'approved' | 'rejected'
  members: {
    id: string
    full_name: string
  } | null
}

interface TransferHistoryTableProps {
  history: TransferHistory[]
}

export function TransferHistoryTable({ history }: TransferHistoryTableProps) {
  if (history.length === 0) {
    return (
      <div className="border border-primary/20 bg-white p-8 text-center">
        <p className="text-gray-500">No transfer history found</p>
      </div>
    )
  }

  return (
    <div className="border border-primary/20 bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Member</TableHead>
            <TableHead>From Church</TableHead>
            <TableHead>To Church</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Notes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {history.map((record) => (
            <TableRow key={record.id}>
              <TableCell className="py-6">
                {record.members ? (
                  <Link
                    href={`/members/${record.members.id}`}
                    className="font-medium hover:underline"
                  >
                    {record.members.full_name}
                  </Link>
                ) : (
                  <span className="text-gray-500 italic">Member Deleted</span>
                )}
              </TableCell>
              <TableCell>
                <Link
                  href={`/churches/${record.from_church_id}`}
                  className="text-sm hover:underline"
                >
                  {record.from_church}
                </Link>
              </TableCell>
              <TableCell>
                <Link
                  href={`/churches/${record.to_church_id}`}
                  className="text-sm font-medium hover:underline"
                >
                  {record.to_church}
                </Link>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="h-3 w-3" />
                  {new Date(record.transfer_date).toLocaleDateString()}
                </div>
              </TableCell>
              <TableCell>
                {record.status === 'rejected' ? (
                  <Badge variant="destructive">Rejected</Badge>
                ) : (
                  <Badge variant="success">Approved</Badge>
                )}
              </TableCell>
              <TableCell>
                <span className="text-sm text-gray-600">
                  {record.notes ? (
                    <span className="max-w-xs truncate block">{record.notes}</span>
                  ) : (
                    <span className="text-gray-400 italic">No notes</span>
                  )}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
