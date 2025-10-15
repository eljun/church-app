'use client'

import { Phone, Home, Book, Mail, MessageSquare, Calendar, MoreVertical, CheckCircle2, Circle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'
import { completeActivity, deleteVisitorActivity } from '@/lib/actions/visitor-activities'
import { useRouter } from 'next/navigation'

interface Activity {
  id: string
  activity_type: string
  title: string
  notes: string | null
  scheduled_date: string | null
  completed_date: string | null
  is_completed: boolean
  outcome: string | null
  created_at: string
  user: {
    id: string
    email: string
  } | null
}

interface FollowUpActivityLogProps {
  activities: Activity[]
  visitorId: string
  isConverted?: boolean
}

export function FollowUpActivityLog({ activities, visitorId, isConverted = false }: FollowUpActivityLogProps) {
  const router = useRouter()

  // Get icon for activity type
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'phone_call':
        return <Phone className="h-4 w-4" />
      case 'home_visit':
        return <Home className="h-4 w-4" />
      case 'bible_study':
        return <Book className="h-4 w-4" />
      case 'follow_up_email':
        return <Mail className="h-4 w-4" />
      case 'text_message':
        return <MessageSquare className="h-4 w-4" />
      case 'scheduled_visit':
        return <Calendar className="h-4 w-4" />
      default:
        return <Circle className="h-4 w-4" />
    }
  }

  // Handle complete activity
  const handleComplete = async (activityId: string) => {
    const result = await completeActivity({
      id: activityId,
      outcome: null,
      notes: null,
    })

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Activity marked as completed')
      router.refresh()
    }
  }

  // Handle delete activity
  const handleDelete = async (activityId: string) => {
    if (!confirm('Are you sure you want to delete this activity?')) {
      return
    }

    const result = await deleteVisitorActivity(activityId)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Activity deleted')
      router.refresh()
    }
  }

  // Sort activities: incomplete first, then by date
  const sortedActivities = [...activities].sort((a, b) => {
    if (a.is_completed !== b.is_completed) {
      return a.is_completed ? 1 : -1
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Log</CardTitle>
        <CardDescription>
          {isConverted
            ? 'Historical follow-up activities (read-only)'
            : 'Follow-up activities and interactions'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        {sortedActivities.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No activities yet. Click "Add Activity" to create one.
          </p>
        ) : (
          <div className="space-y-4">
            {sortedActivities.map((activity) => (
              <div
                key={activity.id}
                className={`relative border rounded-lg p-4 ${
                  activity.is_completed ? 'bg-muted/50' : 'bg-background'
                }`}
              >
                {/* Completion Status Icon */}
                <div className="absolute top-4 left-4">
                  {activity.is_completed ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>

                {/* Content */}
                <div className="pl-8 pr-8">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getActivityIcon(activity.activity_type)}
                      <h4 className="font-medium text-sm">{activity.title}</h4>
                    </div>

                    {/* Actions Menu - Hidden for converted visitors */}
                    {!isConverted && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {!activity.is_completed && (
                            <DropdownMenuItem onClick={() => handleComplete(activity.id)}>
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Mark Complete
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => handleDelete(activity.id)}
                            className="text-destructive"
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>

                  {/* Activity Type Badge */}
                  <Badge variant="outline" className="text-xs mb-2">
                    {activity.activity_type.replace('_', ' ')}
                  </Badge>

                  {/* Notes */}
                  {activity.notes && (
                    <p className="text-sm text-muted-foreground mt-2">
                      {activity.notes}
                    </p>
                  )}

                  {/* Outcome (if completed) */}
                  {activity.is_completed && activity.outcome && (
                    <div className="mt-2 p-2 bg-background rounded border">
                      <p className="text-xs font-medium text-muted-foreground">Outcome:</p>
                      <p className="text-sm">{activity.outcome}</p>
                    </div>
                  )}

                  {/* Scheduled/Completed Date */}
                  <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                    {activity.scheduled_date && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>
                          Scheduled:{' '}
                          {formatDistanceToNow(new Date(activity.scheduled_date), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                    )}
                    {activity.is_completed && activity.completed_date && (
                      <div className="flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>
                          Completed:{' '}
                          {formatDistanceToNow(new Date(activity.completed_date), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* User who created */}
                  {activity.user && (
                    <p className="text-xs text-muted-foreground mt-2">
                      By: {activity.user.email}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
