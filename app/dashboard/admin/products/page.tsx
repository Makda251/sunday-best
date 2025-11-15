'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

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
  const [zoomedImage, setZoomedImage] = useState<string | null>(null)
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
      // Remove the product from the current list
      setProducts(prev => prev.filter(p => p.id !== productId))
      setSelectedProduct(null)
      alert('Product approved successfully!')
    }
  }

  const handleReject = async (productId: string) => {
    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejection')
      return
    }

    const { data: { user } } = await supabase.auth.getUser()

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
      // Remove the product from the current list
      setProducts(prev => prev.filter(p => p.id !== productId))
      setSelectedProduct(null)
      setRejectionReason('')
      alert('Product rejected successfully!')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Product Reviews</h1>
          <p className="mt-1 text-sm text-gray-600">Review and approve seller product listings</p>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex gap-4 sm:gap-8">
            <button
              onClick={() => setFilter('pending')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                filter === 'pending'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Pending Review
              {filter !== 'pending' && products.filter(p => p.review_status === 'pending').length > 0 && (
                <span className="ml-2 bg-yellow-100 text-yellow-800 py-0.5 px-2 rounded-full text-xs font-semibold">
                  {products.filter(p => p.review_status === 'pending').length}
                </span>
              )}
            </button>
            <button
              onClick={() => setFilter('approved')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                filter === 'approved'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Approved
            </button>
            <button
              onClick={() => setFilter('rejected')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                filter === 'rejected'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Rejected
            </button>
          </nav>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading products...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No {filter} products</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {products.map((product) => (
              <div key={product.id} className="bg-white rounded-lg shadow overflow-hidden">
                <div className="aspect-square relative">
                  <Image
                    src={product.images[0]}
                    alt={product.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900 truncate">{product.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    By: {product.profiles?.full_name || product.profiles?.email}
                  </p>
                  <p className="text-lg font-bold text-indigo-600 mt-2">${product.price}</p>
                  <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                    <span className={`px-2 py-0.5 rounded ${
                      product.condition === 'new' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {product.condition === 'new' ? 'New' : 'Pre-Loved'}
                    </span>
                    {product.size && <span>Size: {product.size}</span>}
                  </div>
                  <button
                    onClick={() => setSelectedProduct(product)}
                    className="mt-4 w-full px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition"
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
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">Review Product</h2>
                  <button
                    onClick={() => {
                      setSelectedProduct(null)
                      setRejectionReason('')
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Product Images */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
                  {selectedProduct.images.map((img, idx) => (
                    <div
                      key={idx}
                      className="aspect-square relative cursor-pointer group"
                      onClick={() => setZoomedImage(img)}
                    >
                      <Image src={img} alt={`${selectedProduct.title} ${idx + 1}`} fill className="object-cover rounded" />
                      <div className="absolute bottom-2 right-2">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/95 px-2 py-1.5 rounded-lg shadow-lg flex items-center gap-1">
                          <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                          </svg>
                          <span className="text-xs font-medium text-gray-700">Click to zoom</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Product Details */}
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Title</label>
                    <p className="text-gray-900">{selectedProduct.title}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Description</label>
                    <p className="text-gray-900">{selectedProduct.description || 'No description'}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Price</label>
                      <p className="text-gray-900">${selectedProduct.price}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Condition</label>
                      <p className="text-gray-900">{selectedProduct.condition}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Size</label>
                      <p className="text-gray-900">{selectedProduct.size || 'Not specified'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Seller</label>
                      <p className="text-gray-900">{selectedProduct.profiles?.full_name || selectedProduct.profiles?.email}</p>
                    </div>
                  </div>
                  {selectedProduct.tags && selectedProduct.tags.length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Tags</label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {selectedProduct.tags.map((tag, idx) => (
                          <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rejection Reason (if rejecting)
                    </label>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
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
                      className="flex-1 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold rounded-lg hover:from-green-700 hover:to-green-800 transition"
                    >
                      Approve Product
                    </button>
                    <button
                      onClick={() => handleReject(selectedProduct.id)}
                      className="flex-1 px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold rounded-lg hover:from-red-700 hover:to-red-800 transition"
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

        {/* Fullscreen Image Zoom Modal */}
        {zoomedImage && (
          <div
            className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center p-4 z-[60]"
            onClick={() => setZoomedImage(null)}
          >
            <button
              onClick={() => setZoomedImage(null)}
              className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="relative w-full h-full flex items-center justify-center">
              <Image
                src={zoomedImage}
                alt="Zoomed product image"
                fill
                className="object-contain"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
