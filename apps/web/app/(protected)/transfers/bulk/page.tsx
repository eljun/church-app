import { getChurchesForTransfer } from '@/lib/queries/churches'
import { getMembers } from '@/lib/queries/members'
import { createClient } from '@/lib/supabase/server'
import { BulkTransferForm } from '@/components/transfers/bulk-transfer-form'

interface BulkTransferPageProps {
  searchParams: Promise<{
    from_church_id?: string
  }>
}

export default async function BulkTransferPage({ searchParams }: BulkTransferPageProps) {
  const params = await searchParams

  // Fetch churches for transfer
  // Use getChurchesForTransfer to allow church secretaries to see destination churches
  const churches = await getChurchesForTransfer()

  // Get current user data
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: userData } = await supabase
    .from('users')
    .select('role, church_id')
    .eq('id', user!.id)
    .single()

  // Fetch members from the selected church
  const fromChurchId = params.from_church_id || userData?.church_id || ''
  const { data: members } = fromChurchId
    ? await getMembers({ church_id: fromChurchId, limit: 1000, offset: 0 })
    : { data: [] }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Page header */}
      <div>
        <h1 className="font-display text-3xl  text-primary ">Bulk Transfer Tool</h1>
        <p className="mt-1 text-sm text-gray-500">
          Transfer multiple members from one church to another at once
        </p>
      </div>

      {/* Form */}
      <div>
        <BulkTransferForm
          churches={churches}
          members={members}
          userRole={userData?.role || 'church_secretary'}
          userChurchId={userData?.church_id || null}
          preselectedChurchId={fromChurchId}
        />
      </div>
    </div>
  )
}
