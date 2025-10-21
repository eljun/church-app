import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getChurches } from '@/lib/queries/churches'
import { CreateUserForm } from '@/components/settings/users/create-user-form'

export const metadata = {
  title: 'Create New User',
  description: 'Add a new user to the system',
}

export default async function NewUserPage() {
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

  if (!currentUser || currentUser.role !== 'superadmin') {
    redirect('/')
  }

  // Get all churches for assignments
  const churchesData = await getChurches({ limit: 1000, offset: 0 })
  const churches = churchesData?.data || []

  return (
    <div className="container py-8">
      <CreateUserForm churches={churches} />
    </div>
  )
}
