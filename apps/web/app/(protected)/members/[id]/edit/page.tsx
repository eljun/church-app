import { notFound } from 'next/navigation'
import { getMemberById } from '@/lib/queries/members'
import { getChurches } from '@/lib/queries/churches'
import { createClient } from '@/lib/supabase/server'
import { MemberForm } from '@/components/members/member-form'

interface EditMemberPageProps {
  params: Promise<{ id: string }>
}

export default async function EditMemberPage({ params }: EditMemberPageProps) {
  const { id } = await params

  // Fetch member data
  try {
    const member = await getMemberById(id)
    const { data: churches } = await getChurches({ limit: 100, offset: 0 })

    // Get current user data to determine church permissions
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data: userData } = await supabase
      .from('users')
      .select('role, church_id')
      .eq('id', user!.id)
      .single()

    return (
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Page header */}
        <div>
          <h1 className="font-display text-3xl font-bold ">Edit Member</h1>
          <p className="mt-1 text-sm text-gray-500">
            Update member information for {member.full_name}
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg border p-6">
          <MemberForm
            churches={churches}
            userRole={userData?.role || 'admin'}
            userChurchId={userData?.church_id || null}
            initialData={{
              id: member.id,
              church_id: member.church_id,
              full_name: member.full_name,
              birthday: member.birthday,
              age: member.age,
              date_of_baptism: member.date_of_baptism,
              baptized_by: member.baptized_by,
              physical_condition: member.physical_condition,
              illness_description: member.illness_description,
              spiritual_condition: member.spiritual_condition,
              status: member.status,
              sp: member.sp,
            }}
            mode="edit"
          />
        </div>
      </div>
    )
  } catch {
    notFound()
  }
}
