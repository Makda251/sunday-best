'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useParams } from 'next/navigation'
import Image from 'next/image'
import type { ProductCondition } from '@/lib/types/database'

// Predefined tag options
const COLOR_TAGS = ['White', 'Ivory', 'Red', 'Gold', 'Silver', 'Yellow', 'Pink', 'Green', 'Blue', 'Purple', 'Black', 'Multicolor']
const STYLE_TAGS = ['Traditional', 'Modern', 'Embroidered', 'Beaded', 'Sequined', 'Handwoven']
const OCCASION_TAGS = ['Wedding', 'Engagement', 'Baptism', 'Holiday', 'Casual', 'Festival']

export default function EditProductPage() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [condition, setCondition] = useState<ProductCondition>('new')
  const [sizeType, setSizeType] = useState<'standard' | 'custom'>('standard')
  const [size, setSize] = useState('')
  const [customMeasurements, setCustomMeasurements] = useState('')
  const [designer, setDesigner] = useState('')
  const [designerSuggestions, setDesignerSuggestions] = useState<string[]>([])
  const [showDesignerDropdown, setShowDesignerDropdown] = useState(false)
  const [isActive, setIsActive] = useState(true)
  const [existingImages, setExistingImages] = useState<string[]>([])
  const [newImages, setNewImages] = useState<File[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [originalReviewStatus, setOriginalReviewStatus] = useState<string>('pending')
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const router = useRouter()
  const params = useParams()
  const supabase = createClient()
  const platformFee = parseFloat(process.env.NEXT_PUBLIC_PLATFORM_FEE_PERCENTAGE || '10')

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  // Fetch designer suggestions from existing products
  const fetchDesignerSuggestions = async (query: string) => {
    if (query.length < 2) {
      setDesignerSuggestions([])
      return
    }

    const { data } = await supabase
      .from('products')
      .select('designer')
      .not('designer', 'is', null)
      .ilike('designer', `%${query}%`)
      .limit(10)

    if (data) {
      // Get unique designer names
      const uniqueDesigners = [...new Set(data.map(p => p.designer).filter(Boolean))] as string[]
      setDesignerSuggestions(uniqueDesigners)
    }
  }

  const handleDesignerChange = (value: string) => {
    setDesigner(value)
    setShowDesignerDropdown(true)
    fetchDesignerSuggestions(value)
  }

  const selectDesigner = (name: string) => {
    setDesigner(name)
    setShowDesignerDropdown(false)
    setDesignerSuggestions([])
  }

  useEffect(() => {
    const fetchProduct = async () => {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth/login')
        return
      }

      const { data: product, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', params.id)
        .eq('seller_id', user.id)
        .single()

      if (error || !product) {
        router.push('/dashboard/seller')
        return
      }

      setTitle(product.title)
      setDescription(product.description || '')
      setPrice(product.price.toString())
      setCondition(product.condition)
      setDesigner(product.designer || '')

      // Check if size contains custom measurements (not a standard US size)
      const standardSizes = ['0', '2', '4', '6', '8', '10', '12', '14', '16', '18', '20', '']
      const productSize = product.size || ''
      if (standardSizes.includes(productSize)) {
        setSizeType('standard')
        setSize(productSize)
      } else {
        setSizeType('custom')
        setCustomMeasurements(productSize)
      }

      setIsActive(product.is_active)
      setExistingImages(product.images || [])
      setSelectedTags(product.tags || [])
      setOriginalReviewStatus(product.review_status || 'pending')
      setLoading(false)
    }

    fetchProduct()
  }, [params.id, router, supabase])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setNewImages(Array.from(e.target.files))
    }
  }

  const removeExistingImage = (index: number) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setUpdating(true)
    setError(null)

    try {
      // Check if at least one color tag is selected
      const COLOR_TAGS = ['White', 'Ivory', 'Red', 'Gold', 'Silver', 'Yellow', 'Pink', 'Green', 'Blue', 'Purple', 'Black', 'Multicolor']
      const hasColorTag = selectedTags.some(tag => COLOR_TAGS.includes(tag))
      if (!hasColorTag) {
        setError('Please select at least one color for your dress.')
        setUpdating(false)
        return
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Upload new images if any
      const newImageUrls: string[] = []
      for (const image of newImages) {
        const fileExt = image.name.split('.').pop()
        const fileName = `${user.id}/${Math.random().toString(36).substring(2)}.${fileExt}`

        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(fileName, image)

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(fileName)

        newImageUrls.push(publicUrl)
      }

      // Combine existing and new images
      const allImages = [...existingImages, ...newImageUrls]

      // Use custom measurements if custom size is selected
      const finalSize = sizeType === 'custom' ? customMeasurements : size

      // Determine review status logic:
      // - If currently rejected: reset to pending (seller is resubmitting)
      // - If currently approved: keep approved (minor edits don't need re-review)
      // - If currently pending: keep pending
      const newReviewStatus = originalReviewStatus === 'rejected' ? 'pending' : originalReviewStatus
      const newRejectionReason = originalReviewStatus === 'rejected' ? null : undefined

      const updateData: any = {
        title,
        description,
        price: parseFloat(price),
        condition,
        size: finalSize,
        designer: designer || null,
        is_active: isActive,
        images: allImages,
        tags: selectedTags,
        review_status: newReviewStatus,
      }

      // Only update rejection_reason if we're clearing it
      if (newRejectionReason === null) {
        updateData.rejection_reason = null
      }

      const { error: updateError } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', params.id)

      if (updateError) {
        throw updateError
      }

      // Show appropriate success message based on review status
      if (originalReviewStatus === 'rejected') {
        alert('Product updated and resubmitted for review!')
      } else if (originalReviewStatus === 'approved') {
        alert('Product updated successfully! Changes are live.')
      } else {
        alert('Product updated successfully!')
      }

      router.push('/dashboard/seller')
      router.refresh()
    } catch (err: any) {
      setError(err.message)
      setUpdating(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      return
    }

    setUpdating(true)
    setError(null)

    try {
      const { error: deleteError } = await supabase
        .from('products')
        .delete()
        .eq('id', params.id)

      if (deleteError) {
        throw deleteError
      }

      router.push('/dashboard/seller')
      router.refresh()
    } catch (err: any) {
      setError(err.message)
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  const priceNum = parseFloat(price) || 0
  const sellerReceives = priceNum * (1 - platformFee / 100)

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Edit Product</h1>
          <p className="mt-2 text-sm text-gray-600">
            Update your product listing
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6 space-y-6">
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              Title *
            </label>
            <input
              type="text"
              id="title"
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="relative">
            <label htmlFor="designer" className="block text-sm font-medium text-gray-700">
              Designer/Brand (Optional)
            </label>
            <input
              type="text"
              id="designer"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Start typing to search or add new designer..."
              value={designer}
              onChange={(e) => handleDesignerChange(e.target.value)}
              onFocus={() => designer.length >= 2 && setShowDesignerDropdown(true)}
              onBlur={() => setTimeout(() => setShowDesignerDropdown(false), 200)}
            />

            {/* Autocomplete dropdown */}
            {showDesignerDropdown && designerSuggestions.length > 0 && (
              <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                {designerSuggestions.map((suggestion, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => selectDesigner(suggestion)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}

            <p className="mt-1 text-xs text-gray-500">
              {designerSuggestions.length > 0 && showDesignerDropdown
                ? 'Select an existing designer or continue typing to add a new one'
                : 'Type to search existing designers or add a new designer/brand name'}
            </p>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              id="description"
              rows={4}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                Price ($) *
              </label>
              <input
                type="number"
                id="price"
                required
                step="0.01"
                min="0"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
              {priceNum > 0 && (
                <div className="mt-3 p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
                  <p className="text-xs font-medium text-indigo-900 mb-2">Payment Breakdown:</p>
                  <div className="space-y-1 text-xs text-indigo-800">
                    <div className="flex justify-between">
                      <span>Product Price:</span>
                      <span className="font-medium">${priceNum.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Buyer Pays Shipping:</span>
                      <span className="font-medium text-green-600">+$10.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Platform Fee ({platformFee}%):</span>
                      <span className="font-medium text-red-600">-${(priceNum * platformFee / 100).toFixed(2)}</span>
                    </div>
                    <div className="pt-2 mt-2 border-t border-indigo-300 flex justify-between">
                      <span className="font-semibold">You Receive:</span>
                      <span className="font-bold text-green-700">${(priceNum + 10 - (priceNum * platformFee / 100)).toFixed(2)}</span>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-indigo-700">
                    <strong>Note:</strong> Shipping amount ($10) is included in your payment. You're responsible for shipping the item to the buyer.
                  </p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Size
              </label>

              {/* Size Type Toggle */}
              <div className="flex gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => setSizeType('standard')}
                  className={`flex-1 py-2 px-4 rounded-lg border-2 text-sm font-medium transition-all ${
                    sizeType === 'standard'
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                  }`}
                >
                  Standard Size
                </button>
                <button
                  type="button"
                  onClick={() => setSizeType('custom')}
                  className={`flex-1 py-2 px-4 rounded-lg border-2 text-sm font-medium transition-all ${
                    sizeType === 'custom'
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                  }`}
                >
                  Custom Measurements
                </button>
              </div>

              {/* Standard Size Dropdown */}
              {sizeType === 'standard' && (
                <select
                  id="size"
                  className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                >
                  <option value="">Select US size</option>
                  <option value="0">0</option>
                  <option value="2">2</option>
                  <option value="4">4</option>
                  <option value="6">6</option>
                  <option value="8">8</option>
                  <option value="10">10</option>
                  <option value="12">12</option>
                  <option value="14">14</option>
                  <option value="16">16</option>
                  <option value="18">18</option>
                  <option value="20">20</option>
                </select>
              )}

              {/* Custom Measurements Input */}
              {sizeType === 'custom' && (
                <div>
                  <textarea
                    id="customMeasurements"
                    rows={3}
                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="e.g., Bust: 36in, Waist: 28in, Hips: 38in, Length: 58in"
                    value={customMeasurements}
                    onChange={(e) => setCustomMeasurements(e.target.value)}
                  />
                  <p className="mt-1.5 text-xs text-gray-500">
                    Provide detailed measurements (bust, waist, hips, length, etc.)
                  </p>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
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
                <span className="ml-2 text-sm text-gray-700">New</span>
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
                <span className="ml-2 text-sm text-gray-700">Used</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Images
            </label>
            {existingImages.length > 0 ? (
              <div className="grid grid-cols-4 gap-4 mb-4">
                {existingImages.map((image, index) => (
                  <div key={index} className="relative group">
                    <Image
                      src={image}
                      alt={`Product ${index + 1}`}
                      width={150}
                      height={150}
                      className="w-full h-32 object-cover rounded border"
                    />
                    <button
                      type="button"
                      onClick={() => removeExistingImage(index)}
                      className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 mb-4">No images</p>
            )}
            <div>
              <label htmlFor="new-images" className="block text-sm font-medium text-gray-700">
                Add New Images (Max 5 total)
              </label>
              <input
                type="file"
                id="new-images"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
              />
              {newImages.length > 0 && (
                <p className="mt-2 text-sm text-gray-500">
                  {newImages.length} new image(s) selected
                </p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Total images after save: {existingImages.length + newImages.length}
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags
            </label>
            <div className="space-y-3">
              <div>
                <p className="text-xs font-medium text-gray-700 mb-1">
                  COLOR <span className="text-red-600">*</span>
                </p>
                <div className="grid grid-cols-3 gap-x-4 gap-y-1">
                  {COLOR_TAGS.map(tag => (
                    <label key={tag} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedTags.includes(tag)}
                        onChange={() => toggleTag(tag)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">{tag}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">STYLE</p>
                <div className="grid grid-cols-3 gap-x-4 gap-y-1">
                  {STYLE_TAGS.map(tag => (
                    <label key={tag} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedTags.includes(tag)}
                        onChange={() => toggleTag(tag)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">{tag}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">OCCASION</p>
                <div className="grid grid-cols-3 gap-x-4 gap-y-1">
                  {OCCASION_TAGS.map(tag => (
                    <label key={tag} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedTags.includes(tag)}
                        onChange={() => toggleTag(tag)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">{tag}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">
                Active (visible to buyers)
              </span>
            </label>
          </div>

          <div className="flex justify-between items-center pt-4 border-t">
            <button
              type="button"
              onClick={handleDelete}
              disabled={updating}
              className="px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
            >
              Delete Product
            </button>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updating}
                className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {updating ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
