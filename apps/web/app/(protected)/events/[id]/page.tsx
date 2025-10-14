import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Pencil, Calendar, MapPin, Building2, Clock, Users, ImageIcon } from 'lucide-react'
import { getEventById } from '@/lib/queries/events'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

interface EventDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function EventDetailPage({ params }: EventDetailPageProps) {
  const { id } = await params

  try {
    const event = await getEventById(id)

    const formatDateTime = (date: string) => {
      return new Date(date).toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    }

    const getEventTypeBadge = (type: string) => {
      const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline', label: string }> = {
        service: { variant: 'secondary', label: 'Service' },
        baptism: { variant: 'default', label: 'Baptism' },
        conference: { variant: 'secondary', label: 'Conference' },
        social: { variant: 'outline', label: 'Social' },
        other: { variant: 'outline', label: 'Other' },
      }

      return (
        <Badge variant={variants[type]?.variant || 'outline'}>
          {variants[type]?.label || type}
        </Badge>
      )
    }

    const isUpcoming = new Date(event.start_date) > new Date()

    return (
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header with back button */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" asChild>
            <Link href="/events">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Events
            </Link>
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href={`/events/${id}/edit`}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </Button>
          </div>
        </div>

        {/* Event Image */}
        <div className="relative h-64 md:h-96 w-full overflow-hidden bg-gray-100">
          {event.image_url ? (
            <Image
              src={event.image_url}
              alt={event.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
              priority
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <ImageIcon className="h-16 w-16 text-gray-400" />
            </div>
          )}
        </div>

        {/* Event Info Card */}
        <div className="bg-white border border-primary/20 p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="space-y-2">
              <h1 className="font-display text-3xl  text-primary">
                {event.title}
              </h1>
              <div className="flex items-center gap-2">
                {getEventTypeBadge(event.event_type)}
                {isUpcoming && (
                  <Badge variant="secondary">Upcoming</Badge>
                )}
                {event.is_public ? (
                  <Badge variant="outline">Public</Badge>
                ) : (
                  <Badge variant="destructive">Private</Badge>
                )}
              </div>
            </div>
          </div>

          <Separator className="my-6" />

          {/* Event Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Start Date & Time */}
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Start Date & Time</p>
                <p className="text-base font-medium">{formatDateTime(event.start_date)}</p>
              </div>
            </div>

            {/* End Date & Time */}
            {event.end_date && (
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">End Date & Time</p>
                  <p className="text-base font-medium">{formatDateTime(event.end_date)}</p>
                </div>
              </div>
            )}

            {/* Location */}
            {event.location && (
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Location</p>
                  <p className="text-base font-medium">{event.location}</p>
                </div>
              </div>
            )}

            {/* Church */}
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Church</p>
                <p className="text-base font-medium">
                  {event.churches?.name || 'All Churches (Organization-wide)'}
                </p>
              </div>
            </div>

            {/* Created By */}
            {event.users && (
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Created By</p>
                  <p className="text-base font-medium">{event.users.email}</p>
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          {event.description && (
            <>
              <Separator className="my-6" />
              <div>
                <h2 className="text-lg font-semibold mb-3">Description</h2>
                <p className="text-muted-foreground whitespace-pre-wrap">{event.description}</p>
              </div>
            </>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg border border-primary/20 p-6">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" asChild>
              <Link href={`/events/${id}/edit`}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit Event
              </Link>
            </Button>
            {/* Add more quick actions as needed */}
          </div>
        </div>
      </div>
    )
  } catch {
    notFound()
  }
}
