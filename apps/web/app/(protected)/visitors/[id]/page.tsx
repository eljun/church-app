import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Calendar } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getVisitorById } from '@/lib/queries/visitors'
import { getVisitorActivities } from '@/lib/queries/visitor-activities'
import { getVisitorAttendanceHistory } from '@/lib/queries/attendance'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { VisitorDetailCard } from '@/components/visitors/visitor-detail-card'
import { FollowUpActivityLog } from '@/components/visitors/follow-up-activity-log'
import { VisitorActionsMenu } from '@/components/visitors/visitor-actions-menu'

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

    // Check if visitor is converted
    const isConverted = visitor.follow_up_status === 'converted'

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
              <div className="flex items-center gap-3">
                <h1 className="font-display text-3xl text-primary">{visitor.full_name}</h1>
                {isConverted && (
                  <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                    Converted to Member
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {isConverted ? 'Visitor Record (Read-only)' : 'Visitor Details & Follow-up'}
              </p>
            </div>
          </div>

          {/* Action Menu - Hidden for converted visitors */}
          {!isConverted && (
            <VisitorActionsMenu
              visitor={visitor}
              currentUser={currentUser}
              visitorId={id}
            />
          )}
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
              isConverted={isConverted}
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
