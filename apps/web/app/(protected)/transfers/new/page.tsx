import { getChurches } from '@/lib/queries/churches'
import { getMembers } from '@/lib/queries/members'
import { createClient } from '@/lib/supabase/server'
import { TransferRequestForm } from '@/components/transfers/transfer-request-form'

export default async function NewTransferPage() {
  // Fetch churches and members for the dropdowns
  const [{ data: churches }, { data: members }] = await Promise.all([
    getChurches({ limit: 100, offset: 0 }),
    getMembers({ limit: 1000, offset: 0 }),
  ])

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
        <h1 className="font-display text-3xl  text-primary ">New Transfer Request</h1>
        <p className="mt-1 text-sm text-gray-500">
          Request a member transfer between churches
        </p>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg border p-6">
        <TransferRequestForm
          churches={churches}
          members={members}
          userRole={userData?.role || 'admin'}
          userChurchId={userData?.church_id || null}
        />
      </div>
    </div>
  )
}
