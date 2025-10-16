import { redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/server'
import { RegisterVisitorForm } from '@/components/visitors/register-visitor-form'

interface NewVisitorPageProps {
  searchParams: Promise<{ event_id?: string; return_to?: string }>
}

export default async function NewVisitorPage({ searchParams }: NewVisitorPageProps) {
  const params = await searchParams
  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Get user details
  const { data: currentUser } = await supabase
    .from('users')
    .select('*, churches(*)')
    .eq('id', user.id)
    .single()

  if (!currentUser) {
    redirect('/login')
  }

  // Get all churches for the dropdown
  const { data: churches } = await supabase
    .from('churches')
    .select('id, name, city, province, district, field')
    .eq('is_active', true)
    .order('name')

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="icon">
          <Link href={params.return_to || '/visitors'}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="font-display text-3xl text-primary">Register New Visitor</h1>
          <p className="mt-1 text-sm text-gray-500">
            Add a guest/visitor who is not a registered member
          </p>
        </div>
      </div>

      {/* Registration Form */}
      <Card>
        <CardHeader>
          <CardTitle>Visitor Information</CardTitle>
          <CardDescription>
            Please provide visitor details for registration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RegisterVisitorForm
            churches={churches || []}
            defaultChurchId={currentUser.church_id || undefined}
            eventId={params.event_id || null}
            returnTo={params.return_to || '/visitors'}
          />
        </CardContent>
      </Card>
    </div>
  )
}
