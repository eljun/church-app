'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { createUser } from '@/lib/actions/users'
import { ChurchSelect } from '@/components/shared'
import { ChurchMultiSelect } from './church-multi-select'
import type { UserRole } from '@/lib/validations/user'
import Link from 'next/link'

interface CreateUserFormProps {
  churches: Array<{ id: string; name: string; district: string; field: string }>
}

export function CreateUserForm({ churches }: CreateUserFormProps) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  // Form state
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<UserRole>('bibleworker')
  const [churchId, setChurchId] = useState<string>('')
  const [districtId, setDistrictId] = useState('')
  const [fieldId, setFieldId] = useState('')
  const [assignedChurchIds, setAssignedChurchIds] = useState<string[]>([])

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
      const result = await createUser({
        email,
        password,
        role,
        church_id: churchId || null,
        district_id: districtId || null,
        field_id: fieldId || null,
        assigned_member_ids: [],
        assigned_church_ids: assignedChurchIds,
      })

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('User created successfully')
        router.push('/settings/users')
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
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/settings/users">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create New User</h1>
          <p className="text-muted-foreground">Add a new user to the system with role-based permissions</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information Card */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Enter the user&apos;s email and password</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
                  <SelectItem value="bibleworker">Bible Worker - Church assignments</SelectItem>
                  <SelectItem value="church_secretary">Church Secretary - Church management</SelectItem>
                  <SelectItem value="pastor">Pastor - District oversight</SelectItem>
                  <SelectItem value="field_secretary">Field Secretary - Field oversight</SelectItem>
                  <SelectItem value="coordinator">Coordinator - Event coordination</SelectItem>
                  <SelectItem value="superadmin">Superadmin - Full system access</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Role-specific assignment cards */}
        {role === 'church_secretary' && (
          <Card>
            <CardHeader>
              <CardTitle>Church Secretary Assignment</CardTitle>
              <CardDescription>Assign the user to a specific church</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
            </CardContent>
          </Card>
        )}

        {role === 'field_secretary' && (
          <Card>
            <CardHeader>
              <CardTitle>Field Secretary Assignment</CardTitle>
              <CardDescription>Assign the user to a field</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
            </CardContent>
          </Card>
        )}

        {role === 'pastor' && (
          <Card>
            <CardHeader>
              <CardTitle>Pastor Assignment</CardTitle>
              <CardDescription>Assign field, district, and churches</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
            </CardContent>
          </Card>
        )}

        {role === 'bibleworker' && (
          <Card>
            <CardHeader>
              <CardTitle>Bible Worker Assignment</CardTitle>
              <CardDescription>Assign churches for the bible worker</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
            </CardContent>
          </Card>
        )}

        {/* Form Actions */}
        <div className="flex justify-end gap-4">
          <Link href="/settings/users">
            <Button type="button" variant="outline" disabled={isPending}>
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create User
          </Button>
        </div>
      </form>
    </div>
  )
}
