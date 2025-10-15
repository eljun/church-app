import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Phone, Mail, MapPin, Calendar, User, Building2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getVisitorById } from '@/lib/queries/visitors'
import { getVisitorActivities } from '@/lib/queries/visitor-activities'
import { getVisitorAttendanceHistory } from '@/lib/queries/attendance'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { VisitorDetailCard } from '@/components/visitors/visitor-detail-card'
import { FollowUpActivityLog } from '@/components/visitors/follow-up-activity-log'
import { UpdateFollowUpStatusDialog } from '@/components/visitors/update-follow-up-status-dialog'
import { AssignVisitorDialog } from '@/components/visitors/assign-visitor-dialog'
import { ConvertToMemberDialog } from '@/components/visitors/convert-to-member-dialog'
import { AddActivityDialog } from '@/components/visitors/add-activity-dialog'

interface VisitorDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function VisitorDetailPage({ params }: VisitorDetailPageProps) {
  const { id } = await params
  const supabase = await createClient()

  // Get current user
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) {
    redirect('/login')
  }

  // Get user details
  const { data: currentUser } = await supabase
    .from('users')
    .select('*')
    .eq('id', authUser.id)
    .single()

  if (!currentUser) {
    redirect('/login')
  }

  try {
    // Get visitor details
    const visitor = await getVisitorById(id)

    if (!visitor) {
      notFound()
    }

    // Get visitor activities
    const activities = await getVisitorActivities(id)

    // Get attendance history
    const attendanceHistory = await getVisitorAttendanceHistory(id)

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button asChild variant="ghost" size="sm">
              <Link href="/visitors">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Visitors
              </Link>
            </Button>
            <div>
              <h1 className="font-display text-3xl text-primary">{visitor.full_name}</h1>
              <p className="text-sm text-muted-foreground">Visitor Details & Follow-up</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <AddActivityDialog visitorId={id} />
            <UpdateFollowUpStatusDialog visitor={visitor} />
            <AssignVisitorDialog visitor={visitor} currentUser={currentUser} />
            {visitor.follow_up_status !== 'converted' && (
              <ConvertToMemberDialog visitor={visitor} />
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="grid gap-6 md:grid-cols-3">
          {/* Left Column - Visitor Details */}
          <div className="md:col-span-2 space-y-6">
            <VisitorDetailCard visitor={visitor} />

            {/* Attendance History */}
            <Card>
              <CardHeader>
                <CardTitle>Attendance History</CardTitle>
                <CardDescription>
                  Church visits and event attendance
                </CardDescription>
              </CardHeader>
              <CardContent>
                {attendanceHistory.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No attendance records yet
                  </p>
                ) : (
                  <div className="space-y-2">
                    {attendanceHistory.map((record) => (
                      <div
                        key={record.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">
                              {record.service_type.replace('_', ' ')}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(record.attendance_date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        {record.churches && (
                          <Badge variant="outline">
                            {(record.churches as any).name}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Activity Log */}
          <div>
            <FollowUpActivityLog
              activities={activities}
              visitorId={id}
            />
          </div>
        </div>
      </div>
    )
  } catch (error) {
    console.error('Error loading visitor:', error)
    notFound()
  }
}
