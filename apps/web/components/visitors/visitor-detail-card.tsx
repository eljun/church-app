'use client'

import { Phone, Mail, MapPin, Calendar, User, Building2, Users } from 'lucide-react'
import type { Visitor } from '@church-app/database'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { formatDistanceToNow } from 'date-fns'

interface VisitorDetailCardProps {
  visitor: Visitor
}

export function VisitorDetailCard({ visitor }: VisitorDetailCardProps) {
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

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Visitor Information</CardTitle>
          <Badge className={getStatusColor(visitor.follow_up_status)}>
            {visitor.follow_up_status.replace('_', ' ')}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Basic Info */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Type</p>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <Badge variant="secondary">{visitor.visitor_type}</Badge>
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Age</p>
            <p className="text-sm">{visitor.age || 'N/A'}</p>
          </div>

          {visitor.birthday && (
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Birthday</p>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                {new Date(visitor.birthday).toLocaleDateString()}
              </div>
            </div>
          )}

          {visitor.gender && (
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Gender</p>
              <p className="text-sm capitalize">{visitor.gender}</p>
            </div>
          )}
        </div>

        <Separator />

        {/* Contact Info */}
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-3">Contact Information</p>
          <div className="space-y-3">
            {visitor.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <a href={`tel:${visitor.phone}`} className="text-sm hover:underline">
                  {visitor.phone}
                </a>
              </div>
            )}
            {visitor.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a href={`mailto:${visitor.email}`} className="text-sm hover:underline">
                  {visitor.email}
                </a>
              </div>
            )}
            {(visitor.address || visitor.city || visitor.province || visitor.country) && (
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div className="text-sm">
                  {visitor.address && <p>{visitor.address}</p>}
                  <p>
                    {[visitor.city, visitor.province, visitor.country]
                      .filter(Boolean)
                      .join(', ')}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Emergency Contact */}
        {visitor.emergency_contact_name && (
          <>
            <Separator />
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-3">
                Emergency Contact
              </p>
              <div className="space-y-2">
                <p className="text-sm">
                  <strong>{visitor.emergency_contact_name}</strong>
                  {visitor.relationship && ` (${visitor.relationship})`}
                </p>
                {visitor.emergency_contact_phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a
                      href={`tel:${visitor.emergency_contact_phone}`}
                      className="text-sm hover:underline"
                    >
                      {visitor.emergency_contact_phone}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Church Association */}
        {visitor.associated_church_id && (
          <>
            <Separator />
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-3">
                Associated Church
              </p>
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <div className="text-sm">
                  <p className="font-medium">Church ID: {visitor.associated_church_id}</p>
                  <p className="text-xs text-muted-foreground">
                    {visitor.association_reason || 'Not specified'}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Assigned User */}
        {visitor.assigned_to_user_id && (
          <>
            <Separator />
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-3">
                Assigned To
              </p>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm">User ID: {visitor.assigned_to_user_id}</p>
              </div>
            </div>
          </>
        )}

        {/* Additional Info */}
        <Separator />
        <div className="space-y-3">
          {visitor.referral_source && (
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Referral Source</p>
              <Badge variant="outline">{visitor.referral_source.replace('_', ' ')}</Badge>
            </div>
          )}

          {visitor.first_visit_date && (
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">First Visit</p>
              <p className="text-sm">
                {formatDistanceToNow(new Date(visitor.first_visit_date), {
                  addSuffix: true,
                })}
              </p>
            </div>
          )}

          {visitor.notes && (
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Notes</p>
              <p className="text-sm whitespace-pre-wrap">{visitor.notes}</p>
            </div>
          )}

          {visitor.follow_up_notes && (
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Follow-up Notes</p>
              <p className="text-sm whitespace-pre-wrap">{visitor.follow_up_notes}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
