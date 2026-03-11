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
  const [quantityAvailable, setQuantityAvailable] = useState('1')
  const [condition, setCondition] = useState<ProductCondition>('new')
  const [sizeType, setSizeType] = useState<'standard' | 'custom'>('standard')
  const [size, setSize] = useState('')
  // Custom measurement fields
  const [measurementUnit, setMeasurementUnit] = useState<'in' | 'cm'>('in')
  const [bust, setBust] = useState('')
  const [waist, setWaist] = useState('')
  const [hips, setHips] = useState('')
  const [shoulderToWaist, setShoulderToWaist] = useState('')
  const [waistToHem, setWaistToHem] = useState('')
  const [shoulder, setShoulder] = useState('')
  const [materialType, setMaterialType] = useState<'elastic' | 'zipper'>('elastic')
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
      setQuantityAvailable((product.quantity_available || 1).toString())
      setCondition(product.condition)
      setMaterialType(product.material_type || 'elastic')
      setDesigner(product.designer || '')

      // Check if size contains custom measurements (not a standard US size)
      const standardSizes = ['0', '2', '4', '6', '8', '10', '12', '14', '16', '18', '20', '']
      const productSize = product.size || ''
      if (standardSizes.includes(productSize)) {
        setSizeType('standard')
        setSize(productSize)
      } else {
        setSizeType('custom')
        // Parse measurements from the string format (e.g., "Bust: 36in, Waist: 28cm")
        // Detect unit from first measurement
        if (productSize.includes('cm')) {
          setMeasurementUnit('cm')
        }
        const measurements = productSize.split(',').map(m => m.trim())
        measurements.forEach(measurement => {
          const [key, value] = measurement.split(':').map(s => s.trim())
          const numValue = value?.replace(/in|cm/g, '').trim()
          if (key && numValue) {
            const keyLower = key.toLowerCase()
            if (keyLower === 'bust') setBust(numValue)
            if (keyLower === 'waist') setWaist(numValue)
            if (keyLower === 'hips') setHips(numValue)
            if (keyLower === 'shoulder' || keyLower === 'shoulder width') setShoulder(numValue)
            if (keyLower === 'shoulder to waist') setShoulderToWaist(numValue)
            if (keyLower === 'waist to hem' || keyLower === 'waist to floor') setWaistToHem(numValue)
          }
        })
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

      // Check if size is provided
      if (sizeType === 'standard' && !size) {
        setError('Please select a size for your dress.')
        setUpdating(false)
        return
      }
      if (sizeType === 'custom') {
        // Check if at least one measurement is provided
        if (!bust && !waist && !hips && !shoulder && !shoulderToWaist && !waistToHem) {
          setError('Please provide at least one measurement.')
          setUpdating(false)
          return
        }
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
      let finalSize = size
      if (sizeType === 'custom') {
        // Combine custom measurements into a formatted string
        const measurements = []
        if (bust) measurements.push(`Bust: ${bust}${measurementUnit}`)
        if (waist) measurements.push(`Waist: ${waist}${measurementUnit}`)
        if (hips) measurements.push(`Hips: ${hips}${measurementUnit}`)
        if (shoulder) measurements.push(`Shoulder Width: ${shoulder}${measurementUnit}`)
        if (shoulderToWaist) measurements.push(`Shoulder to Waist: ${shoulderToWaist}${measurementUnit}`)
        if (waistToHem) measurements.push(`Waist to Floor: ${waistToHem}${measurementUnit}`)
        finalSize = measurements.join(', ')
      }

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
        quantity_available: parseInt(quantityAvailable) || 1,
        condition,
        size: finalSize,
        material_type: materialType,
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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="opacity-70">Loading...</p>
      </div>
    )
  }

  const priceNum = parseFloat(price) || 0
  const sellerReceives = priceNum * (1 - platformFee / 100)

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold font-semibold">Edit Product</h1>
          <p className="mt-2 text-sm ">
            Update your product listing
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 space-y-6">
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div>
            <label htmlFor="title" className="block text-sm font-medium text-sm">
              Title <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              id="title"
              required
              className="mt-1 block w-full border border-[#EBEBEB] rounded-lg py-2 px-3 focus:outline-none focus:outline-none sm:text-sm"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="relative">
            <label htmlFor="designer" className="block text-sm font-medium text-sm">
              Designer/Brand (Optional)
            </label>
            <input
              type="text"
              id="designer"
              className="mt-1 block w-full border border-[#EBEBEB] rounded-lg py-2 px-3 focus:outline-none focus:outline-none sm:text-sm"
              placeholder="Start typing to search or add new designer..."
              value={designer}
              onChange={(e) => handleDesignerChange(e.target.value)}
              onFocus={() => designer.length >= 2 && setShowDesignerDropdown(true)}
              onBlur={() => setTimeout(() => setShowDesignerDropdown(false), 200)}
            />

            {/* Autocomplete dropdown */}
            {showDesignerDropdown && designerSuggestions.length > 0 && (
              <div className="absolute z-10 mt-1 w-full bg-white border border-[#EBEBEB] rounded-xl max-h-60 overflow-auto">
                {designerSuggestions.map((suggestion, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => selectDesigner(suggestion)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-orange-50 hover:text-orange-700 transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}

            <p className="mt-1 text-xs opacity-70">
              {designerSuggestions.length > 0 && showDesignerDropdown
                ? 'Select an existing designer or continue typing to add a new one'
                : 'Type to search existing designers or add a new designer/brand name'}
            </p>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-sm">
              Description
            </label>
            <textarea
              id="description"
              rows={4}
              className="mt-1 block w-full border border-[#EBEBEB] rounded-lg py-2 px-3 focus:outline-none focus:outline-none sm:text-sm"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-sm">
                Price ($) <span className="text-red-600">*</span>
              </label>
              <input
                type="number"
                id="price"
                required
                step="0.01"
                min="0"
                className="mt-1 block w-full border border-[#EBEBEB] rounded-lg py-2 px-3 focus:outline-none focus:outline-none sm:text-sm"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
              {priceNum > 0 && (
                <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <p className="text-xs font-medium text-orange-900 mb-2">Payment Breakdown:</p>
                  <div className="space-y-1 text-xs text-orange-800">
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
                    <div className="pt-2 mt-2 border-t border-[#C4622D] flex justify-between">
                      <span className="font-semibold">You Receive:</span>
                      <span className="font-bold text-green-700">${(priceNum + 10 - (priceNum * platformFee / 100)).toFixed(2)}</span>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-orange-700">
                    <strong>Note:</strong> Shipping amount ($10) is included in your payment. You're responsible for shipping the item to the buyer.
                  </p>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="quantity" className="block text-sm font-medium text-sm">
                Quantity Available <span className="text-red-600">*</span>
              </label>
              <input
                type="number"
                id="quantity"
                required
                min="0"
                max="999"
                className="mt-1 block w-full border border-[#EBEBEB] rounded-lg py-2 px-3 focus:outline-none focus:outline-none sm:text-sm"
                value={quantityAvailable}
                onChange={(e) => setQuantityAvailable(e.target.value)}
              />
              <p className="mt-1 text-xs opacity-70">
                How many items do you have in stock? (Set to 0 to mark as sold out)
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-sm mb-2">
                Size <span className="text-red-600">*</span>
              </label>

              {/* Size Type Toggle */}
              <div className="flex gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => setSizeType('standard')}
                  className={`flex-1 py-2 px-4 rounded-lg border-2 text-sm font-medium transition-all ${
                    sizeType === 'standard'
                      ? 'border-[#C4622D] bg-[#FDF0EA] text-[#C4622D]'
                      : 'border-[#EBEBEB] bg-white text-sm hover:border-gray-400'
                  }`}
                >
                  Standard Size
                </button>
                <button
                  type="button"
                  onClick={() => setSizeType('custom')}
                  className={`flex-1 py-2 px-4 rounded-lg border-2 text-sm font-medium transition-all ${
                    sizeType === 'custom'
                      ? 'border-[#C4622D] bg-[#FDF0EA] text-[#C4622D]'
                      : 'border-[#EBEBEB] bg-white text-sm hover:border-gray-400'
                  }`}
                >
                  Custom Measurements
                </button>
              </div>

              {/* Standard Size Dropdown */}
              {sizeType === 'standard' && (
                <select
                  id="size"
                  className="block w-full border border-[#EBEBEB] rounded-lg py-2 px-3 text-sm focus:outline-none focus:outline-none"
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
                <div className="space-y-3">
                  {/* Unit Selector */}
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-medium text-sm">Unit:</span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setMeasurementUnit('in')}
                        className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                          measurementUnit === 'in'
                            ? 'bg-[#C4622D] text-white'
                            : 'bg-gray-200 text-sm hover:bg-gray-300'
                        }`}
                      >
                        Inches
                      </button>
                      <button
                        type="button"
                        onClick={() => setMeasurementUnit('cm')}
                        className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                          measurementUnit === 'cm'
                            ? 'bg-[#C4622D] text-white'
                            : 'bg-gray-200 text-sm hover:bg-gray-300'
                        }`}
                      >
                        Centimeters
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="bust" className="block text-xs font-medium text-sm mb-1">
                        Bust
                      </label>
                      <input
                        type="number"
                        id="bust"
                        step="0.5"
                        min="0"
                        className="block w-full border border-[#EBEBEB] rounded-lg py-2 px-3 text-sm focus:outline-none focus:outline-none"
                        placeholder={measurementUnit === 'in' ? '36' : '91'}
                        value={bust}
                        onChange={(e) => setBust(e.target.value)}
                      />
                    </div>
                    <div>
                      <label htmlFor="waist" className="block text-xs font-medium text-sm mb-1">
                        Waist
                      </label>
                      <input
                        type="number"
                        id="waist"
                        step="0.5"
                        min="0"
                        className="block w-full border border-[#EBEBEB] rounded-lg py-2 px-3 text-sm focus:outline-none focus:outline-none"
                        placeholder={measurementUnit === 'in' ? '28' : '71'}
                        value={waist}
                        onChange={(e) => setWaist(e.target.value)}
                      />
                    </div>
                    <div>
                      <label htmlFor="hips" className="block text-xs font-medium text-sm mb-1">
                        Hips
                      </label>
                      <input
                        type="number"
                        id="hips"
                        step="0.5"
                        min="0"
                        className="block w-full border border-[#EBEBEB] rounded-lg py-2 px-3 text-sm focus:outline-none focus:outline-none"
                        placeholder={measurementUnit === 'in' ? '38' : '97'}
                        value={hips}
                        onChange={(e) => setHips(e.target.value)}
                      />
                    </div>
                    <div>
                      <label htmlFor="shoulder" className="block text-xs font-medium text-sm mb-1">
                        Shoulder Width
                      </label>
                      <input
                        type="number"
                        id="shoulder"
                        step="0.5"
                        min="0"
                        className="block w-full border border-[#EBEBEB] rounded-lg py-2 px-3 text-sm focus:outline-none focus:outline-none"
                        placeholder={measurementUnit === 'in' ? '15' : '38'}
                        value={shoulder}
                        onChange={(e) => setShoulder(e.target.value)}
                      />
                    </div>
                    <div>
                      <label htmlFor="shoulderToWaist" className="block text-xs font-medium text-sm mb-1">
                        Shoulder to Waist
                      </label>
                      <input
                        type="number"
                        id="shoulderToWaist"
                        step="0.5"
                        min="0"
                        className="block w-full border border-[#EBEBEB] rounded-lg py-2 px-3 text-sm focus:outline-none focus:outline-none"
                        placeholder={measurementUnit === 'in' ? '16' : '41'}
                        value={shoulderToWaist}
                        onChange={(e) => setShoulderToWaist(e.target.value)}
                      />
                    </div>
                    <div>
                      <label htmlFor="waistToHem" className="block text-xs font-medium text-sm mb-1">
                        Waist to Floor
                      </label>
                      <input
                        type="number"
                        id="waistToHem"
                        step="0.5"
                        min="0"
                        className="block w-full border border-[#EBEBEB] rounded-lg py-2 px-3 text-sm focus:outline-none focus:outline-none"
                        placeholder={measurementUnit === 'in' ? '42' : '107'}
                        value={waistToHem}
                        onChange={(e) => setWaistToHem(e.target.value)}
                      />
                    </div>
                  </div>
                  <p className="text-xs opacity-70">
                    Provide as many measurements as possible for best fit
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="condition" className="block text-sm font-medium text-sm mb-2">
                Condition <span className="text-red-600">*</span>
              </label>
              <select
                id="condition"
                value={condition}
                onChange={(e) => setCondition(e.target.value as ProductCondition)}
                className="block w-full border border-[#EBEBEB] rounded-lg py-2 px-3 text-sm font-semibold focus:outline-none focus:outline-none"
              >
                <option value="new">New - Brand new, never worn</option>
                <option value="like_new">Like New - Worn once or twice, appears new</option>
                <option value="excellent">Excellent - Gently used, no visible flaws</option>
                <option value="good">Good - Some signs of wear, but still in good shape</option>
                <option value="fair">Fair - Noticeable wear, may have minor flaws</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-sm mb-2">
                Waist Material Type <span className="text-red-600">*</span>
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="materialType"
                    value="elastic"
                    checked={materialType === 'elastic'}
                    onChange={(e) => setMaterialType(e.target.value as 'elastic' | 'zipper')}
                    className="h-4 w-4 text-orange-600  border-[#EBEBEB]"
                  />
                  <span className="ml-2 text-sm text-sm">Elastic Band</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="materialType"
                    value="zipper"
                    checked={materialType === 'zipper'}
                    onChange={(e) => setMaterialType(e.target.value as 'elastic' | 'zipper')}
                    className="h-4 w-4 text-orange-600  border-[#EBEBEB]"
                  />
                  <span className="ml-2 text-sm text-sm">Zipper</span>
                </label>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-sm mb-2">
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
              <p className="text-sm opacity-70 mb-4">No images</p>
            )}
            <div>
              <label htmlFor="new-images" className="block text-sm font-medium text-sm">
                Add New Images (Max 5 total)
              </label>
              <input
                type="file"
                id="new-images"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                className="mt-1 block w-full text-sm opacity-70 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#FDF0EA] file:text-[#C4622D] hover:file:bg-[#FDE8D9]"
              />
              {newImages.length > 0 && (
                <p className="mt-2 text-sm opacity-70">
                  {newImages.length} new image(s) selected
                </p>
              )}
              <p className="mt-1 text-xs opacity-70">
                Total images after save: {existingImages.length + newImages.length}
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-sm mb-2">
              Tags
            </label>
            <div className="space-y-3">
              <div>
                <p className="text-xs font-medium text-sm mb-1">
                  COLOR <span className="text-red-600">*</span>
                </p>
                <div className="grid grid-cols-3 gap-x-4 gap-y-1">
                  {COLOR_TAGS.map(tag => (
                    <label key={tag} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedTags.includes(tag)}
                        onChange={() => toggleTag(tag)}
                        className="h-4 w-4 text-orange-600  border-[#EBEBEB] rounded"
                      />
                      <span className="ml-2 text-sm text-sm">{tag}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-medium opacity-70 mb-1">STYLE</p>
                <div className="grid grid-cols-3 gap-x-4 gap-y-1">
                  {STYLE_TAGS.map(tag => (
                    <label key={tag} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedTags.includes(tag)}
                        onChange={() => toggleTag(tag)}
                        className="h-4 w-4 text-orange-600  border-[#EBEBEB] rounded"
                      />
                      <span className="ml-2 text-sm text-sm">{tag}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-medium opacity-70 mb-1">OCCASION</p>
                <div className="grid grid-cols-3 gap-x-4 gap-y-1">
                  {OCCASION_TAGS.map(tag => (
                    <label key={tag} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedTags.includes(tag)}
                        onChange={() => toggleTag(tag)}
                        className="h-4 w-4 text-orange-600  border-[#EBEBEB] rounded"
                      />
                      <span className="ml-2 text-sm text-sm">{tag}</span>
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
                className="h-4 w-4 text-orange-600  border-[#EBEBEB] rounded"
              />
              <span className="ml-2 text-sm text-sm">
                Active (visible to buyers)
              </span>
            </label>
          </div>

          <div className="flex justify-between items-center pt-4 border-t">
            <button
              type="button"
              onClick={handleDelete}
              disabled={updating}
              className="px-5 py-2.5 rounded-full text-sm font-semibold disabled:opacity-50 transition-all"
              style={{ border: '1.5px solid #FFCCCC', color: '#CC3333', background: '#FFF0F0' }}
            >
              Delete Product
            </button>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-5 py-2.5 rounded-full text-sm font-semibold transition-all"
                style={{ border: '1.5px solid #D4D4D4', color: '#6B6B6B' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#6B6B6B'; e.currentTarget.style.color = '#111111' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#D4D4D4'; e.currentTarget.style.color = '#6B6B6B' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updating}
                className="px-5 py-2.5 rounded-full text-sm font-semibold text-white disabled:opacity-50 transition-all"
                style={{ backgroundColor: '#C4622D' }}
                onMouseEnter={e => { if (!updating) e.currentTarget.style.backgroundColor = '#A84F22' }}
                onMouseLeave={e => { if (!updating) e.currentTarget.style.backgroundColor = '#C4622D' }}
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
