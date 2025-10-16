/**
 * Export utilities for reports
 * Functions to export data to PDF and Excel formats
 */

/**
 * Export data to Excel format
 */
export function exportToExcel(data: Record<string, unknown>[], filename: string, sheetName: string = 'Sheet1') {
  if (typeof window === 'undefined') return

  // Dynamic import to avoid SSR issues
  import('xlsx').then((XLSX) => {
    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(data)

    // Create workbook
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)

    // Save file
    XLSX.writeFile(workbook, `${filename}.xlsx`)
  })
}

/**
 * Export data to CSV format
 */
export function exportToCSV(data: Record<string, unknown>[], filename: string) {
  if (typeof window === 'undefined') return

  // Convert data to CSV
  const headers = Object.keys(data[0] || {})
  const csvRows = [
    headers.join(','),
    ...data.map(row =>
      headers.map(header => {
        const value = row[header]
        // Escape quotes and wrap in quotes if contains comma
        const escaped = String(value).replace(/"/g, '""')
        return escaped.includes(',') ? `"${escaped}"` : escaped
      }).join(',')
    )
  ]

  const csvContent = csvRows.join('\n')

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `${filename}.csv`
  link.click()
}

/**
 * Export table to PDF
 */
export function exportTableToPDF(
  title: string,
  headers: string[],
  rows: unknown[][],
  filename: string
) {
  if (typeof window === 'undefined') return

  // Dynamic import to avoid SSR issues
  Promise.all([
    import('jspdf'),
    import('jspdf-autotable')
  ]).then(([jsPDFModule]) => {
    const jsPDF = jsPDFModule.default

    // Create new PDF document
    const doc = new jsPDF()

    // Add title
    doc.setFontSize(18)
    doc.text(title, 14, 20)

    // Add date
    doc.setFontSize(10)
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 28)

    // Add table
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(doc as any).autoTable({
      startY: 35,
      head: [headers],
      body: rows,
      theme: 'grid',
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [59, 130, 246], // Blue
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
    })

    // Save the PDF
    doc.save(`${filename}.pdf`)
  })
}

/**
 * Format member data for export
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function formatMemberDataForExport(members: any[]) {
  return members.map(member => ({
    'Full Name': member.full_name,
    'Gender': member.gender,
    'Date of Birth': member.date_of_birth
      ? new Date(member.date_of_birth).toLocaleDateString()
      : '',
    'Phone': member.phone_number || '',
    'Email': member.email || '',
    'Church': member.churches?.name || '',
    'Spiritual Condition': member.spiritual_condition,
    'Status': member.status,
    'Baptism Date': member.baptism_date
      ? new Date(member.baptism_date).toLocaleDateString()
      : '',
  }))
}

/**
 * Format transfer data for export
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function formatTransferDataForExport(transfers: any[]) {
  return transfers.map(transfer => ({
    'Member': transfer.members?.full_name || 'Unknown',
    'From Church': transfer.from_church?.name || 'N/A',
    'To Church': transfer.to_church?.name || 'N/A',
    'Transfer Type': transfer.transfer_type,
    'Status': transfer.status,
    'Date': new Date(transfer.created_at).toLocaleDateString(),
    'Reason': transfer.reason || '',
  }))
}

/**
 * Format birthday data for export
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function formatBirthdayDataForExport(birthdays: any[]) {
  return birthdays.map(member => ({
    'Full Name': member.full_name,
    'Church': member.churches?.name || '',
    'Date of Birth': member.date_of_birth
      ? new Date(member.date_of_birth).toLocaleDateString()
      : '',
    'Age': member.age,
    'Phone': member.phone_number || '',
    'Email': member.email || '',
  }))
}

/**
 * Format baptism anniversary data for export
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function formatAnniversaryDataForExport(anniversaries: any[]) {
  return anniversaries.map(member => ({
    'Full Name': member.full_name,
    'Church': member.churches?.name || '',
    'Baptism Date': member.baptism_date
      ? new Date(member.baptism_date).toLocaleDateString()
      : '',
    'Years Since Baptism': member.years_since_baptism,
    'Phone': member.phone_number || '',
    'Email': member.email || '',
  }))
}

/**
 * Format missionary report data for export
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function formatMissionaryReportDataForExport(reports: any[]) {
  return reports.map(report => ({
    'Date': new Date(report.report_date).toLocaleDateString(),
    'Church': report.churches?.name || '',
    'Report Type': report.report_type.charAt(0).toUpperCase() + report.report_type.slice(1),
    'Bible Studies': report.bible_studies_given,
    'Home Visits': report.home_visits,
    'Seminars': report.seminars_conducted,
    'Conferences': report.conferences_conducted,
    'Public Lectures': report.public_lectures,
    'Pamphlets': report.pamphlets_distributed,
    'Books': report.books_distributed,
    'Magazines': report.magazines_distributed,
    'Youth Anchor': report.youth_anchor,
    'Total Activities':
      report.bible_studies_given +
      report.home_visits +
      report.seminars_conducted +
      report.conferences_conducted +
      report.public_lectures +
      report.youth_anchor,
    'Total Literature':
      report.pamphlets_distributed +
      report.books_distributed +
      report.magazines_distributed,
    'Reported By': report.reporter?.full_name || 'Unknown',
  }))
}
