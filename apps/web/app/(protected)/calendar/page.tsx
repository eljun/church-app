import { redirect } from 'next/navigation'
import { PageHeader } from '@/components/shared'
import { createClient } from '@/lib/supabase/server'
import { getCalendarItemsByDate } from '@/lib/queries/calendar'
import { getMonthRange } from '@/lib/utils/calendar-helpers'
import { CalendarPageClient } from '@/components/calendar/calendar-page-client'

export default async function CalendarPage() {
  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get user details for role-based filtering
  const { data: userData } = await supabase
    .from('users')
    .select('role, church_id')
    .eq('id', user.id)
    .single()

  // Set churchId for admin users
  const churchId = userData?.role === 'admin' && userData.church_id
    ? userData.church_id
    : undefined

  // Get current month data
  const currentMonth = new Date()
  const { start, end } = getMonthRange(currentMonth)

  // Fetch initial calendar items
  const items = await getCalendarItemsByDate(start, end, {
    showEvents: true,
    showBirthdays: true,
    showBaptisms: true,
    churchId,
  })

  return (
    <div className="space-y-6">
      <PageHeader
        backHref="/"
        title="Calendar"
        description="View all events, birthdays, and baptism anniversaries"
      />

      <CalendarPageClient
        initialItems={items}
        initialMonth={currentMonth.toISOString()}
      />
    </div>
  )
}
