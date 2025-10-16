'use client'

import { useState, useCallback } from 'react'
import Image from 'next/image'
import { useDropzone } from 'react-dropzone'
import { X, Upload, Image as ImageIcon, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

interface ImageUploadProps {
  value: string[]
  onChange: (urls: string[]) => void
  maxFiles?: number
  bucketName?: string
  path?: string
}

export function ImageUpload({
  value = [],
  onChange,
  maxFiles = 5,
  bucketName = 'church-images',
  path = 'churches',
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})
  const [isModalOpen, setIsModalOpen] = useState(false)
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
      if (value.length + acceptedFiles.length > maxFiles) {
        toast.error(`You can only upload up to ${maxFiles} images`)
        return
      }

      setUploading(true)
      const uploadedUrls: string[] = []

      for (let i = 0; i < acceptedFiles.length; i++) {
        const file = acceptedFiles[i]
        setUploadProgress((prev) => ({ ...prev, [file.name]: 0 }))

        const url = await uploadFile(file)

        setUploadProgress((prev) => ({ ...prev, [file.name]: 100 }))

        if (url) {
          uploadedUrls.push(url)
        } else {
          toast.error(`Failed to upload ${file.name}`)
        }
      }

      onChange([...value, ...uploadedUrls])
      setUploading(false)
      setUploadProgress({})

      if (uploadedUrls.length > 0) {
        toast.success(`Successfully uploaded ${uploadedUrls.length} image(s)`)
        setIsModalOpen(false) // Close modal on success
      }
    },
    [value, maxFiles, onChange, uploadFile]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp', '.gif'],
    },
    maxFiles: maxFiles - value.length,
    disabled: uploading || value.length >= maxFiles,
  })

  const removeImage = (index: number) => {
    const newUrls = value.filter((_, i) => i !== index)
    onChange(newUrls)
    toast.success('Image removed')
  }

  const moveImage = (fromIndex: number, toIndex: number) => {
    const newUrls = [...value]
    const [removed] = newUrls.splice(fromIndex, 1)
    newUrls.splice(toIndex, 0, removed)
    onChange(newUrls)
  }

  return (
    <div className="space-y-4">
      {/* Upload Button - Opens Modal */}
      {value.length < maxFiles && (
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button type="button" variant="outline" size="sm">
              <Upload className="mr-2 h-4 w-4" />
              Upload Images ({value.length}/{maxFiles})
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Upload Church Images</DialogTitle>
              <DialogDescription>
                Upload images for this church. The first image will be the primary photo.
              </DialogDescription>
            </DialogHeader>

            {/* Modal Dropzone */}
            <div className="space-y-4">
              <div
                {...getRootProps()}
                className={cn(
                  'border-2 border-dashed p-8 text-center cursor-pointer transition-colors',
                  isDragActive
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-300 hover:border-gray-400',
                  uploading && 'opacity-50 cursor-not-allowed'
                )}
              >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center gap-3">
                  {uploading ? (
                    <>
                      <Loader2 className="h-12 w-12 text-primary animate-spin" />
                      <p className="text-sm text-gray-600">Uploading images...</p>
                    </>
                  ) : (
                    <>
                      <div className="bg-primary/10 p-3">
                        <Upload className="h-8 w-8 text-primary" />
                      </div>
                      <div className="text-sm text-gray-600">
                        <p className="font-medium">
                          {isDragActive
                            ? 'Drop images here...'
                            : 'Click to upload or drag and drop'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          PNG, JPG, WEBP up to 10MB ({maxFiles - value.length} remaining)
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Upload Progress */}
              {Object.keys(uploadProgress).length > 0 && (
                <div className="space-y-2">
                  {Object.entries(uploadProgress).map(([fileName, progress]) => (
                    <div key={fileName} className="flex items-center gap-2">
                      <div className="flex-1">
                        <p className="text-xs text-gray-600 mb-1">{fileName}</p>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all duration-300"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Image Preview Grid */}
      {value.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">
            Uploaded Images ({value.length}/{maxFiles})
            {value.length > 0 && (
              <span className="text-xs text-gray-500 ml-2">
                First image is the primary photo
              </span>
            )}
          </p>
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
            {value.map((url, index) => (
              <div
                key={url}
                className="relative group rounded-lg overflow-hidden border-2 border-gray-200 aspect-square"
              >
                {/* Primary Badge */}
                {index === 0 && (
                  <div className="absolute top-2 left-2 z-10">
                    <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-md font-medium">
                      Primary
                    </span>
                  </div>
                )}

                {/* Image */}
                <Image
                  src={url}
                  alt={`Upload ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                />

                {/* Overlay with actions */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  {/* Move to First */}
                  {index > 0 && (
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => moveImage(index, 0)}
                      className="text-xs"
                    >
                      Set Primary
                    </Button>
                  )}

                  {/* Remove */}
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={() => removeImage(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Index number */}
                <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1">
                  {index + 1}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {value.length === 0 && !uploading && (
        <div className="text-center py-8 border-2 border-dashed border-gray-200">
          <ImageIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">No images uploaded yet</p>
        </div>
      )}
    </div>
  )
}
