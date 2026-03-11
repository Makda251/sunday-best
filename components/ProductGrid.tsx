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
  const [conditionFilter, setConditionFilter] = useState<'all' | 'new' | 'pre-loved'>('all')
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchProducts()
  }, [searchQuery, selectedTags, conditionFilter])

  const fetchProducts = async () => {
    setLoading(true)

    const { data: allProducts } = await supabase
      .from('products')
      .select('*, seller:profiles!products_seller_id_fkey(full_name, email)')
      .eq('is_active', true)
      .eq('review_status', 'approved')
      .order('created_at', { ascending: false })

    let filtered = allProducts || []

    // Apply condition filter
    if (conditionFilter === 'new') {
      filtered = filtered.filter(product => product.condition === 'new')
    } else if (conditionFilter === 'pre-loved') {
      filtered = filtered.filter(product => product.condition !== 'new')
    }

    // Apply search filter (case-insensitive search in title, designer, and tags)
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase()
      filtered = filtered.filter(product =>
        product.title.toLowerCase().includes(lowerQuery) ||
        (product.designer && product.designer.toLowerCase().includes(lowerQuery)) ||
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
  const getPreLovedProducts = () => products.filter(p => p.condition !== 'new').slice(0, 6)

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
        <div className="mb-12 space-y-10">
          {getNewProducts().length > 0 && (
            <div>
              <div className="flex justify-between items-baseline mb-5">
                <h2 className="text-xl font-bold" style={{ color: '#111111' }}>New arrivals</h2>
                <button onClick={() => setConditionFilter('new')} className="text-sm font-medium" style={{ color: '#C4622D' }}>
                  View all →
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {getNewProducts().map((product: Product) => (
                  <ProductCard key={product.id} product={product} compact />
                ))}
              </div>
            </div>
          )}
          {getPreLovedProducts().length > 0 && (
            <div>
              <div className="flex justify-between items-baseline mb-5">
                <h2 className="text-xl font-bold" style={{ color: '#111111' }}>Pre-loved</h2>
                <button onClick={() => setConditionFilter('pre-loved')} className="text-sm font-medium" style={{ color: '#C4622D' }}>
                  View all →
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {getPreLovedProducts().map((product: Product) => (
                  <ProductCard key={product.id} product={product} compact />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Condition tabs + Search */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="flex gap-2">
          {(['all', 'new', 'pre-loved'] as const).map((tab) => {
            const labels = { all: 'All', new: 'New', 'pre-loved': 'Pre-Loved' }
            const active = conditionFilter === tab
            return (
              <button
                key={tab}
                onClick={() => setConditionFilter(tab)}
                className="px-4 py-1.5 rounded-full text-sm font-medium transition-all"
                style={{
                  border: active ? '1.5px solid #C4622D' : '1.5px solid #EBEBEB',
                  background: active ? '#FDF0EA' : '#fff',
                  color: active ? '#C4622D' : '#6B6B6B',
                }}
              >
                {labels[tab]}
              </button>
            )
          })}
        </div>

        {/* Search — mobile */}
        <div className="relative flex-1 min-w-[160px] sm:hidden">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: '#9A9A9A' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-sm rounded-full focus:outline-none"
            style={{ border: '1.5px solid #EBEBEB', background: '#F7F7F7', color: '#111111' }}
          />
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium rounded-full transition-all"
          style={{
            border: showFilters || selectedTags.length > 0 ? '1.5px solid #C4622D' : '1.5px solid #EBEBEB',
            background: showFilters || selectedTags.length > 0 ? '#FDF0EA' : '#fff',
            color: showFilters || selectedTags.length > 0 ? '#C4622D' : '#6B6B6B',
          }}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
          </svg>
          Filters
          {selectedTags.length > 0 && (
            <span className="inline-flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white rounded-full" style={{ backgroundColor: '#C4622D' }}>
              {selectedTags.length}
            </span>
          )}
        </button>
        {(searchQuery || selectedTags.length > 0) && (
          <button onClick={clearFilters} className="text-sm font-medium" style={{ color: '#C4622D' }}>
            Clear all
          </button>
        )}
      </div>

      {showFilters && (
        <div className="mb-5 p-4 rounded-2xl bg-white space-y-4" style={{ border: '1px solid #EBEBEB' }}>
          {[
            { label: 'COLORS', tags: COLOR_TAGS },
            { label: 'STYLES', tags: STYLE_TAGS },
            { label: 'OCCASIONS', tags: OCCASION_TAGS },
          ].map(({ label, tags }) => (
            <div key={label}>
              <p className="text-xs font-semibold tracking-wider mb-2" style={{ color: '#9A9A9A' }}>{label}</p>
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => {
                  const active = selectedTags.includes(tag)
                  return (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className="px-3 py-1 rounded-full text-xs font-medium transition-all"
                      style={{
                        border: active ? '1.5px solid #C4622D' : '1.5px solid #EBEBEB',
                        background: active ? '#FDF0EA' : '#fff',
                        color: active ? '#C4622D' : '#6B6B6B',
                      }}
                    >
                      {tag}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Products Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="rounded-2xl mb-3" style={{ aspectRatio: '3/4', backgroundColor: '#F7F7F7' }} />
              <div className="h-3 rounded-full mb-2" style={{ backgroundColor: '#F7F7F7', width: '75%' }} />
              <div className="h-3 rounded-full" style={{ backgroundColor: '#F7F7F7', width: '40%' }} />
            </div>
          ))}
        </div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product: Product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#FDF0EA' }}>
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#C4622D' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <p className="font-semibold" style={{ color: '#111111' }}>No dresses found</p>
          <p className="text-sm mt-1" style={{ color: '#6B6B6B' }}>Try adjusting your filters</p>
          <button onClick={clearFilters} className="mt-4 text-sm font-medium" style={{ color: '#C4622D' }}>
            Clear filters
          </button>
        </div>
      )}
    </div>
  )
}

function ProductCard({ product, compact = false }: { product: Product; compact?: boolean }) {
  const conditionLabel = product.condition === 'new' ? 'New' : product.condition === 'like_new' ? 'Like New' : 'Good'
  const conditionColor = product.condition === 'new'
    ? { color: '#16A34A' }
    : product.condition === 'like_new'
    ? { color: '#0284C7' }
    : { color: '#92400E' }

  return (
    <div
      className="group relative bg-white rounded-2xl overflow-hidden transition-all duration-200"
      style={{ border: '1px solid #EBEBEB' }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1), 0 12px 32px rgba(0,0,0,0.08)'; e.currentTarget.style.transform = 'translateY(-3px)' }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)' }}
    >
      {/* Condition badge */}
      <div className="absolute top-2.5 left-2.5 z-10">
        <span
          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
          style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(4px)', ...conditionColor }}
        >
          {conditionLabel}
        </span>
      </div>
      {/* Favorite button */}
      <div className="absolute top-2.5 right-2.5 z-10">
        <FavoriteButton productId={product.id} />
      </div>
      <Link href={`/products/${product.id}`}>
        <div className="w-full overflow-hidden" style={{ aspectRatio: '3/4', backgroundColor: '#F7F7F7' }}>
          {product.images && product.images.length > 0 ? (
            <Image
              src={product.images[0]}
              alt={product.title}
              width={400}
              height={533}
              className="w-full h-full object-center object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#D4D4D4' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
        </div>
        <div className="p-3">
          <h3 className={`font-semibold line-clamp-1 ${compact ? 'text-xs' : 'text-sm'}`} style={{ color: '#111111' }}>{product.title}</h3>
          <div className="flex items-center justify-between mt-2">
            <p className={`font-bold ${compact ? 'text-sm' : 'text-base'}`} style={{ color: '#111111' }}>${product.price}</p>
            {product.size && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-md" style={{ background: '#F7F7F7', color: '#6B6B6B', border: '1px solid #EBEBEB' }}>
                {product.size}
              </span>
            )}
          </div>
        </div>
      </Link>
    </div>
  )
}
