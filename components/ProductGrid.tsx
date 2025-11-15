'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import Image from 'next/image'
import type { Product } from '@/lib/types/database'
import FavoriteButton from './FavoriteButton'

const COLOR_TAGS = ['White', 'Ivory', 'Red', 'Gold', 'Silver', 'Yellow', 'Pink', 'Green', 'Blue', 'Purple', 'Black', 'Multicolor']
const STYLE_TAGS = ['Traditional', 'Modern', 'Embroidered', 'Beaded', 'Sequined', 'Handwoven']
const OCCASION_TAGS = ['Wedding', 'Engagement', 'Baptism', 'Holiday', 'Casual', 'Festival']

export default function ProductGrid() {
  const [products, setProducts] = useState<Product[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [conditionFilter, setConditionFilter] = useState<'all' | 'new' | 'used'>('all')
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchProducts()
  }, [searchQuery, selectedTags, conditionFilter])

  const fetchProducts = async () => {
    setLoading(true)

    const { data: allProducts } = await supabase
      .from('products')
      .select('*, seller:profiles(full_name, email)')
      .eq('is_active', true)
      .eq('review_status', 'approved')
      .order('created_at', { ascending: false })

    let filtered = allProducts || []

    // Apply condition filter
    if (conditionFilter !== 'all') {
      filtered = filtered.filter(product => product.condition === conditionFilter)
    }

    // Apply search filter (case-insensitive search in title and tags)
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase()
      filtered = filtered.filter(product =>
        product.title.toLowerCase().includes(lowerQuery) ||
        (product.tags && product.tags.some((tag: string) => tag.toLowerCase().includes(lowerQuery)))
      )
    }

    // Apply tag filter
    if (selectedTags.length > 0) {
      filtered = filtered.filter(product =>
        product.tags && selectedTags.every(tag => product.tags.includes(tag))
      )
    }

    setProducts(filtered)
    setLoading(false)
  }

  const getNewProducts = () => products.filter(p => p.condition === 'new').slice(0, 6)
  const getPreLovedProducts = () => products.filter(p => p.condition === 'used').slice(0, 6)

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  const clearFilters = () => {
    setSearchQuery('')
    setSelectedTags([])
  }

  return (
    <div>
      {/* Featured Carousels */}
      {conditionFilter === 'all' && !searchQuery && selectedTags.length === 0 && (
        <div className="mb-12 space-y-8">
          {/* New Arrivals Carousel */}
          {getNewProducts().length > 0 && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900">New Arrivals</h2>
                <button
                  onClick={() => setConditionFilter('new')}
                  className="text-sm text-indigo-600 hover:text-indigo-500 font-medium"
                >
                  View all →
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {getNewProducts().map((product: Product) => (
                  <div key={product.id} className="group relative">
                    <div className="absolute top-2 right-2 z-10">
                      <FavoriteButton productId={product.id} />
                    </div>
                    <Link href={`/products/${product.id}`}>
                      <div className="w-full aspect-square bg-gray-200 rounded-lg overflow-hidden">
                        {product.images && product.images.length > 0 ? (
                          <Image
                            src={product.images[0]}
                            alt={product.title}
                            width={200}
                            height={200}
                            className="w-full h-full object-center object-cover group-hover:opacity-75"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            No image
                          </div>
                        )}
                      </div>
                      <h3 className="mt-2 text-sm text-gray-700 font-medium line-clamp-1">{product.title}</h3>
                      <p className="mt-1 text-base font-semibold text-gray-900">${product.price}</p>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pre-Loved Carousel */}
          {getPreLovedProducts().length > 0 && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Pre-Loved Treasures</h2>
                <button
                  onClick={() => setConditionFilter('used')}
                  className="text-sm text-indigo-600 hover:text-indigo-500 font-medium"
                >
                  View all →
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {getPreLovedProducts().map((product: Product) => (
                  <div key={product.id} className="group relative">
                    <div className="absolute top-2 right-2 z-10">
                      <FavoriteButton productId={product.id} />
                    </div>
                    <Link href={`/products/${product.id}`}>
                      <div className="w-full aspect-square bg-gray-200 rounded-lg overflow-hidden">
                        {product.images && product.images.length > 0 ? (
                          <Image
                            src={product.images[0]}
                            alt={product.title}
                            width={200}
                            height={200}
                            className="w-full h-full object-center object-cover group-hover:opacity-75"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            No image
                          </div>
                        )}
                      </div>
                      <h3 className="mt-2 text-sm text-gray-700 font-medium line-clamp-1">{product.title}</h3>
                      <p className="mt-1 text-base font-semibold text-gray-900">${product.price}</p>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setConditionFilter('all')}
            className={`${
              conditionFilter === 'all'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            All Dresses
          </button>
          <button
            onClick={() => setConditionFilter('new')}
            className={`${
              conditionFilter === 'new'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            New Arrivals
          </button>
          <button
            onClick={() => setConditionFilter('used')}
            className={`${
              conditionFilter === 'used'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Pre-Loved
          </button>
        </nav>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 space-y-3">
        <div className="flex gap-3 items-center">
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-64 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            {showFilters ? 'Hide Filters' : 'Show Filters'}
            {selectedTags.length > 0 && (
              <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-indigo-600 rounded-full">
                {selectedTags.length}
              </span>
            )}
          </button>
          {(searchQuery || selectedTags.length > 0) && (
            <button
              onClick={clearFilters}
              className="text-sm text-indigo-600 hover:text-indigo-500 font-medium"
            >
              Clear All
            </button>
          )}
        </div>

        {/* Tag Filters */}
        {showFilters && (
          <div className="bg-white p-3 sm:p-4 rounded-lg border border-gray-200">
            <div className="space-y-3 sm:space-y-4">
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1.5 sm:mb-2">COLORS</p>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {COLOR_TAGS.map(tag => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded text-xs sm:text-sm font-medium transition-colors ${
                        selectedTags.includes(tag)
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-gray-500 mb-1.5 sm:mb-2">STYLES</p>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {STYLE_TAGS.map(tag => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded text-xs sm:text-sm font-medium transition-colors ${
                        selectedTags.includes(tag)
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-gray-500 mb-1.5 sm:mb-2">OCCASIONS</p>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {OCCASION_TAGS.map(tag => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded text-xs sm:text-sm font-medium transition-colors ${
                        selectedTags.includes(tag)
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Loading...</p>
        </div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product: Product) => (
            <div key={product.id} className="group relative">
              <div className="absolute top-1.5 sm:top-2 left-1.5 sm:left-2 z-10">
                <span className={`inline-flex items-center px-1.5 py-0.5 sm:px-2 sm:py-1 rounded text-[10px] sm:text-xs font-semibold ${
                  product.condition === 'new'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  {product.condition === 'new' ? 'New' : 'Pre-Loved'}
                </span>
              </div>
              <div className="absolute top-1.5 sm:top-2 right-1.5 sm:right-2 z-10">
                <FavoriteButton productId={product.id} />
              </div>
              <Link href={`/products/${product.id}`}>
                <div className="w-full aspect-square bg-gray-200 rounded-lg overflow-hidden">
                  {product.images && product.images.length > 0 ? (
                    <Image
                      src={product.images[0]}
                      alt={product.title}
                      width={400}
                      height={400}
                      className="w-full h-full object-center object-cover group-hover:opacity-75"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                      No image
                    </div>
                  )}
                </div>
                <h3 className="mt-2 sm:mt-4 text-xs sm:text-sm text-gray-700 font-medium line-clamp-2">{product.title}</h3>
                <p className="mt-0.5 sm:mt-1 text-sm sm:text-lg font-semibold text-gray-900">${product.price}</p>
                {product.tags && product.tags.length > 0 && (
                  <div className="mt-1 sm:mt-2 flex flex-wrap gap-1">
                    {product.tags.slice(0, 2).map((tag: string) => (
                      <span key={tag} className="inline-flex items-center px-1.5 py-0.5 sm:px-2 rounded text-[10px] sm:text-xs font-medium bg-indigo-100 text-indigo-800">
                        {tag}
                      </span>
                    ))}
                    {product.tags.length > 2 && (
                      <span className="text-[10px] sm:text-xs text-gray-500">+{product.tags.length - 2}</span>
                    )}
                  </div>
                )}
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No products found.</p>
          <button
            onClick={clearFilters}
            className="mt-4 text-indigo-600 hover:text-indigo-500 font-medium"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  )
}
