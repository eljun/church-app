'use client'

import type { MissionaryReport } from '@church-app/database'
import { ExportButtons } from '@/components/reports/export-buttons'
import { formatMissionaryReportDataForExport } from '@/lib/utils/export'

interface MissionaryActivitiesExportButtonProps {
  reports: MissionaryReport[]
  startDate?: string
  endDate?: string
}

export function MissionaryActivitiesExportButton({
  reports,
  startDate,
  endDate,
}: MissionaryActivitiesExportButtonProps) {
  // Generate filename with date range if available
  const getFilename = () => {
    const base = 'missionary-activities-report'
    if (startDate && endDate) {
      return `${base}_${startDate}_to_${endDate}`
    }
    return `${base}_${new Date().toISOString().split('T')[0]}`
  }

  // Generate report title
  const getTitle = () => {
    if (startDate && endDate) {
      return `Missionary Activities Report (${startDate} to ${endDate})`
    }
    return 'Missionary Activities Report'
  }

  return (
    <ExportButtons
      data={reports}
      filename={getFilename()}
      title={getTitle()}
      formatData={formatMissionaryReportDataForExport}
    />
  )
}
