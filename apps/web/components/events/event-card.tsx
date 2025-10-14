'use client'

import Link from 'next/link'
import Image from 'next/image'
import { CalendarDays, MapPin, Clock, Building2, ImageIcon } from 'lucide-react'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface Event {
  id: string
  title: string
  description: string | null
  event_type: 'service' | 'baptism' | 'conference' | 'social' | 'other'
  event_scope?: 'national' | 'field' | 'district' | 'church'
  scope_value?: string | null
  start_date: string
  end_date: string | null
  location: string | null
  is_public: boolean
  image_url?: string | null
  churches: {
    name: string
  } | null
}

interface EventCardProps {
  event: Event
}

export function EventCard({ event }: EventCardProps) {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const isUpcoming = new Date(event.start_date) > new Date()

  const getEventTypeColor = (type: Event['event_type']) => {
    const colors: Record<Event['event_type'], string> = {
      service: 'bg-blue-100 text-blue-800 border-blue-200',
      baptism: 'bg-purple-100 text-purple-800 border-purple-200',
      conference: 'bg-green-100 text-green-800 border-green-200',
      social: 'bg-orange-100 text-orange-800 border-orange-200',
      other: 'bg-gray-100 text-gray-800 border-gray-200',
    }
    return colors[type]
  }

  const getScopeBadges = () => {
    const badges: { label: string; variant: 'default' | 'secondary' | 'outline' }[] = []

    if (!event.event_scope || event.event_scope === 'church') {
      return badges
    }

    // Add scope level badge
    const scopeLabels: Record<string, string> = {
      national: 'National',
      field: 'Field',
      district: 'District',
    }
    badges.push({ label: scopeLabels[event.event_scope] || event.event_scope, variant: 'default' })

    // Add scope value badges (for districts, split by comma)
    if (event.scope_value) {
      if (event.event_scope === 'district') {
        const districts = event.scope_value.split(',').filter(Boolean)
        districts.forEach(district => {
          badges.push({ label: district.trim(), variant: 'outline' })
        })
      } else {
        badges.push({ label: event.scope_value, variant: 'outline' })
      }
    }

    return badges
  }

  const scopeBadges = getScopeBadges()

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-200 pt-0">
      {/* Image Header */}
      <div className="relative h-48 w-full overflow-hidden bg-gray-100">
        {event.image_url ? (
          <Image
            src={event.image_url}
            alt={event.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <ImageIcon className="h-12 w-12 text-gray-400" />
          </div>
        )}
      </div>

      <CardHeader className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-lg line-clamp-2">{event.title}</h3>
          {isUpcoming && (
            <Badge variant="secondary" className="shrink-0">
              Upcoming
            </Badge>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${getEventTypeColor(event.event_type)}`}>
            {event.event_type.charAt(0).toUpperCase() + event.event_type.slice(1)}
          </div>
          {scopeBadges.length > 0 && (
            <>
              {scopeBadges.map((badge, index) => (
                <Badge key={index} variant={badge.variant} className="text-xs">
                  {badge.label}
                </Badge>
              ))}
            </>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Description */}
        {event.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {event.description}
          </p>
        )}

        {/* Date & Time */}
        <div className="flex items-center gap-2 text-sm">
          <CalendarDays className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="font-medium">{formatDate(event.start_date)}</span>
          <Clock className="h-4 w-4 text-muted-foreground ml-2 shrink-0" />
          <span className="text-muted-foreground">{formatTime(event.start_date)}</span>
        </div>

        {/* Location */}
        {event.location && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 shrink-0" />
            <span className="line-clamp-1">{event.location}</span>
          </div>
        )}

        {/* Church */}
        {event.churches && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Building2 className="h-4 w-4 shrink-0" />
            <span className="line-clamp-1">{event.churches.name}</span>
          </div>
        )}
      </CardContent>

      <CardFooter>
        <Button asChild variant="outline" className="w-full">
          <Link href={`/events/${event.id}`}>
            View Details
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
