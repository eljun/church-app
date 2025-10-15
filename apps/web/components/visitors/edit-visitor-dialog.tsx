'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Loader2, CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import type { Visitor } from '@church-app/database'
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
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { toast } from 'sonner'
import { updateVisitor } from '@/lib/actions/visitors'
import { cn } from '@/lib/utils'

interface EditVisitorDialogProps {
  visitor: Visitor
  trigger?: React.ReactNode
}

export function EditVisitorDialog({ visitor, trigger }: EditVisitorDialogProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  // Form state - initialize with visitor data
  const [fullName, setFullName] = useState(visitor.full_name || '')
  const [birthday, setBirthday] = useState<Date | undefined>(
    visitor.birthday ? new Date(visitor.birthday) : undefined
  )
  const [gender, setGender] = useState<string>(visitor.gender || 'not_specified')
  const [phone, setPhone] = useState(visitor.phone || '')
  const [email, setEmail] = useState(visitor.email || '')
  const [address, setAddress] = useState(visitor.address || '')
  const [city, setCity] = useState(visitor.city || '')
  const [province, setProvince] = useState(visitor.province || '')
  const [notes, setNotes] = useState(visitor.notes || '')

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setFullName(visitor.full_name || '')
      setBirthday(visitor.birthday ? new Date(visitor.birthday) : undefined)
      setGender(visitor.gender || 'not_specified')
      setPhone(visitor.phone || '')
      setEmail(visitor.email || '')
      setAddress(visitor.address || '')
      setCity(visitor.city || '')
      setProvince(visitor.province || '')
      setNotes(visitor.notes || '')
    }
  }, [open, visitor])

  const calculateAge = (birthDate: Date): number => {
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  const handleSubmit = () => {
    // Validation
    if (!fullName.trim()) {
      toast.error('Full name is required')
      return
    }
    if (!phone.trim()) {
      toast.error('Phone number is required')
      return
    }

    startTransition(async () => {
      // Calculate age and visitor type if birthday is provided
      const age = birthday ? calculateAge(birthday) : visitor.age
      let visitorType: 'adult' | 'youth' | 'child' = visitor.visitor_type || 'adult'
      if (birthday && age !== null) {
        if (age < 12) visitorType = 'child'
        else if (age < 18) visitorType = 'youth'
        else visitorType = 'adult'
      }

      const updateData = {
        id: visitor.id,
        full_name: fullName.trim(),
        phone: phone.trim(),
        email: email.trim() || null,
        address: address.trim() || null,
        city: city.trim() || null,
        province: province.trim() || null,
        notes: notes.trim() || null,
        ...(birthday && {
          birthday: format(birthday, 'yyyy-MM-dd'),
          age,
          visitor_type: visitorType,
        }),
        ...(gender !== 'not_specified' && {
          gender: gender as 'male' | 'female' | 'other',
        }),
      }

      const result = await updateVisitor(updateData)

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Visitor updated successfully')
        setOpen(false)
        router.refresh()
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <Pencil className="mr-2 h-4 w-4" />
            Edit Profile
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Visitor Profile</DialogTitle>
          <DialogDescription>
            Update visitor information. Fields marked with * are required.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm">Basic Information</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="full-name">Full Name *</Label>
                <Input
                  id="full-name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter full name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="birthday">Birthday</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="birthday"
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !birthday && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {birthday ? format(birthday, 'PPP') : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={birthday}
                      onSelect={setBirthday}
                      disabled={(date) =>
                        date > new Date() || date < new Date('1900-01-01')
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select value={gender} onValueChange={setGender}>
                  <SelectTrigger id="gender">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_specified">Not Specified</SelectItem>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm">Contact Information</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g., +639123456789"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                />
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm">Address</h3>

            <div className="space-y-2">
              <Label htmlFor="address">Street Address</Label>
              <Input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Street, Barangay"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="City"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="province">Province</Label>
                <Input
                  id="province"
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                  placeholder="Province"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional information..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
