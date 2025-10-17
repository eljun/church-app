import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCalendarItemsByDate } from '@/lib/queries/calendar'

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

    // Set churchId filter for admin users
    const churchId = userData?.role === 'admin' && userData.church_id
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
