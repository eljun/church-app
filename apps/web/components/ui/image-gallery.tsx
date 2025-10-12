'use client'

import { useState } from 'react'
import Image from 'next/image'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { Dialog, DialogContent, DialogClose } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ImageGalleryProps {
  images: string[]
  alt?: string
  className?: string
}

export function ImageGallery({ images, alt = 'Gallery image', className }: ImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

  if (!images || images.length === 0) {
    return (
      <div className={cn('rounded-lg bg-gray-100 flex items-center justify-center', className)}>
        <p className="text-sm text-gray-400">No images</p>
      </div>
    )
  }

  const openLightbox = (index: number) => {
    setSelectedIndex(index)
  }

  const closeLightbox = () => {
    setSelectedIndex(null)
  }

  const goToPrevious = () => {
    setSelectedIndex((prev) => (prev === null ? null : prev > 0 ? prev - 1 : images.length - 1))
  }

  const goToNext = () => {
    setSelectedIndex((prev) => (prev === null ? null : prev < images.length - 1 ? prev + 1 : 0))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') goToPrevious()
    if (e.key === 'ArrowRight') goToNext()
    if (e.key === 'Escape') closeLightbox()
  }

  return (
    <>
      {/* Gallery Grid */}
      <div className={cn('grid gap-2', className)}>
        {images.length === 1 ? (
          // Single image - full width
          <div
            className="relative aspect-video rounded-lg overflow-hidden cursor-pointer group"
            onClick={() => openLightbox(0)}
          >
            <Image
              src={images[0]}
              alt={`${alt} 1`}
              fill
              className="object-cover transition-transform group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-full p-2">
                <svg
                  className="w-6 h-6 text-gray-900"
                  fill="none"
                  strokeWidth="2"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                </svg>
              </div>
            </div>
          </div>
        ) : images.length === 2 ? (
          // Two images - side by side
          <div className="grid grid-cols-2 gap-2">
            {images.map((image, index) => (
              <div
                key={index}
                className="relative aspect-square rounded-lg overflow-hidden cursor-pointer group"
                onClick={() => openLightbox(index)}
              >
                <Image
                  src={image}
                  alt={`${alt} ${index + 1}`}
                  fill
                  className="object-cover transition-transform group-hover:scale-105"
                  sizes="(max-width: 768px) 50vw, 40vw"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-full p-2">
                    <svg
                      className="w-6 h-6 text-gray-900"
                      fill="none"
                      strokeWidth="2"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                    </svg>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Three or more images - mosaic layout
          <div className="grid grid-cols-4 gap-2">
            {/* First image takes 2 columns */}
            <div
              className="col-span-2 row-span-2 relative rounded-lg overflow-hidden cursor-pointer group"
              onClick={() => openLightbox(0)}
            >
              <Image
                src={images[0]}
                alt={`${alt} 1`}
                fill
                className="object-cover transition-transform group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              <div className="absolute top-2 left-2 z-10">
                <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-md font-medium">
                  Primary
                </span>
              </div>
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-full p-2">
                  <svg
                    className="w-6 h-6 text-gray-900"
                    fill="none"
                    strokeWidth="2"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Remaining images in grid */}
            {images.slice(1, 5).map((image, index) => (
              <div
                key={index + 1}
                className="col-span-2 relative aspect-square rounded-lg overflow-hidden cursor-pointer group"
                onClick={() => openLightbox(index + 1)}
              >
                <Image
                  src={image}
                  alt={`${alt} ${index + 2}`}
                  fill
                  className="object-cover transition-transform group-hover:scale-105"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
                {index === 3 && images.length > 5 && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <span className="text-white text-2xl font-bold">+{images.length - 5}</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-full p-2">
                    <svg
                      className="w-6 h-6 text-gray-900"
                      fill="none"
                      strokeWidth="2"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                    </svg>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      <Dialog open={selectedIndex !== null} onOpenChange={(open) => !open && closeLightbox()}>
        <DialogContent
          className="max-w-7xl w-full h-[90vh] p-0 bg-black/95 border-none"
          onKeyDown={handleKeyDown}
        >
          {selectedIndex !== null && (
            <div className="relative w-full h-full flex items-center justify-center">
              {/* Close Button */}
              <DialogClose asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-4 right-4 z-50 text-white hover:bg-white/20 rounded-full"
                >
                  <X className="h-6 w-6" />
                </Button>
              </DialogClose>

              {/* Image Counter */}
              <div className="absolute top-4 left-4 z-50 bg-black/60 text-white px-3 py-1 rounded-full text-sm">
                {selectedIndex + 1} / {images.length}
              </div>

              {/* Previous Button */}
              {images.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-50 text-white hover:bg-white/20 rounded-full h-12 w-12"
                  onClick={goToPrevious}
                >
                  <ChevronLeft className="h-8 w-8" />
                </Button>
              )}

              {/* Image */}
              <div className="w-full h-full flex items-center justify-center p-16">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={images[selectedIndex]}
                  alt={`${alt} ${selectedIndex + 1}`}
                  className="max-w-full max-h-full object-contain rounded-lg"
                />
              </div>

              {/* Next Button */}
              {images.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-50 text-white hover:bg-white/20 rounded-full h-12 w-12"
                  onClick={goToNext}
                >
                  <ChevronRight className="h-8 w-8" />
                </Button>
              )}

              {/* Thumbnail Strip */}
              {images.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 flex gap-2 bg-black/60 p-2 rounded-lg max-w-[90%] overflow-x-auto">
                  {images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedIndex(index)}
                      className={cn(
                        'flex-shrink-0 w-16 h-16 rounded overflow-hidden transition-all',
                        selectedIndex === index
                          ? 'ring-2 ring-white scale-110'
                          : 'opacity-60 hover:opacity-100'
                      )}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={image} alt={`Thumbnail ${index + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
