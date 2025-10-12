import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Pencil, Calendar, Church, User, Heart, Activity } from 'lucide-react'
import { getMemberById, getMemberTransferHistory } from '@/lib/queries/members'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { DeleteMemberButton } from '@/components/members/delete-member-button'

interface MemberDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function MemberDetailPage({ params }: MemberDetailPageProps) {
  const { id } = await params

  try {
    const [member, transferHistory] = await Promise.all([
      getMemberById(id),
      getMemberTransferHistory(id),
    ])

    const formatDate = (date: string | null) => {
      if (!date) return 'N/A'
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    }

    const getStatusBadge = (status: string) => {
      const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
        active: 'default',
        transferred_out: 'secondary',
        resigned: 'outline',
        disfellowshipped: 'destructive',
        deceased: 'secondary',
      }

      return (
        <Badge variant={variants[status] || 'default'}>
          {status.replace('_', ' ')}
        </Badge>
      )
    }

    const getSpiritualBadge = (condition: string) => {
      return (
        <Badge variant={condition === 'active' ? 'default' : 'secondary'}>
          {condition}
        </Badge>
      )
    }

    const calculateBaptismAnniversary = (baptismDate: string | null) => {
      if (!baptismDate) return null
      const baptism = new Date(baptismDate)
      const today = new Date()
      const years = today.getFullYear() - baptism.getFullYear()
      return years
    }

    const baptismYears = calculateBaptismAnniversary(member.date_of_baptism)

    return (
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header with back button */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" asChild>
            <Link href="/members">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Members
            </Link>
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href={`/members/${id}/edit`}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </Button>
            <DeleteMemberButton memberId={id} memberName={member.full_name} />
          </div>
        </div>

        {/* Member Info Card */}
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="font-display text-3xl font-bold ">
                {member.full_name}
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Member ID: {member.id.slice(0, 8)}...
              </p>
            </div>
            <div className="flex gap-2">
              {getSpiritualBadge(member.spiritual_condition)}
              {getStatusBadge(member.status)}
            </div>
          </div>

          <Separator className="my-6" />

          {/* Member Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Church */}
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                <Church className="h-5 w-5 text-gray-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Church</p>
                <p className="mt-1 text-base ">
                  {member.churches?.name || 'N/A'}
                </p>
              </div>
            </div>

            {/* Age & Birthday */}
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                <Calendar className="h-5 w-5 text-gray-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Age & Birthday</p>
                <p className="mt-1 text-base ">
                  {member.age} years old
                </p>
                <p className="text-sm text-gray-500">{formatDate(member.birthday)}</p>
              </div>
            </div>

            {/* Baptism */}
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                <Activity className="h-5 w-5 text-gray-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Baptism</p>
                <p className="mt-1 text-base ">
                  {formatDate(member.date_of_baptism)}
                </p>
                {baptismYears !== null && baptismYears > 0 && (
                  <p className="text-sm text-gray-500">
                    {baptismYears} year{baptismYears !== 1 ? 's' : ''} ago
                  </p>
                )}
                {member.baptized_by && (
                  <p className="text-sm text-gray-500">
                    Baptized by: {member.baptized_by}
                  </p>
                )}
              </div>
            </div>

            {/* Physical Condition */}
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                <Heart className="h-5 w-5 text-gray-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Physical Condition</p>
                <p className="mt-1 text-base  capitalize">
                  {member.physical_condition}
                </p>
                {member.illness_description && (
                  <p className="mt-1 text-sm text-gray-600">
                    {member.illness_description}
                  </p>
                )}
              </div>
            </div>

            {/* SP Number */}
            {member.sp && (
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">SP Number</p>
                  <p className="mt-1 text-base ">{member.sp}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Transfer History */}
        {transferHistory.length > 0 && (
          <div className="bg-white rounded-lg border">
            <div className="p-6 border-b">
              <h2 className="font-display text-xl font-bold ">
                Transfer History
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Complete timeline of member transfers
              </p>
            </div>
            <div className="p-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>From Church</TableHead>
                    <TableHead>To Church</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transferHistory.map((transfer) => (
                    <TableRow key={transfer.id}>
                      <TableCell>{formatDate(transfer.transfer_date)}</TableCell>
                      <TableCell>{transfer.from_church_id}</TableCell>
                      <TableCell>{transfer.to_church_id}</TableCell>
                      <TableCell className="text-gray-600">
                        {transfer.notes || 'No notes'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* No Transfer History */}
        {transferHistory.length === 0 && (
          <div className="bg-white rounded-lg border p-6">
            <div className="text-center text-gray-500">
              <Activity className="mx-auto h-12 w-12 text-gray-300" />
              <h3 className="mt-2 text-sm font-medium ">
                No transfer history
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                This member has not been transferred yet.
              </p>
            </div>
          </div>
        )}
      </div>
    )
  } catch {
    notFound()
  }
}
