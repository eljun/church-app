import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getEventById } from '@/lib/queries/events'
import { getChurches, getCountries, getDistricts } from '@/lib/queries/churches'
import { EventForm } from '@/components/events/event-form'

interface EventEditPageProps {
  params: Promise<{ id: string }>
}

export default async function EventEditPage({ params }: EventEditPageProps) {
  const { id } = await params
  const supabase = await createClient()

  // Check authentication
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Get user data
  const { data: userData } = await supabase
    .from('users')
    .select('role, church_id')
    .eq('id', user.id)
    .single()

  if (!userData) {
    redirect('/login')
  }

  try {
    // Fetch event, churches, countries, and districts
    const [event, { data: churches }, countries, districts] = await Promise.all([
      getEventById(id),
      getChurches({ limit: 1000, offset: 0 }),
      getCountries(),
      getDistricts(),
    ])

    // Convert event to form data
    const initialData = {
      id: event.id,
      church_id: event.church_id,
      title: event.title,
      description: event.description,
      event_type: event.event_type,
      event_scope: event.event_scope,
      scope_value: event.scope_value,
      start_date: event.start_date,
      end_date: event.end_date,
      location: event.location,
      image_url: event.image_url,
      is_public: event.is_public,
    }

    return (
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Page header */}
        <div>
          <h1 className="font-display text-3xl  text-primary">Edit Event</h1>
          <p className="mt-1 text-sm text-foreground">
            Update event details and settings
          </p>
        </div>

        {/* Form */}
        <div className="bg-white border border-primary/20 p-6 rounded-lg overflow-hidden">
          <EventForm
            churches={churches}
            userRole={userData.role}
            userChurchId={userData.church_id}
            countries={countries}
            districts={districts}
            initialData={initialData}
            mode="edit"
          />
        </div>
      </div>
    )
  } catch {
    notFound()
  }
}
