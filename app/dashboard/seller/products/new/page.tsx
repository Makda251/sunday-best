'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { ProductCondition } from '@/lib/types/database'

// Predefined tag options
const COLOR_TAGS = ['White', 'Ivory', 'Red', 'Gold', 'Silver', 'Yellow', 'Pink', 'Green', 'Blue', 'Purple', 'Black', 'Multicolor']
const STYLE_TAGS = ['Traditional', 'Modern', 'Embroidered', 'Beaded', 'Sequined', 'Handwoven']
const OCCASION_TAGS = ['Wedding', 'Engagement', 'Baptism', 'Holiday', 'Casual', 'Festival']

export default function NewProductPage() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [condition, setCondition] = useState<ProductCondition>('new')
  const [size, setSize] = useState('')
  const [images, setImages] = useState<File[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const platformFee = parseFloat(process.env.NEXT_PUBLIC_PLATFORM_FEE_PERCENTAGE || '10')

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImages(Array.from(e.target.files))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setUploading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth/login')
        return
      }

      // Debug: Log user info
      console.log('Current user ID:', user.id)
      console.log('User email:', user.email)

      // Check if profile exists with seller role
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('id', user.id)
        .single()

      console.log('Profile:', profile)
      console.log('Profile error:', profileError)

      if (!profile || profile.role !== 'seller') {
        throw new Error('You must be a seller to create products. Please contact support.')
      }

      // Upload images to Supabase Storage
      const imageUrls: string[] = []
      for (const image of images) {
        const fileExt = image.name.split('.').pop()
        const fileName = `${user.id}/${Math.random().toString(36).substring(2)}.${fileExt}`

        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(fileName, image)

        if (uploadError) {
          throw uploadError
        }

        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(fileName)

        imageUrls.push(publicUrl)
      }

      // Create product with pending review status
      const { error: insertError } = await supabase
        .from('products')
        .insert({
          seller_id: user.id,
          title,
          description,
          price: parseFloat(price),
          condition,
          size,
          images: imageUrls,
          tags: selectedTags,
          is_active: true,
          review_status: 'pending',
        })

      if (insertError) {
        throw insertError
      }

      // Show success message
      alert('Product submitted for review! An admin will review it before it appears on the site.')
      router.push('/dashboard/seller')
      router.refresh()
    } catch (err: any) {
      setError(err.message)
      setUploading(false)
    }
  }

  const priceNum = parseFloat(price) || 0
  const sellerReceives = priceNum * (1 - platformFee / 100)

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-4 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Add New Product</h1>
          <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-gray-600">
            Create a new listing for your Habesha dress
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-4 sm:p-6 space-y-4 sm:space-y-6">
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div>
            <label htmlFor="title" className="block text-xs sm:text-sm font-medium text-gray-700">
              Title *
            </label>
            <input
              type="text"
              id="title"
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm sm:text-base text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Beautiful Traditional Habesha Dress"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-xs sm:text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              id="description"
              rows={4}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm sm:text-base text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Describe your dress..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="price" className="block text-xs sm:text-sm font-medium text-gray-700">
                Price ($) *
              </label>
              <input
                type="number"
                id="price"
                required
                step="0.01"
                min="0"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm sm:text-base text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="150.00"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
              {priceNum > 0 && (
                <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-gray-500">
                  Platform fee ({platformFee}%): ${(priceNum * platformFee / 100).toFixed(2)} •
                  You receive: ${sellerReceives.toFixed(2)}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="size" className="block text-xs sm:text-sm font-medium text-gray-700">
                Size
              </label>
              <select
                id="size"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm sm:text-base text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={size}
                onChange={(e) => setSize(e.target.value)}
              >
                <option value="">Select size</option>
                <option value="XS">XS</option>
                <option value="S">S</option>
                <option value="M">M</option>
                <option value="L">L</option>
                <option value="XL">XL</option>
                <option value="XXL">XXL</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
              Condition *
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="condition"
                  value="new"
                  checked={condition === 'new'}
                  onChange={(e) => setCondition(e.target.value as ProductCondition)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                />
                <span className="ml-2 text-sm sm:text-base text-gray-700">New</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="condition"
                  value="used"
                  checked={condition === 'used'}
                  onChange={(e) => setCondition(e.target.value as ProductCondition)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                />
                <span className="ml-2 text-sm sm:text-base text-gray-700">Used</span>
              </label>
            </div>
          </div>

          <div>
            <label htmlFor="images" className="block text-xs sm:text-sm font-medium text-gray-700">
              Images * (Max 5 images)
            </label>
            <input
              type="file"
              id="images"
              accept="image/*"
              multiple
              required
              onChange={handleImageChange}
              className="mt-1 block w-full text-xs sm:text-sm text-gray-500 file:mr-2 sm:file:mr-4 file:py-2 file:px-3 sm:file:px-4 file:rounded-md file:border-0 file:text-xs sm:file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            />
            <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-gray-500">
              {images.length > 0 ? `${images.length} image(s) selected` : 'No images selected'}
            </p>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
              Tags
            </label>
            <div className="space-y-3">
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">COLOR</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-3 sm:gap-x-4 gap-y-2">
                  {COLOR_TAGS.map(tag => (
                    <label key={tag} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedTags.includes(tag)}
                        onChange={() => toggleTag(tag)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded flex-shrink-0"
                      />
                      <span className="ml-2 text-xs sm:text-sm text-gray-700">{tag}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">STYLE</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-3 sm:gap-x-4 gap-y-2">
                  {STYLE_TAGS.map(tag => (
                    <label key={tag} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedTags.includes(tag)}
                        onChange={() => toggleTag(tag)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded flex-shrink-0"
                      />
                      <span className="ml-2 text-xs sm:text-sm text-gray-700">{tag}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">OCCASION</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-3 sm:gap-x-4 gap-y-2">
                  {OCCASION_TAGS.map(tag => (
                    <label key={tag} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedTags.includes(tag)}
                        onChange={() => toggleTag(tag)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded flex-shrink-0"
                      />
                      <span className="ml-2 text-xs sm:text-sm text-gray-700">{tag}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => router.back()}
              className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading}
              className="w-full sm:w-auto px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition"
            >
              {uploading ? 'Creating...' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
