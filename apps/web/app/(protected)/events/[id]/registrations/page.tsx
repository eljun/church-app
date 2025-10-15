import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, UserPlus, Users, CheckCircle, XCircle, TrendingUp } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getEventById } from '@/lib/queries/events'
import {
  getEventRegistrations,
  getEventRegistrationStats,
  getAvailableMembersForEvent,
} from '@/lib/queries/event-registrations'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { StatisticsCard } from '@/components/reports/statistics-card'
import { RegisterMembersDialog } from '@/components/events/registrations/register-members-dialog'
import { RegisterVisitorDialog } from '@/components/events/registrations/register-visitor-dialog'
import { RegistrationsTable } from '@/components/events/registrations/registrations-table'

interface EventRegistrationsPageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ page?: string }>
}

export default async function EventRegistrationsPage({ params, searchParams }: EventRegistrationsPageProps) {
  const { id } = await params
  const { page: pageParam } = await searchParams
  const supabase = await createClient()

  try {
    // Pagination
    const page = parseInt(pageParam || '1')
    const limit = 20
    const offset = (page - 1) * limit

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    const { data: currentUser } = await supabase
      .from('users')
      .select('role, church_id')
      .eq('id', user?.id || '')
      .single()

    if (!currentUser) {
      return null
    }

    // Fetch all churches for visitor church association
    const { data: churches } = await supabase
      .from('churches')
      .select('*')
      .eq('is_active', true)
      .order('name')

    const [event, { data: registrations, count }, stats, availableMembers] = await Promise.all([
      getEventById(id),
      getEventRegistrations(id, { limit, offset }),
      getEventRegistrationStats(id),
      getAvailableMembersForEvent(id),
    ])

    const totalPages = Math.ceil(count / limit)

    return (
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/events/${id}`}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Event
                </Link>
              </Button>
            </div>
            <h1 className="font-display text-3xl text-primary">
              Event Registrations
            </h1>
            <p className="text-muted-foreground">{event.title}</p>
          </div>
          {currentUser.role !== 'member' && (
            <div className="flex gap-2">
              <RegisterMembersDialog
                eventId={id}
                availableMembers={availableMembers}
              />
              <RegisterVisitorDialog
                eventId={id}
                churches={churches || []}
                defaultChurchId={currentUser.role === 'admin' ? currentUser.church_id || undefined : undefined}
              />
            </div>
          )}
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatisticsCard
            title="Total Registered"
            value={stats.total}
            description="All members"
            icon={Users}
          />
          {/* <StatisticsCard
            title="Pre-Event"
            value={stats.registered}
            description="Pending confirmation"
            icon={Clock}
          /> */}
          <StatisticsCard
            title="Attended"
            value={stats.attended}
            description="Confirmed present"
            icon={CheckCircle}
          />
          <StatisticsCard
            title="No Show"
            value={stats.no_show}
            description="Did not attend"
            icon={XCircle}
          />
          <StatisticsCard
            title="Attendance Rate"
            value={
              stats.attended + stats.no_show > 0
                ? `${Math.round((stats.attended / (stats.attended + stats.no_show)) * 100)}%`
                : 'N/A'
            }
            description="Success rate"
            icon={TrendingUp}
          />
        </div>

        {/* Section Title */}
        <div>
          <h2 className="text-lg font-semibold text-primary">Registered Attendees</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Members and visitors registered for this event ({count.toLocaleString()} total)
          </p>
        </div>

        {/* Registrations Table */}
        <RegistrationsTable
          registrations={registrations}
          userRole={currentUser.role}
          currentPage={page}
          totalPages={totalPages}
          totalCount={count}
          eventId={id}
        />

        {/* Attendance Confirmation Link - Only for superadmin and coordinator */}
        {(currentUser.role === 'superadmin' || currentUser.role === 'coordinator') && registrations.length > 0 && (
          <Card className="border-primary/50 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Confirm Attendance
              </CardTitle>
              <CardDescription>
                Mark which registered members actually attended the event
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href={`/events/${id}/attendance`}>
                  Go to Attendance Confirmation
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    )
  } catch {
    notFound()
  }
}
