import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateCustomMemberReport } from '@/lib/queries/reports'
import { canAccessModule } from '@/lib/rbac'
import type { MemberField, CustomReportFilters } from '@/lib/types/custom-reports'

export async function POST(request: Request) {
  try {
    // Authenticate user
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user role
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!userData) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check RBAC permissions for reports module
    if (!canAccessModule(userData.role, 'reports')) {
      return NextResponse.json(
        { error: 'Forbidden: You do not have access to reports' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { fields, filters } = body as {
      fields: MemberField[]
      filters: CustomReportFilters
    }

    if (!fields || !Array.isArray(fields) || fields.length === 0) {
      return NextResponse.json(
        { error: 'Fields array is required' },
        { status: 400 }
      )
    }

    const data = await generateCustomMemberReport(fields, filters || {})

    return NextResponse.json({ data, count: data.length })
  } catch (error) {
    console.error('Custom report error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
