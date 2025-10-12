import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Pencil, MapPin, Calendar, Users, Building2 } from 'lucide-react'
import { getChurchById } from '@/lib/queries/churches'
import { getMembers } from '@/lib/queries/members'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ImageGallery } from '@/components/ui/image-gallery'
import { DeleteChurchButton } from '@/components/churches/delete-church-button'

interface ChurchDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function ChurchDetailPage({ params }: ChurchDetailPageProps) {
  const { id } = await params

  try {
    // Fetch church data and members count
    const [church, membersData] = await Promise.all([
      getChurchById(id),
      getMembers({ church_id: id, limit: 1, offset: 0 }),
    ])

    const formatDate = (date: string | null) => {
      if (!date) return 'N/A'
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    }

    const getStatusBadge = (isActive: boolean) => {
      return (
        <Badge variant={isActive ? 'default' : 'secondary'}>
          {isActive ? 'Active' : 'Inactive'}
        </Badge>
      )
    }

    const calculateYearsSince = (date: string | null) => {
      if (!date) return null
      const established = new Date(date)
      const today = new Date()
      const years = today.getFullYear() - established.getFullYear()
      return years
    }

    const yearsSinceEstablished = calculateYearsSince(church.established_date)
    const memberCount = membersData.count

    return (
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header with back button */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" asChild>
            <Link href="/churches">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Churches
            </Link>
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href={`/churches/${id}/edit`}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </Button>
            <DeleteChurchButton churchId={id} churchName={church.name} />
          </div>
        </div>

        {/* Church Info Card */}
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="font-display text-3xl font-bold ">
                {church.name}
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Church ID: {church.id.slice(0, 8)}...
              </p>
            </div>
            <div className="flex gap-2">
              {getStatusBadge(church.is_active)}
            </div>
          </div>

          <Separator className="my-6" />

          {/* Church Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Field & District */}
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                <Building2 className="h-5 w-5 text-gray-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Field & District</p>
                <p className="mt-1 text-base ">
                  {church.field}
                </p>
                <p className="text-sm text-gray-500">{church.district}</p>
              </div>
            </div>

            {/* Location */}
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                <MapPin className="h-5 w-5 text-gray-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Location</p>
                <p className="mt-1 text-base ">
                  {church.city && church.province
                    ? `${church.city}, ${church.province}`
                    : church.city || church.province || 'N/A'}
                </p>
                {church.address && (
                  <p className="mt-1 text-sm text-gray-600">{church.address}</p>
                )}
              </div>
            </div>

            {/* Established Date */}
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                <Calendar className="h-5 w-5 text-gray-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Established</p>
                <p className="mt-1 text-base ">
                  {formatDate(church.established_date)}
                </p>
                {yearsSinceEstablished !== null && yearsSinceEstablished > 0 && (
                  <p className="text-sm text-gray-500">
                    {yearsSinceEstablished} year{yearsSinceEstablished !== 1 ? 's' : ''} ago
                  </p>
                )}
              </div>
            </div>

            {/* Member Count */}
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                <Users className="h-5 w-5 text-gray-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Members</p>
                <p className="mt-1 text-base ">
                  {memberCount.toLocaleString()} {memberCount === 1 ? 'member' : 'members'}
                </p>
                {memberCount > 0 && (
                  <Link
                    href={`/members?church_id=${id}`}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    View all members
                  </Link>
                )}
              </div>
            </div>

            {/* Coordinates */}
            {(church.latitude || church.longitude) && (
              <div className="flex items-start gap-3 md:col-span-2">
                <div className="mt-0.5">
                  <MapPin className="h-5 w-5 text-gray-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Coordinates</p>
                  <p className="mt-1 text-base ">
                    {church.latitude}, {church.longitude}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
          
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Members</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="font-display text-2xl font-bold">{memberCount}</div>
              <p className="text-xs text-muted-foreground">
                Registered in the system
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Field</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="font-display text-2xl font-bold">{church.field}</div>
              <p className="text-xs text-muted-foreground">
                Organization field
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">District</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="font-display text-2xl font-bold">{church.district}</div>
              <p className="text-xs text-muted-foreground">
                Geographic district
              </p>
            </CardContent>
          </Card>
        </div>
        
        {/* Church Images Gallery */}
        {church.images && church.images.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="font-display">Church Images</CardTitle>
              <p className="text-sm text-gray-500">
                {church.images.length} {church.images.length === 1 ? 'image' : 'images'}
              </p>
            </CardHeader>
            <CardContent>
              <ImageGallery images={church.images} alt={church.name} />
            </CardContent>
          </Card>
        )}
        
      </div>
    )
  } catch {
    notFound()
  }
}
