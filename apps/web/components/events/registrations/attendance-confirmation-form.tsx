'use client'

import { useState, useTransition, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { UserRoundCheck, UserRoundMinus, Loader2, Users, Clock, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { StatisticsCard } from '@/components/reports/statistics-card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { toast } from 'sonner'
import { confirmAttendanceBulk, updateRegistrationAttendance, finalizeEventAttendance } from '@/lib/actions/event-registrations'
import type { EventRegistrationWithDetails } from '@/lib/queries/event-registrations'
import { AttendanceFilters } from './attendance-filters'
import { Card, CardContent } from '@/components/ui/card'
import { ShieldCheck } from 'lucide-react'

interface AttendanceConfirmationFormProps {
  registrations: EventRegistrationWithDetails[]
  eventId: string
  userRole: 'superadmin' | 'coordinator' | 'admin' | 'member'
}

export function AttendanceConfirmationForm({
  registrations,
  eventId,
  userRole,
}: AttendanceConfirmationFormProps) {
  const [selectedRegistrations, setSelectedRegistrations] = useState<string[]>([])
  const [isPending, startTransition] = useTransition()
  const [searchQuery, setSearchQuery] = useState('')
  const [filterChurch, setFilterChurch] = useState<string>('all')
  const [filterDistrict, setFilterDistrict] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const router = useRouter()

  // Extract unique churches and districts from registrations
  const { churches, districts } = useMemo(() => {
    const churchSet = new Map<string, string>()
    const districtSet = new Set<string>()

    registrations.forEach(reg => {
      if (reg.members.churches) {
        churchSet.set(reg.members.churches.id, reg.members.churches.name)
        if (reg.members.churches.district) {
          districtSet.add(reg.members.churches.district)
        }
      }
    })

    return {
      churches: Array.from(churchSet.entries()).map(([id, name]) => ({ id, name })),
      districts: Array.from(districtSet).sort(),
    }
  }, [registrations])

  // Filter and sort registrations based on search and filters
  const filteredRegistrations = useMemo(() => {
    const filtered = registrations.filter(reg => {
      const matchesSearch = searchQuery === '' ||
        reg.members.full_name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesChurch = filterChurch === 'all' ||
        reg.members.churches.id === filterChurch
      const matchesDistrict = filterDistrict === 'all' ||
        reg.members.churches.district === filterDistrict
      const matchesStatus = filterStatus === 'all' ||
        reg.status === filterStatus
      return matchesSearch && matchesChurch && matchesDistrict && matchesStatus
    })

    // Sort by status: registered first, then attended, then no_show, then cancelled
    const statusOrder: Record<string, number> = {
      registered: 1,
      attended: 2,
      no_show: 3,
      cancelled: 4,
      confirmed: 5,
    }

    return filtered.sort((a, b) => {
      const orderA = statusOrder[a.status] || 999
      const orderB = statusOrder[b.status] || 999
      return orderA - orderB
    })
  }, [registrations, searchQuery, filterChurch, filterDistrict, filterStatus])

  // Calculate stats from filtered registrations
  const stats = useMemo(() => {
    const registered = filteredRegistrations.filter(r => r.status === 'registered').length
    const attended = filteredRegistrations.filter(r => r.status === 'attended').length
    const noShow = filteredRegistrations.filter(r => r.status === 'no_show').length
    const confirmed = filteredRegistrations.filter(r => r.status === 'confirmed').length
    return { total: filteredRegistrations.length, registered, attended, noShow, confirmed }
  }, [filteredRegistrations])

  // Calculate stats from all registrations (for finalization)
  const allStats = useMemo(() => {
    const attended = registrations.filter(r => r.status === 'attended' && !r.final_confirmed_at).length
    const noShow = registrations.filter(r => r.status === 'no_show' && !r.final_confirmed_at).length
    const finalized = registrations.filter(r => r.final_confirmed_at !== null).length
    return { attended, noShow, finalized, readyToFinalize: attended + noShow }
  }, [registrations])

  // Only show "registered" (pending) registrations for checkbox selection
  const registeredOnly = filteredRegistrations.filter(r => r.status === 'registered')

  const handleToggleRegistration = (registrationId: string) => {
    setSelectedRegistrations(prev =>
      prev.includes(registrationId)
        ? prev.filter(id => id !== registrationId)
        : [...prev, registrationId]
    )
  }

  const handleToggleAll = () => {
    const registeredIds = registeredOnly.map(r => r.id)
    if (selectedRegistrations.length === registeredIds.length && registeredIds.length > 0) {
      setSelectedRegistrations([])
    } else {
      setSelectedRegistrations(registeredIds)
    }
  }

  const handleMarkAttended = () => {
    if (selectedRegistrations.length === 0) {
      toast.error('Please select at least one registration')
      return
    }

    startTransition(async () => {
      const result = await confirmAttendanceBulk({
        registration_ids: selectedRegistrations,
        status: 'attended',
      })

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(`${selectedRegistrations.length} member(s) marked as attended`)
        setSelectedRegistrations([])
        router.refresh()
      }
    })
  }

  const handleMarkNoShow = () => {
    if (selectedRegistrations.length === 0) {
      toast.error('Please select at least one registration')
      return
    }

    startTransition(async () => {
      const result = await confirmAttendanceBulk({
        registration_ids: selectedRegistrations,
        status: 'no_show',
      })

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(`${selectedRegistrations.length} member(s) marked as no-show`)
        setSelectedRegistrations([])
        router.refresh()
      }
    })
  }

  const handleMarkAttendedIndividual = (registrationId: string) => {
    startTransition(async () => {
      const result = await updateRegistrationAttendance(registrationId, 'attended')

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Marked as attended')
        router.refresh()
      }
    })
  }

  const handleMarkNoShowIndividual = (registrationId: string) => {
    startTransition(async () => {
      const result = await updateRegistrationAttendance(registrationId, 'no_show')

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Marked as no-show')
        router.refresh()
      }
    })
  }

  const handleFinalizeAttendance = () => {
    if (allStats.readyToFinalize === 0) {
      toast.error('No records ready to finalize')
      return
    }

    startTransition(async () => {
      const result = await finalizeEventAttendance({ event_id: eventId })

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(`${result.count} record(s) finalized and locked`)
        router.refresh()
      }
    })
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success', label: string }> = {
      registered: { variant: 'default', label: 'Pending' },
      attended: { variant: 'success', label: 'Attended' },
      no_show: { variant: 'destructive', label: 'No Show' },
      cancelled: { variant: 'destructive', label: 'Cancelled' },
    }
    const config = variants[status] || { variant: 'outline' as const, label: status }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const activeFiltersCount = [
    searchQuery !== '',
    filterChurch !== 'all',
    filterDistrict !== 'all',
    filterStatus !== 'all',
  ].filter(Boolean).length

  const handleClearFilters = () => {
    setSearchQuery('')
    setFilterChurch('all')
    setFilterDistrict('all')
    setFilterStatus('all')
  }

  return (
    <div className="space-y-6">
      {/* Superadmin/Coordinator Final Confirmation Section */}
      {(userRole === 'superadmin' || userRole === 'coordinator') && allStats.readyToFinalize > 0 && (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-accent/20 p-3 rounded-lg">
                  <ShieldCheck className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Finalize Event Attendance</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {allStats.readyToFinalize} record(s) ready to be locked: {allStats.attended} attended, {allStats.noShow} no-shows
                  </p>
                  {allStats.finalized > 0 && (
                    <p className="text-sm text-purple-600 mt-1">
                      {allStats.finalized} record(s) already finalized
                    </p>
                  )}
                </div>
              </div>
              <Button
                onClick={handleFinalizeAttendance}
                disabled={isPending || allStats.readyToFinalize === 0}
                size="lg"
                className="bg-primary hover:bg-accent"
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Finalizing...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    Finalize & Lock ({allStats.readyToFinalize})
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatisticsCard
          title="Total Registrations"
          value={stats.total}
          description="All registered members"
          icon={Users}
        />
        <StatisticsCard
          title="Pending"
          value={stats.registered}
          description="Awaiting confirmation"
          icon={Clock}
        />
        <StatisticsCard
          title="Attended"
          value={stats.attended}
          description="Confirmed attendance"
          icon={CheckCircle}
        />
        <StatisticsCard
          title="No Show"
          value={stats.noShow}
          description="Did not attend"
          icon={XCircle}          
        />
      </div>

      {/* Search & Filters */}
      <AttendanceFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filterChurch={filterChurch}
        onChurchChange={setFilterChurch}
        filterDistrict={filterDistrict}
        onDistrictChange={setFilterDistrict}
        filterStatus={filterStatus}
        onStatusChange={setFilterStatus}
        churches={churches}
        districts={districts}
        activeFiltersCount={activeFiltersCount}
        onClearFilters={handleClearFilters}
      />

      {/* Bulk Actions - Above Table */}
      {registeredOnly.length > 0 && (
        <div className="flex items-center gap-4 p-4 bg-muted/50 border">
          <div className="flex items-center gap-2">
            <Checkbox
              id="select-all"
              checked={registeredOnly.length > 0 && selectedRegistrations.length === registeredOnly.length}
              onCheckedChange={handleToggleAll}
            />
            <label htmlFor="select-all" className="text-sm font-medium">
              Select All Pending ({registeredOnly.length})
            </label>
          </div>
          <div className="flex-1" />
          <div className="flex gap-2">
            <Button
              onClick={handleMarkAttended}
              disabled={isPending || selectedRegistrations.length === 0}
              size="sm"
            >
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserRoundCheck className="mr-2 h-4 w-4" />}
              Mark Attended ({selectedRegistrations.length})
            </Button>
            <Button
              onClick={handleMarkNoShow}
              disabled={isPending || selectedRegistrations.length === 0}
              variant="outline"
              size="sm"
            >
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserRoundMinus className="mr-2 h-4 w-4" />}
              Mark No-Show ({selectedRegistrations.length})
            </Button>
          </div>
        </div>
      )}

      {/* Registrations Table */}
      {filteredRegistrations.length === 0 ? (
        <div className="text-center py-12 border bg-muted/20">
          <p className="text-muted-foreground">
            {activeFiltersCount > 0
              ? 'No members match your filters. Try adjusting your search or filters.'
              : 'No registrations found for this event.'}
          </p>
        </div>
      ) : (
        <div className="bg-white border border-primary/20">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">Select</TableHead>
                <TableHead>Member Name</TableHead>
                <TableHead>Church</TableHead>
                <TableHead>District</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRegistrations.map((registration) => (
                <TableRow key={registration.id}>
                  <TableCell>
                    {registration.status === 'registered' && (
                      <Checkbox
                        checked={selectedRegistrations.includes(registration.id)}
                        onCheckedChange={() => handleToggleRegistration(registration.id)}
                      />
                    )}
                  </TableCell>
                  <TableCell className="font-medium">
                    {registration.members.full_name}
                  </TableCell>
                  <TableCell className="text-sm">
                    {registration.members.churches.name}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {registration.members.churches.district}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(registration.status)}
                      {registration.final_confirmed_at && (
                        <span className="text-xs text-purple-600">🔒</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {registration.final_confirmed_at ? (
                      <span className="text-xs text-purple-600 font-medium">Finalized</span>
                    ) : (
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMarkAttendedIndividual(registration.id)}
                          disabled={isPending}
                          title="Mark as attended"
                        >
                          <UserRoundCheck className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMarkNoShowIndividual(registration.id)}
                          disabled={isPending}
                          title="Mark as no-show"
                        >
                          <UserRoundMinus className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
