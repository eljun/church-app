import { redirect } from 'next/navigation'
import { getChurches } from '@/lib/queries/churches'
import { createClient } from '@/lib/supabase/server'
import { MemberForm } from '@/components/members/member-form'

export default async function NewMemberPage() {
  // Get current user data to determine church permissions
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: userData } = await supabase
    .from('users')
    .select('role, church_id')
    .eq('id', user.id)
    .single()

  // Bibleworkers cannot create members
  if (userData?.role === 'bibleworker') {
    redirect('/members')
  }

  // Fetch churches for the dropdown
  const { data: churches } = await getChurches({ limit: 100, offset: 0 })

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page header */}
      <div>
        <h1 className="font-display text-3xl  text-primary ">Add New Member</h1>
        <p className="mt-1 text-sm text-gray-500">
          Create a new member record in the system
        </p>
      </div>

      {/* Form */}
      <div className="bg-white p-6">
        <MemberForm
          churches={churches}
          userRole={userData?.role || 'admin'}
          userChurchId={userData?.church_id || null}
        />
      </div>
    </div>
  )
}
