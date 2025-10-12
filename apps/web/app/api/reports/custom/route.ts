import { NextResponse } from 'next/server'
import { generateCustomMemberReport } from '@/lib/queries/reports'
import type { MemberField, CustomReportFilters } from '@/lib/types/custom-reports'

export async function POST(request: Request) {
  try {
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
