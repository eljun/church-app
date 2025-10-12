import { formatDistanceToNow } from 'date-fns'
import { UserPlus, ArrowLeftRight, FileEdit, Trash2, LucideIcon } from 'lucide-react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

interface Activity {
  id: string
  action: string
  table_name: string
  created_at: string
  users?: {
    email: string
  }
}

interface RecentActivitiesProps {
  activities: Activity[]
}

const actionIcons: Record<string, LucideIcon> = {
  created_member: UserPlus,
  updated_member: FileEdit,
  deleted_member: Trash2,
  created_transfer_request: ArrowLeftRight,
  approved_transfer_request: ArrowLeftRight,
  rejected_transfer_request: ArrowLeftRight,
}

const actionColors: Record<string, string> = {
  created_member: 'bg-green-50 text-green-600',
  updated_member: 'bg-blue-50 text-blue-600',
  deleted_member: 'bg-red-50 text-red-600',
  created_transfer_request: 'bg-purple-50 text-purple-600',
  approved_transfer_request: 'bg-green-50 text-green-600',
  rejected_transfer_request: 'bg-red-50 text-red-600',
}

const actionLabels: Record<string, string> = {
  created_member: 'Created member',
  updated_member: 'Updated member',
  deleted_member: 'Deleted member',
  created_transfer_request: 'Transfer requested',
  approved_transfer_request: 'Transfer approved',
  rejected_transfer_request: 'Transfer rejected',
  created_church: 'Created church',
  updated_church: 'Updated church',
  deleted_church: 'Deleted church',
}

export function RecentActivities({ activities }: RecentActivitiesProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activities</CardTitle>
        <CardDescription>Latest actions in the system</CardDescription>
      </CardHeader>
      <CardContent>

      <div className="space-y-4">
        {activities.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">No recent activities</p>
        ) : (
          activities.map((activity) => {
            const Icon = actionIcons[activity.action] || FileEdit
            const colorClass = actionColors[activity.action] || 'bg-gray-50 text-gray-600'
            const label = actionLabels[activity.action] || activity.action.replace(/_/g, ' ')

            return (
              <div key={activity.id} className="flex items-start space-x-3">
                <div className={`p-2 rounded-lg ${colorClass} flex-shrink-0`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium  capitalize">
                    {label}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {activity.users?.email || 'System'}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
            )
          })
        )}
      </div>
      </CardContent>

      {activities.length > 0 && (
        <CardFooter className="border-t">
          <a
            href="/audit-logs"
            className="text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            View all activities →
          </a>
        </CardFooter>
      )}
    </Card>
  )
}
