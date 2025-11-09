'use client'

import { useState } from 'react'
import Image from 'next/image'

interface ProductImageGalleryProps {
  images: string[]
  productTitle: string
}

export default function ProductImageGallery({ images, productTitle }: ProductImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState(0)

  if (!images || images.length === 0) {
    return (
      <div className="aspect-square w-full bg-gray-200 rounded-lg flex items-center justify-center">
        <span className="text-gray-400">No image available</span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div className="aspect-square w-full bg-gray-200 rounded-lg overflow-hidden cursor-pointer">
        <Image
          src={images[selectedImage]}
          alt={`${productTitle} - Image ${selectedImage + 1}`}
          width={800}
          height={800}
          className="w-full h-full object-center object-cover"
          priority={selectedImage === 0}
        />
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="grid grid-cols-5 gap-2">
          {images.map((image, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedImage(idx)}
              className={`aspect-square bg-gray-200 rounded-lg overflow-hidden border-2 transition-all ${
                selectedImage === idx
                  ? 'border-indigo-600 ring-2 ring-indigo-200'
                  : 'border-transparent hover:border-gray-300'
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

      {/* Navigation Arrows (if multiple images) */}
      {images.length > 1 && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => setSelectedImage(prev => prev === 0 ? images.length - 1 : prev - 1)}
            className="flex items-center text-sm text-gray-600 hover:text-gray-900"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Previous
          </button>
          <span className="text-sm text-gray-500">
            {selectedImage + 1} / {images.length}
          </span>
          <button
            onClick={() => setSelectedImage(prev => prev === images.length - 1 ? 0 : prev + 1)}
            className="flex items-center text-sm text-gray-600 hover:text-gray-900"
          >
            Next
            <svg className="w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}
