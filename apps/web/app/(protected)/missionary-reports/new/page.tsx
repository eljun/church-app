import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Church } from '@church-app/database'
import { MissionaryReportForm } from '@/components/missionary-reports/missionary-report-form'
import { PageHeader } from '@/components/shared'

export default async function NewMissionaryReportPage() {
  const supabase = await createClient()

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get user details with role
  const { data: userData } = await supabase
    .from('users')
    .select('role, church_id, assigned_church_ids')
    .eq('id', user.id)
    .single()

  if (!userData) {
    redirect('/login')
  }

  // Bibleworkers can create missionary reports (removed restriction)

  // Get churches based on role
  let churchesQuery = supabase
    .from('churches')
    .select('id, name, field, district, city, province')
    .order('name')

  // Bibleworkers can only report for their assigned churches
  if (userData.role === 'bibleworker' && userData.assigned_church_ids && userData.assigned_church_ids.length > 0) {
    churchesQuery = churchesQuery.in('id', userData.assigned_church_ids)
  }

  const { data: churches } = await churchesQuery

  return (
    <div className="space-y-6">
      <PageHeader
        backHref="/missionary-reports"
        title="Create Missionary Report"
        description="Report your missionary activities for the week"
      />

      {/* Form */}
      <MissionaryReportForm
        churches={(churches || []) as Church[]}
        userRole={userData.role}
        userChurchId={userData.church_id}
        mode="create"
      />
    </div>
  )
}
