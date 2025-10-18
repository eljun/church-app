import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getVisitors } from '@/lib/queries/visitors'
import { VisitorListTable } from '@/components/visitors/visitor-list-table'
import { VisitorsFilters } from '@/components/visitors/visitors-filters'
import { Button } from '@/components/ui/button'

export const metadata = {
  title: 'Visitors',
  description: 'Manage visitors and track follow-ups',
}

interface VisitorsPageProps {
  searchParams: Promise<{
    query?: string
    visitor_type?: 'adult' | 'youth' | 'child'
    follow_up_status?: 'pending' | 'contacted' | 'interested' | 'not_interested' | 'converted'
    referral_source?: 'member_invitation' | 'online' | 'walk_in' | 'social_media' | 'other'
    page?: string
  }>
}

export default async function VisitorsPage({ searchParams }: VisitorsPageProps) {
  const params = await searchParams
  const page = parseInt(params.page || '1')
  const limit = 50
  const offset = (page - 1) * limit
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

  // Bibleworkers have read-only access
  const isBibleworker = currentUser.role === 'bibleworker'

  // Get visitors based on role and filters
  const churchId = currentUser.role === 'admin' ? currentUser.church_id : undefined
  const visitorsData = await getVisitors({
    query: params.query,
    visitor_type: params.visitor_type,
    follow_up_status: params.follow_up_status,
    referral_source: params.referral_source,
    church_id: churchId || undefined,
    limit,
    offset,
  })

  const totalPages = Math.ceil(visitorsData.count / limit)

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl text-primary">Visitors</h1>
          <p className="mt-1 text-sm text-foreground">
            {isBibleworker ? 'View visitors and track follow-up activities' : 'Manage visitors and track follow-up activities'} ({visitorsData.count.toLocaleString()} total)
          </p>
        </div>
        {!isBibleworker && (
          <Button asChild>
            <Link href="/visitors/new">
              <Plus className="mr-2 h-4 w-4" />
              Register Visitor
            </Link>
          </Button>
        )}
      </div>

      {/* Filters */}
      <Suspense fallback={<div className="h-20 animate-pulse bg-gray-100" />}>
        <VisitorsFilters />
      </Suspense>

      {/* Visitors Table */}
      <Suspense fallback={<div className="h-96 animate-pulse bg-gray-100" />}>
        <VisitorListTable
          visitors={visitorsData.data || []}
          currentPage={page}
          totalPages={totalPages}
          totalCount={visitorsData.count}
        />
      </Suspense>
    </div>
  )
}
