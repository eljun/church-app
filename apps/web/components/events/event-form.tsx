'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CalendarIcon, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { createEventSchema, updateEventSchema } from '@/lib/validations/event'
import { createEvent, updateEvent } from '@/lib/actions/events'
import type { CreateEventInput, UpdateEventInput } from '@/lib/validations/event'
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
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Checkbox } from '@/components/ui/checkbox'
import { ImageUpload } from '@/components/ui/image-upload'
import { EventScopeSelector } from '@/components/events/event-scope-selector'
import type { EventScope } from '@/lib/constants/organization'

interface Church {
  id: string
  name: string
}

interface EventFormProps {
  churches: Church[]
  userRole: string
  userChurchId: string | null
  countries: string[]
  districts: string[]
  initialData?: UpdateEventInput
  mode?: 'create' | 'edit'
}

export function EventForm({
  churches,
  userRole,
  userChurchId,
  countries,
  districts,
  initialData,
  mode = 'create',
}: EventFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<CreateEventInput | UpdateEventInput>({
    resolver: zodResolver(mode === 'create' ? createEventSchema : updateEventSchema),
    defaultValues: initialData || {
      church_id: userRole === 'church_secretary' ? userChurchId || '' : undefined,
      title: '',
      description: null,
      event_type: 'service',
      event_scope: 'church',
      scope_value: null,
      start_date: new Date().toISOString(),
      end_date: null,
      location: null,
      image_url: null,
      is_public: true,
    },
  })

  const watchEventScope = form.watch('event_scope')
  const watchScopeValue = form.watch('scope_value')
  const watchChurchId = form.watch('church_id')

  const onSubmit = async (data: CreateEventInput | UpdateEventInput) => {
    setIsSubmitting(true)

    try {
      const result = mode === 'create'
        ? await createEvent(data as CreateEventInput)
        : await updateEvent(data as UpdateEventInput)

      if ('error' in result) {
        toast.error(result.error)
      } else {
        toast.success(`Event ${mode === 'create' ? 'created' : 'updated'} successfully`)
        router.push('/events')
        router.refresh()
      }
    } catch {
      toast.error('An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 overflow-x-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Title */}
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Event Title *</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Sabbath Morning Service" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Description */}
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Describe the event..."
                    className="min-h-[100px]"
                    {...field}
                    value={field.value || ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Event Type - 50% width like dates */}
          <FormField
            control={form.control}
            name="event_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Event Type *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select event type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="service">Service</SelectItem>
                    <SelectItem value="baptism">Baptism</SelectItem>
                    <SelectItem value="conference">Conference</SelectItem>
                    <SelectItem value="social">Social</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Event Scope - 50% width like dates */}
          {userRole === 'church_secretary' ? (
            <FormItem>
              <FormLabel>Event Scope</FormLabel>
              <FormControl>
                <Input
                  value={`Church: ${churches.find(c => c.id === userChurchId)?.name || 'Your Church'}`}
                  disabled
                  className="bg-muted"
                />
              </FormControl>
              <FormDescription>
                Church Secretary users can only create church-specific events
              </FormDescription>
            </FormItem>
          ) : (
            <div>
              <EventScopeSelector
                scope={(watchEventScope || 'church') as EventScope}
                scopeValue={watchScopeValue || null}
                churchId={watchChurchId || null}
                onScopeChange={(scope) => form.setValue('event_scope', scope)}
                onScopeValueChange={(value) => form.setValue('scope_value', value)}
                onChurchIdChange={(value) => form.setValue('church_id', value)}
                countries={countries}
                districts={districts}
                churches={churches}
              />
            </div>
          )}

          {/* Start Date */}
          <FormField
            control={form.control}
            name="start_date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Start Date & Time *</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full pl-3 text-left font-normal',
                          !field.value && 'text-muted-foreground'
                        )}
                      >
                        {field.value ? (
                          format(new Date(field.value), 'PPP p')
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value ? new Date(field.value) : undefined}
                      onSelect={(date) => {
                        if (date) {
                          // Preserve time if it exists
                          const currentDate = field.value ? new Date(field.value) : new Date()
                          date.setHours(currentDate.getHours())
                          date.setMinutes(currentDate.getMinutes())
                          field.onChange(date.toISOString())
                        }
                      }}
                      initialFocus
                    />
                    <div className="p-3 border-t">
                      <Input
                        type="time"
                        value={field.value ? format(new Date(field.value), 'HH:mm') : ''}
                        onChange={(e) => {
                          const [hours, minutes] = e.target.value.split(':')
                          const date = field.value ? new Date(field.value) : new Date()
                          date.setHours(parseInt(hours))
                          date.setMinutes(parseInt(minutes))
                          field.onChange(date.toISOString())
                        }}
                      />
                    </div>
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* End Date */}
          <FormField
            control={form.control}
            name="end_date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>End Date & Time</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full pl-3 text-left font-normal',
                          !field.value && 'text-muted-foreground'
                        )}
                      >
                        {field.value ? (
                          format(new Date(field.value), 'PPP p')
                        ) : (
                          <span>Pick a date (optional)</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value ? new Date(field.value) : undefined}
                      onSelect={(date) => {
                        if (date) {
                          const currentDate = field.value ? new Date(field.value) : new Date()
                          date.setHours(currentDate.getHours())
                          date.setMinutes(currentDate.getMinutes())
                          field.onChange(date.toISOString())
                        } else {
                          field.onChange(null)
                        }
                      }}
                      initialFocus
                    />
                    {field.value && (
                      <div className="p-3 border-t space-y-2">
                        <Input
                          type="time"
                          value={format(new Date(field.value), 'HH:mm')}
                          onChange={(e) => {
                            const [hours, minutes] = e.target.value.split(':')
                            const date = new Date(field.value!)
                            date.setHours(parseInt(hours))
                            date.setMinutes(parseInt(minutes))
                            field.onChange(date.toISOString())
                          }}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="w-full"
                          onClick={() => field.onChange(null)}
                        >
                          Clear
                        </Button>
                      </div>
                    )}
                  </PopoverContent>
                </Popover>
                <FormDescription>
                  Optional - for multi-day events
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Location - Full Width */}
          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Location</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g., Main Sanctuary, Fellowship Hall"
                    {...field}
                    value={field.value || ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Is Public - MOVED BEFORE Image Upload */}
          <FormField
            control={form.control}
            name="is_public"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 md:col-span-2">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>
                    Public Event
                  </FormLabel>
                  <FormDescription>
                    Make this event visible to all users in the organization
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />

          {/* Event Image Upload - MOVED AFTER Checkbox */}
          <FormField
            control={form.control}
            name="image_url"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Event Image</FormLabel>
                <FormControl>
                  <ImageUpload
                    value={field.value ? [field.value] : []}
                    onChange={(urls) => field.onChange(urls[0] || null)}
                    maxFiles={1}
                    bucketName="church-images"
                    path="events"
                  />
                </FormControl>
                <FormDescription>
                  Upload a custom image for this event
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

        </div>

        {/* Submit Buttons */}
        <div className="flex gap-4 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === 'create' ? 'Create Event' : 'Update Event'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
