'use client'

import { useState, useEffect, useMemo } from 'react'
import { format } from 'date-fns'
import { Calendar as CalendarIcon, CheckCircle2, Users, User, Search } from 'lucide-react'
import type { User as UserType, Church, Member, Visitor } from '@church-app/database'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { recordBulkAttendance } from '@/lib/actions/attendance'
import { fetchMembersForAttendance } from '@/lib/actions/members'
import { fetchVisitorsForAttendance } from '@/lib/actions/visitors'
import { RegisterVisitorDialog } from '@/components/events/registrations/register-visitor-dialog'

interface QuickAttendanceFormProps {
  currentUser: UserType & { churches?: Church }
  churches: Church[]
}

export function QuickAttendanceForm({ currentUser, churches }: QuickAttendanceFormProps) {
  const [date, setDate] = useState<Date>(new Date())
  const [serviceType, setServiceType] = useState<string>('sabbath_morning')
  const [selectedChurchId, setSelectedChurchId] = useState<string>(
    currentUser.role === 'admin' ? currentUser.church_id || '' : ''
  )
  const [members, setMembers] = useState<Member[]>([])
  const [visitors, setVisitors] = useState<Visitor[]>([])
  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(new Set())
  const [selectedVisitorIds, setSelectedVisitorIds] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Load members and visitors when church is selected
  useEffect(() => {
    async function loadAttendees() {
      if (!selectedChurchId) {
        setMembers([])
        setVisitors([])
        return
      }

      setIsLoading(true)
      try {
        // Load active members
        const membersResult = await fetchMembersForAttendance(selectedChurchId)
        if (membersResult.error) {
          console.error('Error loading members:', membersResult.error)
          toast.error(`Failed to load members: ${membersResult.error}`)
        } else {
          setMembers(membersResult.data || [])
        }

        // Load visitors associated with this church
        const visitorsResult = await fetchVisitorsForAttendance(selectedChurchId)
        if (visitorsResult.error) {
          console.error('Error loading visitors:', visitorsResult.error)
          toast.error(`Failed to load visitors: ${visitorsResult.error}`)
        } else {
          setVisitors(visitorsResult.data || [])
        }
      } catch (error) {
        console.error('Error loading attendees:', error)
        toast.error('Failed to load members and visitors')
      } finally {
        setIsLoading(false)
      }
    }

    loadAttendees()
  }, [selectedChurchId])

  // Filter members and visitors by search query
  const filteredMembers = useMemo(() => {
    if (!searchQuery) return members
    const query = searchQuery.toLowerCase()
    return members.filter(m =>
      m.full_name.toLowerCase().includes(query) ||
      m.sp?.toLowerCase().includes(query)
    )
  }, [members, searchQuery])

  const filteredVisitors = useMemo(() => {
    if (!searchQuery) return visitors
    const query = searchQuery.toLowerCase()
    return visitors.filter(v =>
      v.full_name.toLowerCase().includes(query) ||
      v.phone?.toLowerCase().includes(query)
    )
  }, [visitors, searchQuery])

  // Toggle member selection
  const toggleMember = (memberId: string) => {
    const newSet = new Set(selectedMemberIds)
    if (newSet.has(memberId)) {
      newSet.delete(memberId)
    } else {
      newSet.add(memberId)
    }
    setSelectedMemberIds(newSet)
  }

  // Toggle visitor selection
  const toggleVisitor = (visitorId: string) => {
    const newSet = new Set(selectedVisitorIds)
    if (newSet.has(visitorId)) {
      newSet.delete(visitorId)
    } else {
      newSet.add(visitorId)
    }
    setSelectedVisitorIds(newSet)
  }

  // Select all members
  const selectAllMembers = () => {
    setSelectedMemberIds(new Set(filteredMembers.map(m => m.id)))
  }

  // Deselect all members
  const deselectAllMembers = () => {
    setSelectedMemberIds(new Set())
  }

  // Handle form submission
  const handleSubmit = async () => {
    if (!selectedChurchId) {
      toast.error('Please select a church')
      return
    }

    if (selectedMemberIds.size === 0 && selectedVisitorIds.size === 0) {
      toast.error('Please select at least one person')
      return
    }

    setIsSubmitting(true)
    try {
      const result = await recordBulkAttendance({
        church_id: selectedChurchId,
        attendance_date: format(date, 'yyyy-MM-dd'),
        service_type: serviceType as 'sabbath_morning' | 'sabbath_afternoon' | 'prayer_meeting' | 'other',
        member_ids: Array.from(selectedMemberIds),
        visitor_ids: Array.from(selectedVisitorIds),
      })

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(result.message || 'Attendance recorded successfully')
        // Clear selections
        setSelectedMemberIds(new Set())
        setSelectedVisitorIds(new Set())
      }
    } catch (error) {
      console.error('Error recording attendance:', error)
      toast.error('Failed to record attendance')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Record Attendance</CardTitle>
        <CardDescription>
          Mark attendance for members and visitors at weekly services
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Church, Date, and Service Type Selection */}
        <div className="grid gap-4 md:grid-cols-3">
          {/* Church Selector - show for all except admin (who has default church) */}
          {currentUser.role === 'admin' ? (
            <div className="space-y-2">
              <Label htmlFor="church">Church</Label>
              <div className="flex h-10 w-full items-center rounded-md border border-input bg-muted px-3 py-2 text-sm">
                {churches.find(c => c.id === selectedChurchId)?.name || 'Your Church'}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="church">Church</Label>
              <Select value={selectedChurchId} onValueChange={setSelectedChurchId}>
                <SelectTrigger id="church">
                  <SelectValue placeholder="Select church" />
                </SelectTrigger>
                <SelectContent>
                  {churches.map((church) => (
                    <SelectItem key={church.id} value={church.id}>
                      {church.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Date Picker */}
          <div className="space-y-2">
            <Label>Service Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !date && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, 'PPP') : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(newDate) => newDate && setDate(newDate)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Service Type */}
          <div className="space-y-2">
            <Label htmlFor="service-type">Service Type</Label>
            <Select value={serviceType} onValueChange={setServiceType}>
              <SelectTrigger id="service-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sabbath_morning">Sabbath Morning</SelectItem>
                <SelectItem value="sabbath_afternoon">Sabbath Afternoon</SelectItem>
                <SelectItem value="prayer_meeting">Prayer Meeting</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Search */}
        {selectedChurchId && (
          <div className="space-y-2">
            <Label htmlFor="search">Search</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Search by name, SP, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        )}

        {/* Member and Visitor Selection */}
        {selectedChurchId && (
          <Tabs defaultValue="members" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="members">
                <Users className="mr-2 h-4 w-4" />
                Members ({selectedMemberIds.size}/{filteredMembers.length})
              </TabsTrigger>
              <TabsTrigger value="visitors">
                <User className="mr-2 h-4 w-4" />
                Visitors ({selectedVisitorIds.size}/{filteredVisitors.length})
              </TabsTrigger>
            </TabsList>

            {/* Members Tab */}
            <TabsContent value="members" className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Select members who attended
                </p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={selectAllMembers}
                  >
                    Select All
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={deselectAllMembers}
                  >
                    Deselect All
                  </Button>
                </div>
              </div>

              <div className="max-h-[400px] overflow-y-auto border rounded-lg p-4 space-y-2">
                {isLoading ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Loading members...
                  </p>
                ) : filteredMembers.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No members found
                  </p>
                ) : (
                  filteredMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center space-x-3 p-2 rounded-md hover:bg-accent cursor-pointer"
                      onClick={() => toggleMember(member.id)}
                    >
                      <Checkbox
                        checked={selectedMemberIds.has(member.id)}
                        onCheckedChange={() => toggleMember(member.id)}
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{member.full_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {member.sp && `SP: ${member.sp} • `}Age: {member.age}
                        </p>
                      </div>
                      {selectedMemberIds.has(member.id) && (
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                      )}
                    </div>
                  ))
                )}
              </div>
            </TabsContent>

            {/* Visitors Tab */}
            <TabsContent value="visitors" className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Select visitors who attended
                </p>
                <RegisterVisitorDialog
                  eventId={null}
                  churches={churches}
                  defaultChurchId={selectedChurchId}
                  onSuccess={(visitor) => {
                    setVisitors([visitor, ...visitors])
                    toast.success('Visitor added successfully')
                  }}
                />
              </div>

              <div className="max-h-[400px] overflow-y-auto border rounded-lg p-4 space-y-2">
                {isLoading ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Loading visitors...
                  </p>
                ) : filteredVisitors.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No visitors found. Click &quot;Register Visitor&quot; to add one.
                  </p>
                ) : (
                  filteredVisitors.map((visitor) => (
                    <div
                      key={visitor.id}
                      className="flex items-center space-x-3 p-2 rounded-md hover:bg-accent cursor-pointer"
                      onClick={() => toggleVisitor(visitor.id)}
                    >
                      <Checkbox
                        checked={selectedVisitorIds.has(visitor.id)}
                        onCheckedChange={() => toggleVisitor(visitor.id)}
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{visitor.full_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {visitor.phone && `${visitor.phone} • `}
                          <Badge variant="secondary" className="text-xs">
                            {visitor.visitor_type}
                          </Badge>
                        </p>
                      </div>
                      {selectedVisitorIds.has(visitor.id) && (
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                      )}
                    </div>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        )}

        {/* Summary and Submit */}
        {selectedChurchId && (
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              Selected: <strong>{selectedMemberIds.size}</strong> members,{' '}
              <strong>{selectedVisitorIds.size}</strong> visitors
            </div>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || (selectedMemberIds.size === 0 && selectedVisitorIds.size === 0)}
            >
              {isSubmitting ? 'Recording...' : 'Record Attendance'}
            </Button>
          </div>
        )}

        {!selectedChurchId && currentUser.role !== 'admin' && (
          <p className="text-sm text-muted-foreground text-center py-8">
            Please select a church to begin
          </p>
        )}
      </CardContent>
    </Card>
  )
}
