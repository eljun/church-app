import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getEventById } from '@/lib/queries/events'
import { getAllEventRegistrations } from '@/lib/queries/event-registrations'
import { Button } from '@/components/ui/button'
import { AttendanceConfirmationForm } from '@/components/events/registrations/attendance-confirmation-form'

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

    const [event, registrations] = await Promise.all([
      getEventById(id),
      getAllEventRegistrations(id),
    ])

    // Only admins, coordinators, and superadmins can confirm attendance
    if (currentUser.role === 'member') {
      redirect(`/events/${id}`)
    }

    return (
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/events/${id}/registrations`}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Registrations
                </Link>
              </Button>
            </div>
            <h1 className="font-display text-3xl text-primary">
              Event Attendance
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {event.title} - Mark which members attended or were no-shows
            </p>
          </div>
        </div>

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
