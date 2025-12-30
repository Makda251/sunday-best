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
      // Check if at least one color tag is selected
      const hasColorTag = selectedTags.some(tag => COLOR_TAGS.includes(tag))
      if (!hasColorTag) {
        setError('Please select at least one color for your dress.')
        setUploading(false)
        return
      }

      // Check if size is provided
      if (sizeType === 'standard' && !size) {
        setError('Please select a size for your dress.')
        setUploading(false)
        return
      }
      if (sizeType === 'custom') {
        // Check if at least one measurement is provided
        if (!bust && !waist && !hips && !shoulder && !shoulderToWaist && !waistToHem) {
          setError('Please provide at least one measurement.')
          setUploading(false)
          return
        }
      }

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
      const { error: insertError } = await supabase
        .from('products')
        .insert({
          seller_id: user.id,
          title,
          description,
          price: parseFloat(price),
          quantity_available: parseInt(quantityAvailable) || 1,
          condition,
          size: finalSize,
          material_type: materialType,
          designer: designer || null,
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
              Title <span className="text-red-600">*</span>
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

          <div className="relative">
            <label htmlFor="designer" className="block text-xs sm:text-sm font-medium text-gray-700">
              Designer/Brand (Optional)
            </label>
            <input
              type="text"
              id="designer"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm sm:text-base text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
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
                Price ($) <span className="text-red-600">*</span>
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
              <label htmlFor="quantity" className="block text-xs sm:text-sm font-medium text-gray-700">
                Quantity Available <span className="text-red-600">*</span>
              </label>
              <input
                type="number"
                id="quantity"
                required
                min="1"
                max="999"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm sm:text-base text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="1"
                value={quantityAvailable}
                onChange={(e) => setQuantityAvailable(e.target.value)}
              />
              <p className="mt-1 text-xs text-gray-500">
                How many items do you have in stock?
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                Size <span className="text-red-600">*</span>
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
                  className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm sm:text-base text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
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
                    <span className="text-xs font-medium text-gray-700">Unit:</span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setMeasurementUnit('in')}
                        className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                          measurementUnit === 'in'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        Inches
                      </button>
                      <button
                        type="button"
                        onClick={() => setMeasurementUnit('cm')}
                        className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                          measurementUnit === 'cm'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        Centimeters
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="bust" className="block text-xs font-medium text-gray-700 mb-1">
                        Bust
                      </label>
                      <input
                        type="number"
                        id="bust"
                        step="0.5"
                        min="0"
                        className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder={measurementUnit === 'in' ? '36' : '91'}
                        value={bust}
                        onChange={(e) => setBust(e.target.value)}
                      />
                    </div>
                    <div>
                      <label htmlFor="waist" className="block text-xs font-medium text-gray-700 mb-1">
                        Waist
                      </label>
                      <input
                        type="number"
                        id="waist"
                        step="0.5"
                        min="0"
                        className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder={measurementUnit === 'in' ? '28' : '71'}
                        value={waist}
                        onChange={(e) => setWaist(e.target.value)}
                      />
                    </div>
                    <div>
                      <label htmlFor="hips" className="block text-xs font-medium text-gray-700 mb-1">
                        Hips
                      </label>
                      <input
                        type="number"
                        id="hips"
                        step="0.5"
                        min="0"
                        className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder={measurementUnit === 'in' ? '38' : '97'}
                        value={hips}
                        onChange={(e) => setHips(e.target.value)}
                      />
                    </div>
                    <div>
                      <label htmlFor="shoulder" className="block text-xs font-medium text-gray-700 mb-1">
                        Shoulder Width
                      </label>
                      <input
                        type="number"
                        id="shoulder"
                        step="0.5"
                        min="0"
                        className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder={measurementUnit === 'in' ? '15' : '38'}
                        value={shoulder}
                        onChange={(e) => setShoulder(e.target.value)}
                      />
                    </div>
                    <div>
                      <label htmlFor="shoulderToWaist" className="block text-xs font-medium text-gray-700 mb-1">
                        Shoulder to Waist
                      </label>
                      <input
                        type="number"
                        id="shoulderToWaist"
                        step="0.5"
                        min="0"
                        className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder={measurementUnit === 'in' ? '16' : '41'}
                        value={shoulderToWaist}
                        onChange={(e) => setShoulderToWaist(e.target.value)}
                      />
                    </div>
                    <div>
                      <label htmlFor="waistToHem" className="block text-xs font-medium text-gray-700 mb-1">
                        Waist to Floor
                      </label>
                      <input
                        type="number"
                        id="waistToHem"
                        step="0.5"
                        min="0"
                        className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder={measurementUnit === 'in' ? '42' : '107'}
                        value={waistToHem}
                        onChange={(e) => setWaistToHem(e.target.value)}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">
                    Provide as many measurements as possible for best fit
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="condition" className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                Condition <span className="text-red-600">*</span>
              </label>
              <select
                id="condition"
                value={condition}
                onChange={(e) => setCondition(e.target.value as ProductCondition)}
                className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm sm:text-base text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="new">New - Brand new, never worn</option>
                <option value="like_new">Like New - Worn once or twice, appears new</option>
                <option value="excellent">Excellent - Gently used, no visible flaws</option>
                <option value="good">Good - Some signs of wear, but still in good shape</option>
                <option value="fair">Fair - Noticeable wear, may have minor flaws</option>
              </select>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
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
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm sm:text-base text-gray-700">Elastic Band</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="materialType"
                    value="zipper"
                    checked={materialType === 'zipper'}
                    onChange={(e) => setMaterialType(e.target.value as 'elastic' | 'zipper')}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm sm:text-base text-gray-700">Zipper</span>
                </label>
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="images" className="block text-xs sm:text-sm font-medium text-gray-700">
              Images <span className="text-red-600">*</span> (Max 5 images)
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
                <p className="text-xs font-medium text-gray-700 mb-1">
                  COLOR <span className="text-red-600">*</span>
                </p>
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
