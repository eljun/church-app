import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getEventById } from '@/lib/queries/events'
import { getAllEventRegistrations } from '@/lib/queries/event-registrations'
import { Button } from '@/components/ui/button'
import { AttendanceConfirmationForm } from '@/components/events/registrations/attendance-confirmation-form'
import { PageHeader } from '@/components/shared'

interface EventAttendancePageProps {
  params: Promise<{ id: string }>
}

export default async function EventAttendancePage({ params }: EventAttendancePageProps) {
  const { id } = await params
  const supabase = await createClient()

  try {
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

    // Only church_secretary, coordinators, and superadmins can access attendance
    if (!['church_secretary', 'coordinator', 'superadmin'].includes(currentUser.role)) {
      redirect('/events')
    }

    const [event, registrations] = await Promise.all([
      getEventById(id),
      getAllEventRegistrations(id),
    ])

    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <PageHeader
          backHref={`/events/${id}/registrations`}
          title="Event Attendance"
          description={`${event.title} - Mark which members attended or were no-shows`}
        />

        {/* Attendance Confirmation */}
        {registrations.length === 0 ? (
          <div className="text-center py-12 border rounded-lg bg-muted/20">
            <p className="text-muted-foreground">
              No registrations found for this event.
            </p>
            <Button asChild className="mt-4">
              <Link href={`/events/${id}/registrations`}>
                Add Registrations
              </Link>
            </Button>
          </div>
        ) : (
          <AttendanceConfirmationForm
            registrations={registrations}
            eventId={id}
            userRole={currentUser.role}
          />
        )}
      </div>
    )
  } catch {
    notFound()
  }
}
