import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getChurches } from '@/lib/queries/churches'
import { QuickAttendanceForm } from '@/components/attendance/quick-attendance-form'

export const metadata = {
  title: 'Weekly Attendance',
  description: 'Record attendance for weekly church services',
}

export default async function AttendancePage() {
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

  // Only admins, coordinators, pastors, and superadmins can record attendance
  if (!['admin', 'coordinator', 'pastor', 'superadmin'].includes(currentUser.role)) {
    redirect('/')
  }

  // Fetch all churches without pagination limit
  const churchesData = await getChurches({ limit: 1000, offset: 0 })

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="font-display text-3xl text-primary">Weekly Attendance</h1>
        <p className="mt-1 text-sm text-gray-500">
          Record attendance for regular church services
        </p>
      </div>

      {/* Quick Attendance Form */}
      <QuickAttendanceForm
        currentUser={currentUser}
        churches={churchesData?.data || []}
      />
    </div>
  )
}
