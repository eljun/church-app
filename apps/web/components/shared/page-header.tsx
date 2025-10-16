import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PageHeaderProps {
  /**
   * The URL to navigate back to
   */
  backHref: string
  /**
   * The main page title
   */
  title: string
  /**
   * Optional description/subtitle below the title
   */
  description?: string
  /**
   * Optional action buttons to display on the right side
   */
  actions?: React.ReactNode
}

/**
 * Standardized page header component with back button
 *
 * Usage:
 * ```tsx
 * <PageHeader
 *   backHref="/missionary-reports"
 *   title="Create Missionary Report"
 *   description="Report your missionary activities for the week"
 * />
 * ```
 */
export function PageHeader({ backHref, title, description, actions }: PageHeaderProps) {
  return (
    <div className="space-y-4">
      {/* Back button */}
      <Link href={backHref}>
        <Button variant="outline" size="icon">
          <ArrowLeft className="h-4 w-4" />
        </Button>
      </Link>

      {/* Title and actions */}
      <div className="flex items-start justify-between gap-4 mt-4">
        <div>
          <h1 className="text-3xl font-bold">{title}</h1>
          {description && <p className="text-muted-foreground mt-1">{description}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  )
}
