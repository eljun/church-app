'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { X, Upload, FileText, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface FileUploadProps {
  value: string | null
  onChange: (url: string | null) => void
  bucketName?: string
  path?: string
  acceptedFileTypes?: Record<string, string[]>
  maxSizeMB?: number
  label?: string
  required?: boolean
}

export function FileUpload({
  value = null,
  onChange,
  bucketName = 'transfer-documents',
  path = 'transfer-requests',
  acceptedFileTypes = {
    'application/pdf': ['.pdf'],
    'application/msword': ['.doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    'image/*': ['.png', '.jpg', '.jpeg'],
  },
  maxSizeMB = 10,
  label = 'Upload Document',
  required = false,
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const supabase = createClient()

  const uploadFile = useCallback(async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`
      const filePath = `${path}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) {
        throw uploadError
      }

      // Get public URL
      const { data } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath)

      return data.publicUrl
    } catch (error) {
      console.error('Upload error:', error)
      return null
    }
  }, [supabase, bucketName, path])

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return

      const file = acceptedFiles[0]

      // Check file size
      const fileSizeMB = file.size / (1024 * 1024)
      if (fileSizeMB > maxSizeMB) {
        toast.error(`File size must be less than ${maxSizeMB}MB`)
        return
      }

      setUploading(true)
      setUploadProgress(0)

      // Simulate progress (since we don't have real progress tracking)
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return prev
          }
          return prev + 10
        })
      }, 200)

      const url = await uploadFile(file)

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (url) {
        onChange(url)
        toast.success(`Successfully uploaded ${file.name}`)
      } else {
        toast.error(`Failed to upload ${file.name}`)
      }

      setUploading(false)
      setUploadProgress(0)
    },
    [maxSizeMB, onChange, uploadFile]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedFileTypes,
    maxFiles: 1,
    disabled: uploading,
  })

  const removeFile = () => {
    onChange(null)
    toast.success('File removed')
  }

  const getFileName = (url: string): string => {
    const urlParts = url.split('/')
    return decodeURIComponent(urlParts[urlParts.length - 1])
  }

  return (
    <div className="space-y-4">
      {/* File Display or Upload Zone */}
      {value ? (
        <div className="border border-gray-300 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              <div className="bg-primary/10 p-2 rounded">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {getFileName(value)}
                </p>
                <p className="text-xs text-gray-500">
                  Uploaded successfully
                </p>
              </div>
            </div>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={removeFile}
              className="text-destructive hover:text-destructive"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={cn(
            'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors',
            isDragActive
              ? 'border-primary bg-primary/5'
              : 'border-gray-300 hover:border-gray-400',
            uploading && 'opacity-50 cursor-not-allowed',
            required && 'border-destructive/50'
          )}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-3">
            {uploading ? (
              <>
                <Loader2 className="h-10 w-10 text-primary animate-spin" />
                <div className="w-full max-w-xs">
                  <p className="text-sm text-gray-600 mb-2">Uploading...</p>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="bg-primary/10 p-3 rounded-lg">
                  <Upload className="h-8 w-8 text-primary" />
                </div>
                <div className="text-sm text-gray-600">
                  <p className="font-medium">
                    {isDragActive
                      ? 'Drop file here...'
                      : label || 'Click to upload or drag and drop'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    PDF, DOC, DOCX, or image files up to {maxSizeMB}MB
                  </p>
                  {required && (
                    <p className="text-xs text-destructive mt-1">
                      * This field is required
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
