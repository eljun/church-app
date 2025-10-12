'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CalendarIcon, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { createChurchSchema, updateChurchSchema } from '@/lib/validations/church'
import { createChurch, updateChurch } from '@/lib/actions/churches'
import type { CreateChurchInput, UpdateChurchInput } from '@/lib/validations/church'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { ImageUpload } from '@/components/ui/image-upload'
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

interface ChurchFormProps {
  initialData?: UpdateChurchInput
  mode?: 'create' | 'edit'
}

export function ChurchForm({ initialData, mode = 'create' }: ChurchFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<CreateChurchInput | UpdateChurchInput>({
    resolver: zodResolver(mode === 'create' ? createChurchSchema : updateChurchSchema),
    defaultValues: initialData || {
      name: '',
      field: '',
      district: '',
      city: '',
      province: '',
      address: '',
      latitude: undefined,
      longitude: undefined,
      image_url: '',
      images: [],
      is_active: true,
      established_date: undefined,
    },
  })

  const onSubmit = async (data: CreateChurchInput | UpdateChurchInput) => {
    setIsSubmitting(true)

    try {
      let result
      if (mode === 'create') {
        result = await createChurch(data as CreateChurchInput)
      } else {
        result = await updateChurch(data as UpdateChurchInput)
      }

      if ('error' in result) {
        toast.error(result.error)
      } else {
        toast.success(`Church ${mode === 'create' ? 'created' : 'updated'} successfully`)
        router.push('/churches')
        router.refresh()
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>

          {/* Name */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Church Name *</FormLabel>
                <FormControl>
                  <Input placeholder="Enter church name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Field and District */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="field"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Field *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter field" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="district"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>District *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter district" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Location Information */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Location</h2>

          {/* City and Province */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter city" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="province"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Province</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter province" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Address */}
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Address</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Enter complete address"
                    className="resize-none"
                    {...field}
                    value={field.value || ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Coordinates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="latitude"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Latitude</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="any"
                      placeholder="e.g., 14.5995"
                      {...field}
                      value={field.value || ''}
                      onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                    />
                  </FormControl>
                  <FormDescription>
                    For map display (optional)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="longitude"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Longitude</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="any"
                      placeholder="e.g., 120.9842"
                      {...field}
                      value={field.value || ''}
                      onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                    />
                  </FormControl>
                  <FormDescription>
                    For map display (optional)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Additional Information */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Additional Information</h2>

          {/* Established Date */}
          <FormField
            control={form.control}
            name="established_date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Established Date</FormLabel>
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
                          format(new Date(field.value), 'PPP')
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
                      onSelect={(date) => field.onChange(date?.toISOString().split('T')[0])}
                      disabled={(date) => date > new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormDescription>
                  When the church was established
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Church Images */}
          <FormField
            control={form.control}
            name="images"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Church Images</FormLabel>
                <FormControl>
                  <ImageUpload
                    value={field.value || []}
                    onChange={field.onChange}
                    maxFiles={5}
                  />
                </FormControl>
                <FormDescription>
                  Upload up to 5 images. The first image will be the primary photo displayed throughout the app.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Active Status */}
          <FormField
            control={form.control}
            name="is_active"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>
                    Active Church
                  </FormLabel>
                  <FormDescription>
                    Mark as active to include in member dropdowns and reports
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />
        </div>

        {/* Form Actions */}
        <div className="flex gap-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {mode === 'create' ? 'Creating...' : 'Saving...'}
              </>
            ) : (
              mode === 'create' ? 'Create Church' : 'Save Changes'
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  )
}
