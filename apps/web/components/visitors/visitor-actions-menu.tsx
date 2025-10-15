'use client'

import { MoreVertical, Plus, RefreshCw, UserPlus, UserCheck, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { EditVisitorDialog } from '@/components/visitors/edit-visitor-dialog'
import { AddActivityDialog } from '@/components/visitors/add-activity-dialog'
import { UpdateFollowUpStatusDialog } from '@/components/visitors/update-follow-up-status-dialog'
import { AssignVisitorDialog } from '@/components/visitors/assign-visitor-dialog'
import { ConvertToMemberDialog } from '@/components/visitors/convert-to-member-dialog'

interface VisitorActionsMenuProps {
  visitor: any
  currentUser: any
  visitorId: string
}

export function VisitorActionsMenu({ visitor, currentUser, visitorId }: VisitorActionsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          Actions
          <MoreVertical className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Visitor Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />

        <EditVisitorDialog
          visitor={visitor}
          trigger={
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit Profile
            </DropdownMenuItem>
          }
        />

        <AddActivityDialog
          visitorId={visitorId}
          trigger={
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
              <Plus className="mr-2 h-4 w-4" />
              Add Activity
            </DropdownMenuItem>
          }
        />

        <UpdateFollowUpStatusDialog
          visitor={visitor}
          trigger={
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Update Status
            </DropdownMenuItem>
          }
        />

        <AssignVisitorDialog
          visitor={visitor}
          currentUser={currentUser}
          trigger={
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
              <UserPlus className="mr-2 h-4 w-4" />
              Assign to User
            </DropdownMenuItem>
          }
        />

        <DropdownMenuSeparator />

        <ConvertToMemberDialog
          visitor={visitor}
          trigger={
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
              <UserCheck className="mr-2 h-4 w-4" />
              Convert to Member
            </DropdownMenuItem>
          }
        />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
