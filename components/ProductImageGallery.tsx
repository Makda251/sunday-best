'use client'

import { useState } from 'react'
import Image from 'next/image'

interface ProductImageGalleryProps {
  images: string[]
  productTitle: string
}

export default function ProductImageGallery({ images, productTitle }: ProductImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState(0)
  const [isZoomed, setIsZoomed] = useState(false)

  if (!images || images.length === 0) {
    return (
      <div className="aspect-square w-full bg-gray-200 rounded-xl flex items-center justify-center">
        <div className="text-center text-gray-400">
          <svg className="w-16 h-16 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-sm">No image available</span>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-3 sm:space-y-4">
        {/* Main Image - Clickable for zoom */}
        <div
          className="relative aspect-square w-full bg-gray-100 rounded-xl overflow-hidden cursor-zoom-in group"
          onClick={() => setIsZoomed(true)}
        >
          <Image
            src={images[selectedImage]}
            alt={`${productTitle} - Image ${selectedImage + 1}`}
            width={800}
            height={800}
            className="w-full h-full object-center object-cover transition-transform group-hover:scale-105"
            priority={selectedImage === 0}
          />
          {/* Zoom hint */}
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 px-3 py-2 rounded-lg">
              <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Thumbnails */}
        {images.length > 1 && (
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
            {images.map((image, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedImage(idx)}
                className={`aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 transition-all ${
                  selectedImage === idx
                    ? 'border-indigo-600 ring-2 ring-indigo-200 scale-105'
                    : 'border-transparent hover:border-indigo-300'
                }`}
              >
                <Image
                  src={image}
                  alt={`${productTitle} thumbnail ${idx + 1}`}
                  width={150}
                  height={150}
                  className="w-full h-full object-center object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Fullscreen Zoom Modal */}
      {isZoomed && (
        <div
          className="fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center p-4"
          onClick={() => setIsZoomed(false)}
        >
          <button
            onClick={() => setIsZoomed(false)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors z-10"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {images.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedImage(prev => prev === 0 ? images.length - 1 : prev - 1)
                }}
                className="absolute left-4 text-white hover:text-gray-300 p-3 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedImage(prev => prev === images.length - 1 ? 0 : prev + 1)
                }}
                className="absolute right-4 text-white hover:text-gray-300 p-3 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 px-4 py-2 rounded-full text-white text-sm">
                {selectedImage + 1} / {images.length}
              </div>
            </>
          )}

          <div className="relative max-w-5xl max-h-full" onClick={(e) => e.stopPropagation()}>
            <Image
              src={images[selectedImage]}
              alt={`${productTitle} - Full size`}
              width={1200}
              height={1200}
              className="max-w-full max-h-[90vh] object-contain"
            />
          </div>
        </div>
      )}
    </>
  )
}
