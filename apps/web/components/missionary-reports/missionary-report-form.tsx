'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CalendarIcon, Loader2, Copy, Plus, Minus, Info } from 'lucide-react'
import { format } from 'date-fns'
import { createMissionaryReportSchema, updateMissionaryReportSchema } from '@/lib/validations/missionary-report'
import { createMissionaryReport, updateMissionaryReport, getLastReportForCopy } from '@/lib/actions/missionary-reports'
import type { CreateMissionaryReportInput, UpdateMissionaryReportInput } from '@/lib/validations/missionary-report'
import type { Church } from '@church-app/database'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { ChurchSelect } from '@/components/shared'

interface MissionaryReportFormProps {
  churches: Church[]
  userRole: string
  userChurchId: string | null
  initialData?: UpdateMissionaryReportInput
  mode?: 'create' | 'edit'
}

export function MissionaryReportForm({
  churches,
  userRole,
  userChurchId,
  initialData,
  mode = 'create',
}: MissionaryReportFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCopyingLast, setIsCopyingLast] = useState(false)

  const form = useForm<CreateMissionaryReportInput | UpdateMissionaryReportInput>({
    resolver: zodResolver(mode === 'create' ? createMissionaryReportSchema : updateMissionaryReportSchema),
    defaultValues: initialData || {
      church_id: userRole === 'admin' ? userChurchId || '' : '',
      report_date: format(new Date(), 'yyyy-MM-dd'),
      report_type: 'weekly',
      bible_studies_given: 0,
      home_visits: 0,
      seminars_conducted: 0,
      conferences_conducted: 0,
      public_lectures: 0,
      pamphlets_distributed: 0,
      books_distributed: 0,
      magazines_distributed: 0,
      youth_anchor: 0,
      notes: null,
      highlights: null,
      challenges: null,
    },
  })

  const watchChurchId = form.watch('church_id')
  const watchReportType = form.watch('report_type')

  // Calculate total activities for summary card
  const totalActivities =
    (form.watch('bible_studies_given') || 0) +
    (form.watch('home_visits') || 0) +
    (form.watch('seminars_conducted') || 0) +
    (form.watch('conferences_conducted') || 0) +
    (form.watch('public_lectures') || 0) +
    (form.watch('pamphlets_distributed') || 0) +
    (form.watch('books_distributed') || 0) +
    (form.watch('magazines_distributed') || 0) +
    (form.watch('youth_anchor') || 0)

  const handleCopyLastReport = async () => {
    if (!watchChurchId) {
      toast.error('Please select a church first')
      return
    }

    setIsCopyingLast(true)

    try {
      const result = await getLastReportForCopy(watchChurchId, watchReportType || 'weekly')

      if ('error' in result) {
        toast.error(result.error || 'No previous report found to copy')
      } else if (result.data) {
        // Copy all metrics from the last report
        form.setValue('bible_studies_given', result.data.bible_studies_given)
        form.setValue('home_visits', result.data.home_visits)
        form.setValue('seminars_conducted', result.data.seminars_conducted)
        form.setValue('conferences_conducted', result.data.conferences_conducted)
        form.setValue('public_lectures', result.data.public_lectures)
        form.setValue('pamphlets_distributed', result.data.pamphlets_distributed)
        form.setValue('books_distributed', result.data.books_distributed)
        form.setValue('magazines_distributed', result.data.magazines_distributed)
        form.setValue('youth_anchor', result.data.youth_anchor)

        toast.success('Last report copied! You can now adjust the numbers.')
      } else {
        toast.info('No previous report found for this church')
      }
    } catch {
      toast.error('Failed to copy last report')
    } finally {
      setIsCopyingLast(false)
    }
  }

  const onSubmit = async (data: CreateMissionaryReportInput | UpdateMissionaryReportInput) => {
    setIsSubmitting(true)

    try {
      const result =
        mode === 'create'
          ? await createMissionaryReport(data as CreateMissionaryReportInput)
          : await updateMissionaryReport(data as UpdateMissionaryReportInput)

      if ('error' in result) {
        toast.error(result.error)
      } else {
        toast.success(`Missionary report ${mode === 'create' ? 'created' : 'updated'} successfully`)
        router.push('/missionary-reports')
        router.refresh()
      }
    } catch {
      toast.error('An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Helper to increment/decrement number fields
  const adjustValue = (fieldName: keyof CreateMissionaryReportInput, delta: number) => {
    const currentValue = (form.getValues(fieldName) as number) || 0
    const newValue = Math.max(0, currentValue + delta)
    form.setValue(fieldName, newValue)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Summary Card */}
        <Card>
          <CardHeader>
            <CardTitle>Report Summary</CardTitle>
            <CardDescription>
              Total activities: <span className="font-semibold text-lg">{totalActivities}</span>
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Church Selection */}
            {userRole === 'admin' ? (
              <FormField
                control={form.control}
                name="church_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Church</FormLabel>
                    <FormControl>
                      <Input
                        value={churches.find((c) => c.id === userChurchId)?.name || 'Your Church'}
                        disabled
                        className="bg-muted"
                      />
                    </FormControl>
                    <FormDescription>Admin users can only create reports for their church</FormDescription>
                  </FormItem>
                )}
              />
            ) : (
              <FormField
                control={form.control}
                name="church_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Church *</FormLabel>
                    <FormControl>
                      <ChurchSelect
                        churches={churches}
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={mode === 'edit'}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Report Date */}
              <FormField
                control={form.control}
                name="report_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Report Date *</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn('w-full justify-start text-left font-normal', !field.value && 'text-muted-foreground')}
                            disabled={mode === 'edit'}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value ? format(new Date(field.value), 'PPP') : <span>Pick a date</span>}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={field.value ? new Date(field.value) : undefined}
                          onSelect={(date) => field.onChange(date ? format(date, 'yyyy-MM-dd') : '')}
                          disabled={mode === 'edit'}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Report Type */}
              <FormField
                control={form.control}
                name="report_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      Report Type *
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent side="right" className="max-w-xs">
                            <p className="font-semibold mb-1">Report Types:</p>
                            <ul className="space-y-1 text-sm">
                              <li><strong>Weekly:</strong> Regular weekly missionary report</li>
                              <li><strong>Biennial:</strong> Report for biennial conference (every 2 years)</li>
                              <li><strong>Triennial:</strong> Report for triennial conference (every 3 years)</li>
                            </ul>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={mode === 'edit'}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select report type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="biennial">Biennial (Every 2 Years)</SelectItem>
                        <SelectItem value="triennial">Triennial (Every 3 Years)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Copy Last Report Button */}
            {mode === 'create' && watchChurchId && (
              <Button
                type="button"
                variant="outline"
                onClick={handleCopyLastReport}
                disabled={isCopyingLast}
                className="w-full md:w-auto"
              >
                {isCopyingLast ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Copying...
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Last Report
                  </>
                )}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Missionary Activities */}
        <Card>
          <CardHeader>
            <CardTitle>Missionary Activities</CardTitle>
            <CardDescription>Enter the number of activities for this reporting period</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Bible Studies */}
              <FormField
                control={form.control}
                name="bible_studies_given"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bible Studies Given</FormLabel>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => adjustValue('bible_studies_given', -1)}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          {...field}
                          value={field.value || 0}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          className="text-center"
                        />
                      </FormControl>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => adjustValue('bible_studies_given', 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Home Visits */}
              <FormField
                control={form.control}
                name="home_visits"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Home Visits</FormLabel>
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" size="icon" onClick={() => adjustValue('home_visits', -1)}>
                        <Minus className="h-4 w-4" />
                      </Button>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          {...field}
                          value={field.value || 0}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          className="text-center"
                        />
                      </FormControl>
                      <Button type="button" variant="outline" size="icon" onClick={() => adjustValue('home_visits', 1)}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Seminars */}
              <FormField
                control={form.control}
                name="seminars_conducted"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Seminars Conducted</FormLabel>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => adjustValue('seminars_conducted', -1)}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          {...field}
                          value={field.value || 0}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          className="text-center"
                        />
                      </FormControl>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => adjustValue('seminars_conducted', 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Conferences */}
              <FormField
                control={form.control}
                name="conferences_conducted"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Conferences Conducted</FormLabel>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => adjustValue('conferences_conducted', -1)}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          {...field}
                          value={field.value || 0}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          className="text-center"
                        />
                      </FormControl>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => adjustValue('conferences_conducted', 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Public Lectures */}
              <FormField
                control={form.control}
                name="public_lectures"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Public Lectures</FormLabel>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => adjustValue('public_lectures', -1)}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          {...field}
                          value={field.value || 0}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          className="text-center"
                        />
                      </FormControl>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => adjustValue('public_lectures', 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Pamphlets */}
              <FormField
                control={form.control}
                name="pamphlets_distributed"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pamphlets Distributed</FormLabel>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => adjustValue('pamphlets_distributed', -1)}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          {...field}
                          value={field.value || 0}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          className="text-center"
                        />
                      </FormControl>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => adjustValue('pamphlets_distributed', 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Books */}
              <FormField
                control={form.control}
                name="books_distributed"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Books Distributed</FormLabel>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => adjustValue('books_distributed', -1)}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          {...field}
                          value={field.value || 0}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          className="text-center"
                        />
                      </FormControl>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => adjustValue('books_distributed', 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Magazines */}
              <FormField
                control={form.control}
                name="magazines_distributed"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Magazines Distributed</FormLabel>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => adjustValue('magazines_distributed', -1)}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          {...field}
                          value={field.value || 0}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          className="text-center"
                        />
                      </FormControl>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => adjustValue('magazines_distributed', 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Youth Anchor */}
              <FormField
                control={form.control}
                name="youth_anchor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Youth Anchor</FormLabel>
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" size="icon" onClick={() => adjustValue('youth_anchor', -1)}>
                        <Minus className="h-4 w-4" />
                      </Button>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          {...field}
                          value={field.value || 0}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          className="text-center"
                        />
                      </FormControl>
                      <Button type="button" variant="outline" size="icon" onClick={() => adjustValue('youth_anchor', 1)}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Optional Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
            <CardDescription>Optional fields to provide more context about your missionary activities</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Highlights */}
            <FormField
              control={form.control}
              name="highlights"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Highlights</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Notable achievements or success stories from this period..."
                      className="min-h-[80px]"
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Challenges */}
            <FormField
              control={form.control}
              name="challenges"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Challenges</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Difficulties or obstacles encountered..."
                      className="min-h-[80px]"
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any additional notes or comments..."
                      className="min-h-[80px]"
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex gap-4 justify-end">
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {mode === 'create' ? 'Creating...' : 'Updating...'}
              </>
            ) : (
              <>{mode === 'create' ? 'Create Report' : 'Update Report'}</>
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}
