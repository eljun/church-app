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

interface TransferHistory {
  id: string
  transfer_date: string
  from_church: string
  to_church: string
  from_church_id: string
  to_church_id: string
  notes: string | null
  members: {
    id: string
    full_name: string
  }
}

interface TransferHistoryTableProps {
  history: TransferHistory[]
}

export function TransferHistoryTable({ history }: TransferHistoryTableProps) {
  if (history.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
        <p className="text-gray-500">No transfer history found</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Member</TableHead>
            <TableHead>From Church</TableHead>
            <TableHead>To Church</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Notes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {history.map((record) => (
            <TableRow key={record.id}>
              <TableCell>
                <Link
                  href={`/members/${record.members.id}`}
                  className="font-medium text-blue-600 hover:underline"
                >
                  {record.members.full_name}
                </Link>
              </TableCell>
              <TableCell>
                <Link
                  href={`/churches/${record.from_church_id}`}
                  className="text-sm text-gray-600 hover:underline"
                >
                  {record.from_church}
                </Link>
              </TableCell>
              <TableCell>
                <Link
                  href={`/churches/${record.to_church_id}`}
                  className="text-sm font-medium text-blue-600 hover:underline"
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
