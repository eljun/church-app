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

    if (role === 'pastor') {
      if (!fieldId) {
        toast.error('Pastor must be assigned to a field')
        return
      }
      if (!districtId) {
        toast.error('Pastor must be assigned to a district')
        return
      }
      if (assignedChurchIds.length === 0) {
        toast.error('Pastor must be assigned to at least one church')
        return
      }
    }

    if (role === 'bibleworker' && assignedChurchIds.length === 0) {
      toast.error('Bible worker must be assigned to at least one church')
      return
    }

    if (role === 'field_secretary' && !fieldId) {
      toast.error('Field Secretary must be assigned to a field')
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

  // Get unique fields from churches
  const fields = [...new Set(churches.map((c) => c.field).filter(Boolean))]

  // Get districts filtered by selected field
  const filteredDistricts = fieldId
    ? [...new Set(churches.filter((c) => c.field === fieldId).map((c) => c.district).filter(Boolean))]
    : []

  // Get churches filtered by selected district
  const filteredChurches = districtId
    ? churches.filter((c) => c.district === districtId && c.field === fieldId)
    : []

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
                  <SelectItem value="bibleworker">Bible Worker - Church assignments</SelectItem>
                  <SelectItem value="church_secretary">Church Secretary - Church management</SelectItem>
                  <SelectItem value="pastor">Pastor - District oversight</SelectItem>
                  <SelectItem value="field_secretary">Field Secretary - Field oversight</SelectItem>
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

          {role === 'field_secretary' && (
            <div className="space-y-4 border-t pt-4">
              <h4 className="text-sm font-medium">Field Secretary Assignment</h4>
              <div className="grid gap-2">
                <Label htmlFor="field">Field *</Label>
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
                <p className="text-xs text-muted-foreground">
                  Field Secretary manages all churches and districts in their field
                </p>
              </div>
            </div>
          )}

          {role === 'pastor' && (
            <div className="space-y-4 border-t pt-4">
              <h4 className="text-sm font-medium">Pastor Assignment</h4>

              {/* Field Selection - First */}
              <div className="grid gap-2">
                <Label htmlFor="field">Field *</Label>
                <Select
                  value={fieldId}
                  onValueChange={(value) => {
                    setFieldId(value)
                    // Reset dependent fields when field changes
                    setDistrictId('')
                    setAssignedChurchIds([])
                  }}
                >
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

              {/* District Selection - Second */}
              <div className="grid gap-2">
                <Label htmlFor="district">District *</Label>
                <Select
                  value={districtId}
                  onValueChange={(value) => {
                    setDistrictId(value)
                    // Reset churches when district changes
                    setAssignedChurchIds([])
                  }}
                  disabled={!fieldId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={fieldId ? "Select district" : "Select field first"} />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredDistricts.map((district) => (
                      <SelectItem key={district} value={district}>
                        {district}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Church Selection - Third (last) */}
              <div className="grid gap-2">
                <Label htmlFor="churches">Assigned Churches *</Label>
                <ChurchMultiSelect
                  churches={filteredChurches}
                  selectedIds={assignedChurchIds}
                  onChange={setAssignedChurchIds}
                  disabled={!districtId}
                />
                <p className="text-xs text-muted-foreground">
                  {!fieldId && 'Select field first'}
                  {fieldId && !districtId && 'Select district to enable church selection'}
                  {fieldId && districtId && 'Select one or more churches from the district'}
                </p>
              </div>
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
