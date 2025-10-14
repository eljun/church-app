import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getChurches, getCountries, getDistricts } from '@/lib/queries/churches'
import { EventForm } from '@/components/events/event-form'

export default async function NewEventPage() {
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

  // Fetch churches, countries, and districts for dropdown
  const { data: churches } = await getChurches({ limit: 1000, offset: 0 })
  const countries = await getCountries()
  const districts = await getDistricts()

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page header */}
      <div>
        <h1 className="font-display text-3xl  text-primary">Create New Event</h1>
        <p className="mt-1 text-sm text-foreground">
          Add a new event or activity to the calendar
        </p>
      </div>

      {/* Form */}
      <div className="bg-white border border-primary/20 p-6 overflow-hidden">
        <EventForm
          churches={churches}
          userRole={userData.role}
          userChurchId={userData.church_id}
          countries={countries}
          districts={districts}
          mode="create"
        />
      </div>
    </div>
  )
}
