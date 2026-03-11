'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import ProductImageGallery from '@/components/ProductImageGallery'

type Product = {
  id: string
  title: string
  description: string
  price: number
  condition: string
  size: string
  images: string[]
  tags: string[]
  review_status: string
  created_at: string
  seller_id: string
  profiles: {
    email: string
    full_name: string
  }
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected'>('pending')
  const [loading, setLoading] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [showImageGallery, setShowImageGallery] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchProducts()
  }, [filter])

  const fetchProducts = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        profiles!products_seller_id_fkey (
          email,
          full_name
        )
      `)
      .eq('review_status', filter)
      .order('created_at', { ascending: false })

    if (!error && data) {
      setProducts(data as any)
    }
    setLoading(false)
  }

  const handleApprove = async (productId: string) => {
    const { data: { user } } = await supabase.auth.getUser()

    // Get the product details before updating
    const product = products.find(p => p.id === productId)
    if (!product) return

    const { error } = await supabase
      .from('products')
      .update({
        review_status: 'approved',
        reviewed_at: new Date().toISOString(),
        reviewed_by: user?.id,
      })
      .eq('id', productId)

    if (error) {
      console.error('Error approving product:', error)
      alert(`Failed to approve product: ${error.message}`)
    } else {
      // Send approval email to seller
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin
      let emailSent = false
      try {
        const response = await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'product-approved',
            params: {
              to: product.profiles.email,
              sellerName: product.profiles.full_name || 'Seller',
              productTitle: product.title,
              productImage: product.images?.[0],
              productUrl: `${baseUrl}/products/${productId}`,
            },
          }),
        })

        const result = await response.json()
        emailSent = result.success

        if (!emailSent) {
          console.error('Email API returned error:', result.error)
        }
      } catch (emailError) {
        console.error('Failed to send product approval email:', emailError)
      }

      // Remove the product from the current list
      setProducts(prev => prev.filter(p => p.id !== productId))
      setSelectedProduct(null)

      if (emailSent) {
        alert('Product approved successfully! Email notification sent to seller.')
      } else {
        alert('Product approved successfully! (Note: Email notification may have failed - check console for details)')
      }
    }
  }

  const handleReject = async (productId: string) => {
    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejection')
      return
    }

    const { data: { user } } = await supabase.auth.getUser()

    // Get the product details before updating
    const product = products.find(p => p.id === productId)
    if (!product) return

    const { error } = await supabase
      .from('products')
      .update({
        review_status: 'rejected',
        reviewed_at: new Date().toISOString(),
        reviewed_by: user?.id,
        rejection_reason: rejectionReason,
        is_active: false,
      })
      .eq('id', productId)

    if (error) {
      console.error('Error rejecting product:', error)
      alert(`Failed to reject product: ${error.message}`)
    } else {
      // Send rejection email to seller
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin
      let emailSent = false
      try {
        const response = await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'product-rejected',
            params: {
              to: product.profiles.email,
              sellerName: product.profiles.full_name || 'Seller',
              productTitle: product.title,
              rejectionReason: rejectionReason,
              editUrl: `${baseUrl}/dashboard/seller/products/${productId}/edit`,
            },
          }),
        })

        const result = await response.json()
        emailSent = result.success

        if (!emailSent) {
          console.error('Email API returned error:', result.error)
        }
      } catch (emailError) {
        console.error('Failed to send product rejection email:', emailError)
      }

      // Remove the product from the current list
      setProducts(prev => prev.filter(p => p.id !== productId))
      setSelectedProduct(null)
      setRejectionReason('')

      if (emailSent) {
        alert('Product rejected successfully! Email notification sent to seller.')
      } else {
        alert('Product rejected successfully! (Note: Email notification may have failed - check console for details)')
      }
    }
  }

  return (
    <div className="min-h-screen bg-white py-4 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#111111]">Product Reviews</h1>
          <p className="mt-1 text-sm text-[#6B6B6B]">Review and approve seller product listings</p>
        </div>

        {/* Filter Pills */}
        <div className="mb-6 flex gap-2">
          {(['pending', 'approved', 'rejected'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className="px-4 py-2 rounded-full text-sm font-semibold transition-all capitalize"
              style={filter === tab
                ? { background: '#C4622D', color: '#FFFFFF' }
                : { background: '#F7F7F7', color: '#6B6B6B', border: '1.5px solid #EBEBEB' }
              }
            >
              {tab === 'pending' ? 'Pending Review' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-[#9A9A9A]">Loading products...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-[#9A9A9A]">No {filter} products</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {products.map((product) => (
              <div key={product.id} className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #EBEBEB' }}>
                <div className="aspect-square relative">
                  <Image
                    src={product.images[0]}
                    alt={product.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-4">
                  <h3 className="text-base font-semibold truncate" style={{ color: '#111111' }}>{product.title}</h3>
                  <p className="text-sm text-[#6B6B6B] mt-1">
                    By: {product.profiles?.full_name || product.profiles?.email}
                  </p>
                  <p className="text-base font-bold mt-1" style={{ color: '#C4622D' }}>${product.price}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold" style={product.condition === 'new' ? { background: '#D1FAE5', color: '#065F46' } : { background: '#FEF3C7', color: '#92400E' }}>
                      {product.condition === 'new' ? 'New' : 'Pre-Loved'}
                    </span>
                    {product.size && <span className="text-xs" style={{ color: '#9A9A9A' }}>Size: {product.size}</span>}
                  </div>
                  <button
                    onClick={() => setSelectedProduct(product)}
                    className="mt-4 w-full px-4 py-2 text-white text-sm font-semibold rounded-full transition-all"
                    style={{ backgroundColor: '#C4622D' }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#A84F22'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = '#C4622D'}
                  >
                    Review
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Review Modal */}
        {selectedProduct && (
          <div className="fixed inset-0 flex items-center justify-center p-4 z-50" style={{ background: 'rgba(0,0,0,0.5)' }}>
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" style={{ border: '1px solid #EBEBEB' }}>
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-2xl font-bold text-[#111111]">Review Product</h2>
                  <button
                    onClick={() => {
                      setSelectedProduct(null)
                      setRejectionReason('')
                    }}
                    className="text-[#9A9A9A] hover:text-[#6B6B6B]"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Product Images - Compact Grid */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {selectedProduct.images.map((img, idx) => (
                    <div
                      key={idx}
                      className="aspect-square relative cursor-pointer group rounded-lg overflow-hidden"
                      onClick={() => setShowImageGallery(true)}
                    >
                      <Image
                        src={img}
                        alt={`${selectedProduct.title} ${idx + 1}`}
                        fill
                        className="object-cover hover:opacity-90 transition-opacity"
                      />
                      <div className="absolute bottom-1.5 right-1.5">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/95 px-2 py-1 rounded shadow-lg flex items-center gap-1">
                          <svg className="w-3 h-3 text-[#6B6B6B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                          </svg>
                          <span className="text-xs font-medium text-[#6B6B6B]">Zoom</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Product Details */}
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-[#6B6B6B]">Title</label>
                    <p className="text-[#111111]">{selectedProduct.title}</p>
                  </div>
                  {selectedProduct.designer && (
                    <div>
                      <label className="text-sm font-medium text-[#6B6B6B]">Designer/Brand</label>
                      <p className="text-[#111111]">{selectedProduct.designer}</p>
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium text-[#6B6B6B]">Description</label>
                    <p className="text-[#111111]">{selectedProduct.description || 'No description'}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-[#6B6B6B]">Price</label>
                      <p className="text-[#111111]">${selectedProduct.price}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-[#6B6B6B]">Condition</label>
                      <p className="text-[#111111]">{selectedProduct.condition}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-[#6B6B6B]">Size</label>
                      <p className="text-[#111111]">{selectedProduct.size || 'Not specified'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-[#6B6B6B]">Seller</label>
                      <p className="text-[#111111]">{selectedProduct.profiles?.full_name || selectedProduct.profiles?.email}</p>
                    </div>
                  </div>
                  {selectedProduct.tags && selectedProduct.tags.length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-[#6B6B6B]">Tags</label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {selectedProduct.tags.map((tag, idx) => (
                          <span key={idx} className="px-2 py-1 bg-gray-100 text-[#6B6B6B] text-xs rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Rejection Reason (only for pending) */}
                {filter === 'pending' && (
                  <div className="mt-6">
                    <label className="block text-sm font-medium text-[#6B6B6B] mb-2">
                      Rejection Reason (if rejecting)
                    </label>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      className="w-full rounded-lg py-2.5 px-4 text-sm outline-none transition-all resize-none"
                      style={{ border: '1.5px solid #EBEBEB', background: '#F7F7F7', color: '#111111' }}
                      onFocus={e => { e.currentTarget.style.borderColor = '#C4622D'; e.currentTarget.style.background = '#fff' }}
                      onBlur={e => { e.currentTarget.style.borderColor = '#EBEBEB'; e.currentTarget.style.background = '#F7F7F7' }}
                      rows={3}
                      placeholder="Provide reason for rejection (e.g., inappropriate content, poor image quality, etc.)"
                    />
                  </div>
                )}

                {/* Action Buttons */}
                {filter === 'pending' && (
                  <div className="mt-6 flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => handleApprove(selectedProduct.id)}
                      className="flex-1 px-4 py-2.5 text-white text-sm font-semibold rounded-full transition-all"
                      style={{ backgroundColor: '#16A34A' }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = '#15803D'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = '#16A34A'}
                    >
                      Approve Product
                    </button>
                    <button
                      onClick={() => handleReject(selectedProduct.id)}
                      className="flex-1 px-4 py-2.5 text-white text-sm font-semibold rounded-full transition-all"
                      style={{ backgroundColor: '#CC3333' }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = '#B91C1C'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = '#CC3333'}
                    >
                      Reject Product
                    </button>
                  </div>
                )}

                {/* Show rejection reason for rejected products */}
                {filter === 'rejected' && selectedProduct.rejection_reason && (
                  <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm font-medium text-red-900">Rejection Reason:</p>
                    <p className="text-sm text-red-700 mt-1">{selectedProduct.rejection_reason}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Fullscreen Image Gallery Modal */}
        {showImageGallery && selectedProduct && (
          <div className="fixed inset-0 bg-black bg-opacity-95 z-[60] flex items-center justify-center p-4">
            <ProductImageGallery
              images={selectedProduct.images}
              productTitle={selectedProduct.title}
            />
            <button
              onClick={() => setShowImageGallery(false)}
              className="fixed top-4 right-4 text-white hover:text-gray-300 p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors z-10"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
