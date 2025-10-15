import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getVisitors } from '@/lib/queries/visitors'
import { getChurches } from '@/lib/queries/churches'
import { VisitorListTable } from '@/components/visitors/visitor-list-table'
import { RegisterVisitorDialog } from '@/components/events/registrations/register-visitor-dialog'

export const metadata = {
  title: 'Visitors',
  description: 'Manage visitors and track follow-ups',
}

export default async function VisitorsPage() {
  const supabase = await createClient()

  // Get current user
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) {
    redirect('/login')
  }

  // Get user details with role
  const { data: currentUser } = await supabase
    .from('users')
    .select('*')
    .eq('id', authUser.id)
    .single()

  if (!currentUser) {
    redirect('/login')
  }

  // Get visitors based on role
  const churchId = currentUser.role === 'admin' ? currentUser.church_id : undefined
  const visitorsData = await getVisitors({
    limit: 1000, // Get all visitors for now (can add pagination later)
    offset: 0,
    church_id: churchId || undefined,
  })

  const churchesData = await getChurches()

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl text-primary">Visitors</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage visitors and track follow-up activities
          </p>
        </div>
        <RegisterVisitorDialog
          eventId={null}
          churches={churchesData?.data || []}
          defaultChurchId={currentUser.role === 'admin' ? currentUser.church_id || undefined : undefined}
        />
      </div>

      {/* Visitors Table */}
      <VisitorListTable
        visitors={visitorsData.data || []}
      />
    </div>
  )
}
