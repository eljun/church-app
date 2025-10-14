'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, ArrowRight } from 'lucide-react'
import { createTransferRequestSchema } from '@/lib/validations/transfer'
import { createTransferRequest } from '@/lib/actions/transfers'
import type { CreateTransferRequestInput } from '@/lib/validations/transfer'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
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
import { MemberSelect } from '@/components/transfers/member-select'
import { ChurchSelect } from '@/components/transfers/church-select'

interface Church {
  id: string
  name: string
  field: string
  district: string
}

interface Member {
  id: string
  full_name: string
  church_id: string
  churches: {
    name: string
  } | null
}

interface TransferRequestFormProps {
  churches: Church[]
  members: Member[]
  userRole: string
  userChurchId: string | null
}

export function TransferRequestForm({
  churches,
  members,
  userRole,
  userChurchId,
}: TransferRequestFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)

  const form = useForm<CreateTransferRequestInput>({
    resolver: zodResolver(createTransferRequestSchema),
    defaultValues: {
      member_id: '',
      from_church_id: '',
      to_church_id: '',
      notes: null,
    },
  })

  const watchMemberId = form.watch('member_id')

  // Auto-fill from_church_id when member is selected
  useEffect(() => {
    if (watchMemberId) {
      const member = members.find((m) => m.id === watchMemberId)
      if (member) {
        setSelectedMember(member)
        form.setValue('from_church_id', member.church_id)
      }
    } else {
      setSelectedMember(null)
      form.setValue('from_church_id', '')
    }
  }, [watchMemberId, members, form])

  const onSubmit = async (data: CreateTransferRequestInput) => {
    setIsSubmitting(true)

    // Validate that from and to churches are different
    if (data.from_church_id === data.to_church_id) {
      toast.error('Cannot transfer to the same church')
      setIsSubmitting(false)
      return
    }

    const result = await createTransferRequest(data)
    setIsSubmitting(false)

    if ('error' in result) {
      toast.error(result.error)
    } else {
      toast.success('Transfer request created successfully')
      router.push('/transfers')
      router.refresh()
    }
  }

  // Filter members based on user role
  const availableMembers = userRole === 'superadmin'
    ? members
    : members.filter((m) => m.church_id === userChurchId)

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Member Selection */}
        <FormField
          control={form.control}
          name="member_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Member</FormLabel>
              <FormControl>
                <MemberSelect
                  members={availableMembers}
                  value={field.value}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormDescription>
                Select the member to transfer
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Current Church (Auto-filled) */}
        {selectedMember && (
          <div className="bg-accent/10 border border-accent/30 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Current Church</p>
                <p className="text-lg font-semibold text-accent">
                  {selectedMember.churches?.name || 'Unknown Church'}
                </p>
              </div>
              <ArrowRight className="h-6 w-6 text-accent" />
            </div>
          </div>
        )}

        {/* Destination Church */}
        <FormField
          control={form.control}
          name="to_church_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Destination Church</FormLabel>
              <FormControl>
                <ChurchSelect
                  churches={churches}
                  value={field.value}
                  onChange={field.onChange}
                  excludeChurchId={form.watch('from_church_id')}
                />
              </FormControl>
              <FormDescription>
                Select the church to transfer the member to
              </FormDescription>
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
              <FormLabel>Notes (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Add any additional notes or reasons for this transfer..."
                  {...field}
                  value={field.value || ''}
                  rows={4}
                />
              </FormControl>
              <FormDescription>
                Provide context or reason for this transfer request
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || !selectedMember}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? 'Creating...' : 'Create Transfer Request'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
