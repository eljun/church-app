'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Loader2, CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { toast } from 'sonner'
import { createAndRegisterVisitor, createVisitor } from '@/lib/actions/visitors'
import { ChurchSelect } from '@/components/members/church-select'
import { countries } from '@/lib/data/countries'
import { cn } from '@/lib/utils'

interface Church {
  id: string
  name: string
  district: string
  field: string
}

interface RegisterVisitorDialogProps {
  eventId: string | null // Null when used for attendance (no event registration)
  churches: Church[]
  defaultChurchId?: string // For admins, their church is pre-selected
  onSuccess?: (visitor: any) => void // Callback after visitor is created
}

export function RegisterVisitorDialog({
  eventId,
  churches,
  defaultChurchId,
  onSuccess,
}: RegisterVisitorDialogProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  // Form state
  const [fullName, setFullName] = useState('')
  const [birthday, setBirthday] = useState<Date>()
  const [gender, setGender] = useState<string>()
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [province, setProvince] = useState('')
  const [country, setCountry] = useState('Philippines')

  // Church association
  const [associatedChurchId, setAssociatedChurchId] = useState(defaultChurchId || '')

  // Emergency contact
  const [emergencyContactName, setEmergencyContactName] = useState('')
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('')
  const [relationship, setRelationship] = useState('')

  // Additional info
  const [referralSource, setReferralSource] = useState<string>()
  const [notes, setNotes] = useState('')
  const [registrationNotes, setRegistrationNotes] = useState('')

  const calculateAge = (birthDate: Date): number => {
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  const resetForm = () => {
    setFullName('')
    setBirthday(undefined)
    setGender(undefined)
    setPhone('')
    setEmail('')
    setAddress('')
    setCity('')
    setProvince('')
    setCountry('Philippines')
    setAssociatedChurchId(defaultChurchId || '')
    setEmergencyContactName('')
    setEmergencyContactPhone('')
    setRelationship('')
    setReferralSource(undefined)
    setNotes('')
    setRegistrationNotes('')
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
      // Calculate visitor type based on age
      const age = birthday ? calculateAge(birthday) : null
      let visitorType: 'adult' | 'youth' | 'child' = 'adult'
      if (age !== null) {
        if (age < 12) visitorType = 'child'
        else if (age < 18) visitorType = 'youth'
        else visitorType = 'adult'
      }

      const visitorData = {
        full_name: fullName,
        birthday: birthday ? format(birthday, 'yyyy-MM-dd') : null,
        age,
        gender: (gender as 'male' | 'female' | 'other' | null) || null,
        phone,
        email: email || null,
        address: address || null,
        city: city || null,
        province: province || null,
        country,
        is_baptized: false, // Hidden field, default to false
        date_of_baptism: null,
        baptized_at_church: null,
        baptized_at_country: null,
        associated_church_id: associatedChurchId || null,
        association_reason: associatedChurchId ? 'event_registration' : null,
        emergency_contact_name: emergencyContactName || null,
        emergency_contact_phone: emergencyContactPhone || null,
        relationship: relationship || null,
        visitor_type: visitorType,
        is_accompanied_child: false,
        accompanied_by_member_id: null,
        accompanied_by_visitor_id: null,
        notes: notes || null,
        referral_source: (referralSource as 'member_invitation' | 'online' | 'walk_in' | 'social_media' | 'other' | null) || null,
        first_visit_date: format(new Date(), 'yyyy-MM-dd'),
        follow_up_status: 'pending',
        follow_up_notes: null,
        assigned_to_user_id: null,
      }

      // If eventId is provided, register for event; otherwise just create visitor
      const result = eventId
        ? await createAndRegisterVisitor({
            event_id: eventId,
            visitor: visitorData,
            notes: registrationNotes || null,
          })
        : await createVisitor(visitorData)

      if (result.error) {
        toast.error(result.error)
      } else {
        const message = eventId
          ? `Visitor "${fullName}" registered for event successfully`
          : `Visitor "${fullName}" added successfully`
        toast.success(message)
        setOpen(false)
        resetForm()
        if (onSuccess && result.data) {
          onSuccess(result.data)
        }
        router.refresh()
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Plus className="mr-2 h-4 w-4" />
          Register Visitor
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Register Visitor for Event</DialogTitle>
          <DialogDescription>
            Add a guest/visitor who is not a registered member
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm">Basic Information</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Juan Dela Cruz"
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label>Birthday</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal mt-1.5',
                        !birthday && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {birthday ? format(birthday, 'PPP') : 'Select date'}
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
                      captionLayout="dropdown"
                      fromYear={1900}
                      toYear={new Date().getFullYear()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label htmlFor="gender">Gender</Label>
                <Select value={gender} onValueChange={setGender}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm">Contact Information</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+63 912 345 6789"
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="juan@example.com"
                  className="mt-1.5"
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street address"
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Manila"
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="province">Province</Label>
                <Input
                  id="province"
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                  placeholder="Metro Manila"
                  className="mt-1.5"
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="country">Country</Label>
                <Select value={country} onValueChange={setCountry}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((c) => (
                      <SelectItem key={c.code} value={c.name}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Emergency Contact (Optional) */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm">Emergency Contact (Optional)</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="emergencyContactName">Contact Name</Label>
                <Input
                  id="emergencyContactName"
                  value={emergencyContactName}
                  onChange={(e) => setEmergencyContactName(e.target.value)}
                  placeholder="Parent/Guardian name"
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="emergencyContactPhone">Contact Phone</Label>
                <Input
                  id="emergencyContactPhone"
                  value={emergencyContactPhone}
                  onChange={(e) => setEmergencyContactPhone(e.target.value)}
                  placeholder="+63 912 345 6789"
                  className="mt-1.5"
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="relationship">Relationship</Label>
                <Input
                  id="relationship"
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value)}
                  placeholder="Parent, Guardian, Spouse, etc."
                  className="mt-1.5"
                />
              </div>
            </div>
          </div>

          {/* Church Association */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm">Church Association (for follow-up)</h3>

            <div>
              <Label htmlFor="associatedChurch">Associate with Church</Label>
              <ChurchSelect
                churches={churches}
                value={associatedChurchId}
                onValueChange={setAssociatedChurchId}
                placeholder="Select church for follow-up"
                allowEmpty={true}
                showDistrictAndField={true}
              />
              <p className="text-xs text-muted-foreground mt-1">
                This church will be responsible for following up with this visitor
              </p>
            </div>
          </div>

          {/* Additional Information */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm">Additional Information</h3>

            <div>
              <Label htmlFor="referralSource">How did they hear about us?</Label>
              <Select value={referralSource} onValueChange={setReferralSource}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Select referral source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member_invitation">Member Invitation</SelectItem>
                  <SelectItem value="online">Online/Website</SelectItem>
                  <SelectItem value="walk_in">Walk-in</SelectItem>
                  <SelectItem value="social_media">Social Media</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="notes">Visitor Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Special needs, dietary restrictions, etc."
                rows={2}
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="registrationNotes">Registration Notes</Label>
              <Textarea
                id="registrationNotes"
                value={registrationNotes}
                onChange={(e) => setRegistrationNotes(e.target.value)}
                placeholder="Notes specific to this event registration"
                rows={2}
                className="mt-1.5"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Register Visitor
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
