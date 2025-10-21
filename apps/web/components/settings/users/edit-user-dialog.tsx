'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { updateUser } from '@/lib/actions/users'
import { ChurchSelect } from '@/components/shared'
import { ChurchMultiSelect } from './church-multi-select'
import type { UserRole } from '@/lib/validations/user'
import type { UserWithChurch } from '@/lib/queries/users'

interface EditUserDialogProps {
  user: UserWithChurch
  churches: Array<{ id: string; name: string; district: string; field: string }>
  onClose: () => void
}

export function EditUserDialog({ user, churches, onClose }: EditUserDialogProps) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  // Form state
  const [email, setEmail] = useState(user.email)
  const [role, setRole] = useState<UserRole>(user.role)
  const [churchId, setChurchId] = useState<string>(user.church_id || '')
  const [districtId, setDistrictId] = useState(user.district_id || '')
  const [fieldId, setFieldId] = useState(user.field_id || '')
  const [assignedChurchIds, setAssignedChurchIds] = useState<string[]>(user.assigned_church_ids || [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!email || !role) {
      toast.error('Please fill in all required fields')
      return
    }

    if (role === 'church_secretary' && !churchId) {
      toast.error('Church Secretary users must be assigned to a church')
      return
    }

    if (role === 'pastor' && assignedChurchIds.length === 0) {
      toast.error('Pastor must be assigned to at least one church')
      return
    }

    if (role === 'bibleworker' && assignedChurchIds.length === 0) {
      toast.error('Bible worker must be assigned to at least one church')
      return
    }

    startTransition(async () => {
      const result = await updateUser({
        id: user.id,
        email,
        role,
        church_id: churchId || null,
        district_id: districtId || null,
        field_id: fieldId || null,
        assigned_church_ids: assignedChurchIds,
        assigned_member_ids: [],
      })

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('User updated successfully')
        onClose()
        router.refresh()
      }
    })
  }

  // Get unique districts and fields from churches
  const districts = [...new Set(churches.map((c) => c.district).filter(Boolean))]
  const fields = [...new Set(churches.map((c) => c.field).filter(Boolean))]

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>
            Update user information and role assignments
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic Info */}
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="role">Role *</Label>
              <Select value={role} onValueChange={(value) => setRole(value as UserRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bibleworker">Bible Worker - Assigned members</SelectItem>
                  <SelectItem value="church_secretary">Church Secretary - Church management</SelectItem>
                  <SelectItem value="pastor">Pastor - District/Field oversight</SelectItem>
                  <SelectItem value="coordinator">Coordinator - Event coordination</SelectItem>
                  <SelectItem value="superadmin">Superadmin - Full system access</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Role-specific fields */}
          {role === 'church_secretary' && (
            <div className="space-y-4 border-t pt-4">
              <h4 className="text-sm font-medium">Church Secretary Assignment</h4>
              <div className="grid gap-2">
                <Label htmlFor="church">Church *</Label>
                <ChurchSelect
                  churches={churches}
                  value={churchId}
                  onValueChange={setChurchId}
                  showDistrictAndField
                />
                <p className="text-xs text-muted-foreground">
                  Church Secretary users manage a specific church
                </p>
              </div>
            </div>
          )}

          {role === 'pastor' && (
            <div className="space-y-4 border-t pt-4">
              <h4 className="text-sm font-medium">Pastor Assignment</h4>
              <div className="grid gap-2">
                <Label htmlFor="churches">Assigned Churches *</Label>
                <ChurchMultiSelect
                  churches={churches}
                  selectedIds={assignedChurchIds}
                  onChange={setAssignedChurchIds}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="district">District (Optional)</Label>
                <Select value={districtId} onValueChange={setDistrictId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select district" />
                  </SelectTrigger>
                  <SelectContent>
                    {districts.map((district) => (
                      <SelectItem key={district} value={district}>
                        {district}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="field">Field (Optional)</Label>
                <Select value={fieldId} onValueChange={setFieldId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select field" />
                  </SelectTrigger>
                  <SelectContent>
                    {fields.map((field) => (
                      <SelectItem key={field} value={field}>
                        {field}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs text-muted-foreground">
                Assign specific churches, or optionally add district/field for broader oversight
              </p>
            </div>
          )}

          {role === 'bibleworker' && (
            <div className="space-y-4 border-t pt-4">
              <h4 className="text-sm font-medium">Bible Worker Assignment</h4>
              <div className="grid gap-2">
                <Label htmlFor="churches">Assigned Churches *</Label>
                <ChurchMultiSelect
                  churches={churches}
                  selectedIds={assignedChurchIds}
                  onChange={setAssignedChurchIds}
                />
                <p className="text-xs text-muted-foreground">
                  Bible workers can work across multiple churches and areas
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
