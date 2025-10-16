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
    .select('role, church_id')
    .eq('id', user.id)
    .single()

  if (!userData) {
    redirect('/login')
  }

  // Get all churches (for superadmin/pastor)
  const { data: churches } = await supabase
    .from('churches')
    .select('id, name, field, district, city, province')
    .order('name')

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
