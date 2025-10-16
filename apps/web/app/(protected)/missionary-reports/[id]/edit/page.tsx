import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import type { Church } from '@church-app/database'
import { MissionaryReportForm } from '@/components/missionary-reports/missionary-report-form'
import { getMissionaryReportById } from '@/lib/queries/missionary-reports'
import { PageHeader } from '@/components/shared'

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export default async function EditMissionaryReportPage({ params }: PageProps) {
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

  // Await params
  const { id } = await params

  // Get report
  const report = await getMissionaryReportById(id)

  if (!report) {
    notFound()
  }

  // Get all churches (for superadmin/pastor)
  const { data: churches } = await supabase
    .from('churches')
    .select('id, name, field, district, city, province')
    .order('name')

  // Prepare initial data for edit mode
  const initialData = {
    id: report.id,
    church_id: report.church_id,
    report_date: report.report_date,
    report_type: report.report_type,
    bible_studies_given: report.bible_studies_given,
    home_visits: report.home_visits,
    seminars_conducted: report.seminars_conducted,
    conferences_conducted: report.conferences_conducted,
    public_lectures: report.public_lectures,
    pamphlets_distributed: report.pamphlets_distributed,
    books_distributed: report.books_distributed,
    magazines_distributed: report.magazines_distributed,
    youth_anchor: report.youth_anchor,
    notes: report.notes,
    highlights: report.highlights,
    challenges: report.challenges,
  }

  return (
    <div className="space-y-6">
      <PageHeader
        backHref={`/missionary-reports/${id}`}
        title="Edit Missionary Report"
        description="Update your missionary report information"
      />

      {/* Form */}
      <MissionaryReportForm
        churches={(churches || []) as Church[]}
        userRole={userData.role}
        userChurchId={userData.church_id}
        initialData={initialData}
        mode="edit"
      />
    </div>
  )
}
