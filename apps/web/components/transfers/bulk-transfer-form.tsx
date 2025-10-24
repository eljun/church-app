'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2, Users, ArrowRight, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { ChurchSelect } from '@/components/shared'
import { createTransferRequest } from '@/lib/actions/transfers'
import { FileUpload } from '@/components/ui/file-upload'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface Church {
  id: string
  name: string
  field?: string
  district?: string
  city?: string | null
  province?: string | null
}

interface Member {
  id: string
  full_name: string
  church_id: string
}

interface BulkTransferFormProps {
  churches: Church[]
  members: Member[]
  userRole: string
  userChurchId: string | null
  preselectedChurchId?: string
}

export function BulkTransferForm({
  churches,
  members,
  userRole,
  userChurchId,
  preselectedChurchId,
}: BulkTransferFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [fromChurchId, setFromChurchId] = useState(preselectedChurchId || '')
  const [toChurchId, setToChurchId] = useState('')
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])
  const [notes, setNotes] = useState('')
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 0 })

  // Update URL when from church changes
  useEffect(() => {
    if (fromChurchId) {
      const params = new URLSearchParams(searchParams.toString())
      params.set('from_church_id', fromChurchId)
      router.push(`/transfers/bulk?${params.toString()}`)
    }
  }, [fromChurchId, router, searchParams])

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedMembers(members.map((m) => m.id))
    } else {
      setSelectedMembers([])
    }
  }

  const handleSelectMember = (memberId: string, checked: boolean) => {
    if (checked) {
      setSelectedMembers([...selectedMembers, memberId])
    } else {
      setSelectedMembers(selectedMembers.filter((id) => id !== memberId))
    }
  }

  const handleSubmit = async () => {
    if (!fromChurchId || !toChurchId) {
      toast.error('Please select both source and destination churches')
      return
    }

    if (fromChurchId === toChurchId) {
      toast.error('Cannot transfer to the same church')
      return
    }

    if (selectedMembers.length === 0) {
      toast.error('Please select at least one member')
      return
    }

    if (!attachmentUrl) {
      toast.error('Please upload the transfer request letter')
      return
    }

    setIsSubmitting(true)
    setProgress({ current: 0, total: selectedMembers.length })

    let successCount = 0
    let errorCount = 0

    for (let i = 0; i < selectedMembers.length; i++) {
      const memberId = selectedMembers[i]
      setProgress({ current: i + 1, total: selectedMembers.length })

      const result = await createTransferRequest({
        member_id: memberId,
        from_church_id: fromChurchId,
        to_church_id: toChurchId,
        notes: notes || null,
        attachment_url: attachmentUrl || '',
      })

      if ('error' in result) {
        errorCount++
      } else {
        successCount++
      }
    }

    setIsSubmitting(false)

    if (errorCount === 0) {
      toast.success(`Successfully created ${successCount} transfer requests`)
      router.push('/transfers')
      router.refresh()
    } else {
      toast.error(
        `Created ${successCount} transfer requests, but ${errorCount} failed`
      )
      router.refresh()
    }
  }

  const filteredMembers = members.filter((m) => m.church_id === fromChurchId)
  const selectedCount = selectedMembers.length
  const fromChurch = churches.find((c) => c.id === fromChurchId)
  const toChurch = churches.find((c) => c.id === toChurchId)

  return (
    <div className="space-y-6">
      {/* Download Transfer Request Letter Template */}
      <Alert className="bg-blue-50 border-blue-200">
        <Download className="h-4 w-4 text-blue-600" />
        <AlertDescription className="flex items-center justify-between">
          <span className="text-sm text-gray-700">
            Please download and complete the Transfer Request Letter form before uploading it below.
          </span>
          <Button
            type="button"
            variant="link"
            className="text-blue-600 hover:text-blue-800 p-0 h-auto font-medium"
            onClick={() => {
              // This will be replaced with the actual PDF link later
              toast.info('PDF link will be provided by you')
            }}
          >
            Download Form Template
          </Button>
        </AlertDescription>
      </Alert>

      {/* Step 1: Select Source Church - Only for Superadmin */}
      {userRole === 'superadmin' && (
        <Card>
          <CardHeader>
            <CardTitle>Step 1: Select Source Church</CardTitle>
            <CardDescription>
              Choose the church to transfer members from
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChurchSelect
              churches={churches}
              value={fromChurchId}
              onValueChange={setFromChurchId}
            />
          </CardContent>
        </Card>
      )}

      {/* Info banner for Church Secretary - showing their source church */}
      {userRole === 'church_secretary' && (
        <div className="p-4 bg-accent/10 border border-accent/30">
          <p className="text-sm font-medium text-gray-700">Transferring from:</p>
          <p className="font-display text-xl font-semibold text-accent mt-1">
            {churches.find(c => c.id === userChurchId)?.name || 'Your Church'}
          </p>
        </div>
      )}

      {/* Step: Select Members */}
      {fromChurchId && (
        <Card>
          <CardHeader>
            <CardTitle>{userRole === 'church_secretary' ? 'Step 1' : 'Step 2'}: Select Members</CardTitle>
            <CardDescription>
              Choose which members to transfer ({filteredMembers.length} available)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {filteredMembers.length > 0 ? (
              <>
                <div className="flex items-center space-x-2 border-b pb-3">
                  <Checkbox
                    id="select-all"
                    checked={selectedCount === filteredMembers.length}
                    onCheckedChange={handleSelectAll}
                  />
                  <Label htmlFor="select-all" className="font-medium cursor-pointer">
                    Select All ({selectedCount} selected)
                  </Label>
                </div>
                <div className="max-h-96 overflow-y-auto space-y-2">
                  {filteredMembers.map((member) => (
                    <div key={member.id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded">
                      <Checkbox
                        id={member.id}
                        checked={selectedMembers.includes(member.id)}
                        onCheckedChange={(checked) =>
                          handleSelectMember(member.id, checked as boolean)
                        }
                      />
                      <Label htmlFor={member.id} className="flex-1 cursor-pointer">
                        {member.full_name}
                      </Label>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-gray-500 text-center py-8">No members found in this church</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step: Select Destination Church */}
      {selectedCount > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{userRole === 'church_secretary' ? 'Step 2' : 'Step 3'}: Select Destination Church</CardTitle>
            <CardDescription>
              Choose where to transfer the {selectedCount} selected member(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChurchSelect
              churches={churches}
              value={toChurchId}
              onValueChange={setToChurchId}
              excludeChurchId={fromChurchId}
            />
          </CardContent>
        </Card>
      )}

      {/* Step: Upload Transfer Request Letter */}
      {toChurchId && (
        <Card>
          <CardHeader>
            <CardTitle>
              {userRole === 'church_secretary' ? 'Step 3' : 'Step 4'}: Upload Transfer Request Letter{' '}
              <span className="text-destructive">*</span>
            </CardTitle>
            <CardDescription>
              Upload the completed and signed transfer request letter for all {selectedCount} member(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FileUpload
              value={attachmentUrl}
              onChange={setAttachmentUrl}
              bucketName="transfer-documents"
              path="transfer-requests"
              label="Upload completed Transfer Request Letter"
              required
            />
          </CardContent>
        </Card>
      )}

      {/* Step: Add Notes */}
      {toChurchId && (
        <Card>
          <CardHeader>
            <CardTitle>{userRole === 'church_secretary' ? 'Step 4' : 'Step 5'}: Add Notes (Optional)</CardTitle>
            <CardDescription>
              Provide context or reason for these transfers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Enter notes for all transfer requests..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              disabled={isSubmitting}
            />
          </CardContent>
        </Card>
      )}

      {/* Review and Submit */}
      {toChurchId && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle>Review and Confirm</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{fromChurch?.name}</span>
              <ArrowRight className="h-5 w-5 text-gray-400" />
              <span className="font-medium">{toChurch?.name}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Users className="h-4 w-4" />
              <span>{selectedCount} member(s) will be transferred</span>
            </div>

            {isSubmitting && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Processing transfers...</span>
                  <span>
                    {progress.current} / {progress.total}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{
                      width: `${(progress.current / progress.total) * 100}%`,
                    }}
                  />
                </div>
              </div>
            )}

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
                onClick={handleSubmit}
                disabled={isSubmitting || selectedCount === 0 || !attachmentUrl}
                className="flex-1"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Transfer Requests...
                  </>
                ) : (
                  <>Create {selectedCount} Transfer Request(s)</>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
