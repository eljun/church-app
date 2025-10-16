'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { UserPlus, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { createUser } from '@/lib/actions/users'
import { ChurchSelect } from '@/components/shared'
import { ChurchMultiSelect } from './church-multi-select'
import type { UserRole } from '@/lib/validations/user'

interface CreateUserDialogProps {
  churches: Array<{ id: string; name: string; district: string; field: string }>
}

export function CreateUserDialog({ churches }: CreateUserDialogProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  // Form state
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<UserRole>('member')
  const [churchId, setChurchId] = useState<string>('')
  const [districtId, setDistrictId] = useState('')
  const [fieldId, setFieldId] = useState('')
  const [assignedMemberIds, setAssignedMemberIds] = useState<string[]>([])
  const [assignedChurchIds, setAssignedChurchIds] = useState<string[]>([])

  const resetForm = () => {
    setEmail('')
    setPassword('')
    setRole('member')
    setChurchId('')
    setDistrictId('')
    setFieldId('')
    setAssignedMemberIds([])
    setAssignedChurchIds([])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!email || !password || !role) {
      toast.error('Please fill in all required fields')
      return
    }

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }

    if (role === 'admin' && !churchId) {
      toast.error('Admin users must be assigned to a church')
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
      const result = await createUser({
        email,
        password,
        role,
        church_id: churchId || null,
        district_id: districtId || null,
        field_id: fieldId || null,
        assigned_member_ids: assignedMemberIds,
        assigned_church_ids: assignedChurchIds,
      })

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('User created successfully')
        resetForm()
        setOpen(false)
        router.refresh()
      }
    })
  }

  // Get unique districts and fields from churches
  const districts = [...new Set(churches.map((c) => c.district).filter(Boolean))]
  const fields = [...new Set(churches.map((c) => c.field).filter(Boolean))]

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New User</DialogTitle>
          <DialogDescription>
            Add a new user to the system with role-based permissions
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
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                placeholder="Min. 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
              <p className="text-xs text-muted-foreground">
                Password must be at least 8 characters long
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="role">Role *</Label>
              <Select value={role} onValueChange={(value) => setRole(value as UserRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member - Personal access only</SelectItem>
                  <SelectItem value="bibleworker">Bible Worker - Church assignments</SelectItem>
                  <SelectItem value="admin">Admin - Church management</SelectItem>
                  <SelectItem value="pastor">Pastor - District/Field oversight</SelectItem>
                  <SelectItem value="coordinator">Coordinator - Event coordination</SelectItem>
                  <SelectItem value="superadmin">Superadmin - Full system access</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Role-specific fields */}
          {role === 'admin' && (
            <div className="space-y-4 border-t pt-4">
              <h4 className="text-sm font-medium">Admin Assignment</h4>
              <div className="grid gap-2">
                <Label htmlFor="church">Church *</Label>
                <ChurchSelect
                  churches={churches}
                  value={churchId}
                  onValueChange={setChurchId}
                  showDistrictAndField
                />
                <p className="text-xs text-muted-foreground">
                  Admin users manage a specific church
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
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create User
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
