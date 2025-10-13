'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CalendarIcon, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { createMemberSchema, updateMemberSchema } from '@/lib/validations/member'
import { createMember, updateMember } from '@/lib/actions/members'
import type { CreateMemberInput, UpdateMemberInput } from '@/lib/validations/member'
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
import { ChurchSelect } from '@/components/members/church-select'

interface Church {
  id: string
  name: string
}

interface MemberFormProps {
  churches: Church[]
  userRole: string
  userChurchId: string | null
  initialData?: UpdateMemberInput
  mode?: 'create' | 'edit'
}

export function MemberForm({
  churches,
  userRole,
  userChurchId,
  initialData,
  mode = 'create',
}: MemberFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<CreateMemberInput | UpdateMemberInput>({
    resolver: zodResolver(mode === 'create' ? createMemberSchema : updateMemberSchema),
    defaultValues: initialData || {
      church_id: userRole === 'admin' ? userChurchId || '' : '',
      full_name: '',
      birthday: '',
      age: 0,
      gender: undefined,
      date_of_baptism: null,
      baptized_by: null,
      physical_condition: 'fit',
      illness_description: null,
      spiritual_condition: 'active',
      status: 'active',
      sp: null,
    },
  })

  const watchBirthday = form.watch('birthday')
  const watchPhysicalCondition = form.watch('physical_condition')

  // Auto-calculate age when birthday changes
  const calculateAge = (birthday: string) => {
    if (!birthday) return 0
    const birthDate = new Date(birthday)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  // Update age when birthday changes
  if (watchBirthday) {
    const calculatedAge = calculateAge(watchBirthday)
    if (form.getValues('age') !== calculatedAge) {
      form.setValue('age', calculatedAge)
    }
  }

  const onSubmit = async (data: CreateMemberInput | UpdateMemberInput) => {
    setIsSubmitting(true)

    try {
      const result = mode === 'create'
        ? await createMember(data as CreateMemberInput)
        : await updateMember(data as UpdateMemberInput)

      if ('error' in result) {
        toast.error(result.error)
      } else {
        toast.success(`Member ${mode === 'create' ? 'created' : 'updated'} successfully`)
        router.push('/members')
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Church Selection */}
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
                  disabled={userRole === 'admin'}
                  placeholder="Select a church"
                />
              </FormControl>
              {userRole === 'admin' && (
                <FormDescription>
                  You can only add members to your church
                </FormDescription>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Full Name */}
        <FormField
          control={form.control}
          name="full_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name *</FormLabel>
              <FormControl>
                <Input placeholder="Juan Dela Cruz" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Birthday */}
        <FormField
          control={form.control}
          name="birthday"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Birthday *</FormLabel>
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
                    onSelect={(date) => {
                      field.onChange(date ? format(date, 'yyyy-MM-dd') : '')
                    }}
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
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Age (auto-calculated, read-only) */}
        <FormField
          control={form.control}
          name="age"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Age</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  {...field}
                  readOnly
                  className="bg-gray-50"
                />
              </FormControl>
              <FormDescription>
                Automatically calculated from birthday
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Gender */}
        <FormField
          control={form.control}
          name="gender"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Gender (Optional)</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Date of Baptism */}
        <FormField
          control={form.control}
          name="date_of_baptism"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Date of Baptism (Optional)</FormLabel>
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
                    onSelect={(date) => {
                      field.onChange(date ? format(date, 'yyyy-MM-dd') : null)
                    }}
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
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Baptized By */}
        <FormField
          control={form.control}
          name="baptized_by"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Baptized By (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="Pastor/Minister name" {...field} value={field.value || ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Physical Condition */}
        <FormField
          control={form.control}
          name="physical_condition"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Physical Condition</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select condition" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="fit">Fit</SelectItem>
                  <SelectItem value="sickly">Sickly</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Illness Description (conditional) */}
        {watchPhysicalCondition === 'sickly' && (
          <FormField
            control={form.control}
            name="illness_description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Illness Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Describe the illness or health condition"
                    className="resize-none"
                    {...field}
                    value={field.value || ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Spiritual Condition */}
        <FormField
          control={form.control}
          name="spiritual_condition"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Spiritual Condition</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select condition" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Status */}
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="transferred_out">Transferred Out</SelectItem>
                  <SelectItem value="resigned">Resigned</SelectItem>
                  <SelectItem value="disfellowshipped">Disfellowshipped</SelectItem>
                  <SelectItem value="deceased">Deceased</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* SP Number */}
        <FormField
          control={form.control}
          name="sp"
          render={({ field }) => (
            <FormItem>
              <FormLabel>SP Number (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="SP-12345" {...field} value={field.value || ''} />
              </FormControl>
              <FormDescription>
                Special number for tracking purposes
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Form Actions */}
        <div className="flex gap-4">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === 'create' ? 'Create Member' : 'Update Member'}
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
