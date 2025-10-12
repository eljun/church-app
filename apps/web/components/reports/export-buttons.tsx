'use client'

import { useState } from 'react'
import { DownloadIcon, FileTextIcon, FileSpreadsheetIcon, Loader2Icon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  exportToExcel,
  exportToCSV,
  exportTableToPDF,
} from '@/lib/utils/export'

interface ExportButtonsProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any[]
  filename: string
  title?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  formatData?: (data: any[]) => any[]
  headers?: string[]
}

export function ExportButtons({
  data,
  filename,
  title,
  formatData,
  headers,
}: ExportButtonsProps) {
  const [isExporting, setIsExporting] = useState(false)

  const handleExportExcel = () => {
    setIsExporting(true)
    try {
      const exportData = formatData ? formatData(data) : data
      exportToExcel(exportData, filename)
    } catch (error) {
      console.error('Error exporting to Excel:', error)
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportCSV = () => {
    setIsExporting(true)
    try {
      const exportData = formatData ? formatData(data) : data
      exportToCSV(exportData, filename)
    } catch (error) {
      console.error('Error exporting to CSV:', error)
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportPDF = () => {
    setIsExporting(true)
    try {
      const exportData = formatData ? formatData(data) : data

      // Extract headers and rows
      const pdfHeaders = headers || Object.keys(exportData[0] || {})
      const pdfRows = exportData.map(row =>
        pdfHeaders.map(header => String(row[header] || ''))
      )

      exportTableToPDF(
        title || 'Report',
        pdfHeaders,
        pdfRows,
        filename
      )
    } catch (error) {
      console.error('Error exporting to PDF:', error)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={isExporting || data.length === 0}>
          {isExporting ? (
            <>
              <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <DownloadIcon className="mr-2 h-4 w-4" />
              Export Report
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleExportExcel}>
          <FileSpreadsheetIcon className="mr-2 h-4 w-4" />
          Export as Excel
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportCSV}>
          <FileTextIcon className="mr-2 h-4 w-4" />
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportPDF}>
          <FileTextIcon className="mr-2 h-4 w-4" />
          Export as PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/**
 * Simple export button for single format
 */
interface SingleExportButtonProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any[]
  filename: string
  format: 'excel' | 'csv' | 'pdf'
  title?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  formatData?: (data: any[]) => any[]
  headers?: string[]
  variant?: 'default' | 'outline' | 'ghost'
}

export function SingleExportButton({
  data,
  filename,
  format,
  title,
  formatData,
  headers,
  variant = 'outline',
}: SingleExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = () => {
    setIsExporting(true)
    try {
      const exportData = formatData ? formatData(data) : data

      if (format === 'excel') {
        exportToExcel(exportData, filename)
      } else if (format === 'csv') {
        exportToCSV(exportData, filename)
      } else if (format === 'pdf') {
        const pdfHeaders = headers || Object.keys(exportData[0] || {})
        const pdfRows = exportData.map(row =>
          pdfHeaders.map(header => String(row[header] || ''))
        )
        exportTableToPDF(title || 'Report', pdfHeaders, pdfRows, filename)
      }
    } catch (error) {
      console.error(`Error exporting to ${format}:`, error)
    } finally {
      setIsExporting(false)
    }
  }

  const icon = format === 'excel' || format === 'csv'
    ? FileSpreadsheetIcon
    : FileTextIcon

  const Icon = icon

  return (
    <Button
      variant={variant}
      onClick={handleExport}
      disabled={isExporting || data.length === 0}
    >
      {isExporting ? (
        <>
          <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
          Exporting...
        </>
      ) : (
        <>
          <Icon className="mr-2 h-4 w-4" />
          Export {format.toUpperCase()}
        </>
      )}
    </Button>
  )
}
