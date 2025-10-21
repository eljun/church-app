import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCalendarItemsByDate } from '@/lib/queries/calendar'
import { canAccessModule } from '@/lib/rbac'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const start = searchParams.get('start')
    const end = searchParams.get('end')

    if (!start || !end) {
      return NextResponse.json(
        { error: 'Missing start or end date' },
        { status: 400 }
      )
    }

    // Get current user for role-based filtering
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user details
    const { data: userData } = await supabase
      .from('users')
      .select('role, church_id')
      .eq('id', user.id)
      .single()

    if (!userData) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check RBAC permissions for calendar module
    if (!canAccessModule(userData.role, 'calendar')) {
      return NextResponse.json(
        { error: 'Forbidden: You do not have access to the calendar' },
        { status: 403 }
      )
    }

    // Set churchId filter for church_secretary users
    const churchId = userData?.role === 'church_secretary' && userData.church_id
      ? userData.church_id
      : undefined

    // Fetch calendar items
    const items = await getCalendarItemsByDate(start, end, {
      showEvents: true,
      showBirthdays: true,
      showBaptisms: true,
      churchId,
    })

    return NextResponse.json(items)
  } catch (error) {
    console.error('Error fetching calendar items:', error)
    return NextResponse.json(
      { error: 'Failed to fetch calendar items' },
      { status: 500 }
    )
  }
}
