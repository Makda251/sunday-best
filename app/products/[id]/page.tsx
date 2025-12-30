import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import AddToCartButton from '@/components/AddToCartButton'
import ProductImageGallery from '@/components/ProductImageGallery'
import FavoriteButton from '@/components/FavoriteButton'

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  // Get current user to check if they're the seller
  const { data: { user } } = await supabase.auth.getUser()

  // First try to get the product without review_status filter
  const { data: product } = await supabase
    .from('products')
    .select('*, seller:profiles!products_seller_id_fkey(id, full_name, email)')
    .eq('id', id)
    .single()

  if (!product) {
    notFound()
  }

  // Check if user is the seller
  const isOwnProduct = user && product.seller_id === user.id

  // If not approved and not the seller's own product, show 404
  if (product.review_status !== 'approved' && !isOwnProduct) {
    notFound()
  }

  // If approved but not active (sold) and not the seller's own product, show 404
  if (product.review_status === 'approved' && !product.is_active && !isOwnProduct) {
    notFound()
  }

  const shippingCost = parseFloat(process.env.NEXT_PUBLIC_SHIPPING_FLAT_RATE || '10')

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-4 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Review Status Banner (only visible to seller) */}
        {isOwnProduct && product.review_status === 'pending' && (
          <div className="mb-4 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  <strong>Pending Review:</strong> This product is waiting for admin approval before it will be visible to buyers.
                </p>
              </div>
            </div>
          </div>
        )}
        {isOwnProduct && product.review_status === 'rejected' && (
          <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-400 rounded-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">
                  <strong>Rejected:</strong> This product was rejected and is not visible to buyers.
                </p>
                {product.rejection_reason && (
                  <p className="text-sm text-red-600 mt-2">
                    <strong>Reason:</strong> {product.rejection_reason}
                  </p>
                )}
                <p className="text-sm text-red-600 mt-2">
                  You can <Link href={`/dashboard/seller/products/${product.id}/edit`} className="font-medium underline">edit this product</Link> to fix the issues and resubmit for review.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-xl overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 p-4 sm:p-6 lg:p-8">
            {/* Image Gallery */}
            <div>
              <ProductImageGallery images={product.images || []} productTitle={product.title} />
            </div>

            {/* Product Info */}
            <div className="flex flex-col">
              <div className="flex justify-between items-start gap-3">
                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{product.title}</h1>
                  {product.designer && (
                    <p className="mt-1 text-sm sm:text-base text-gray-600">
                      by <span className="font-medium text-gray-900">{product.designer}</span>
                    </p>
                  )}
                  <p className="mt-2 text-2xl sm:text-3xl font-bold text-indigo-600">${product.price}</p>
                </div>
                <div className="flex-shrink-0">
                  <FavoriteButton productId={product.id} />
                </div>
              </div>

              <div className="mt-4 sm:mt-6 space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-xs sm:text-sm text-gray-500 min-w-[80px]">Condition:</span>
                  <span className="inline-flex items-center px-2.5 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium bg-green-100 text-green-800 capitalize">
                    {product.condition.replace('_', ' ')}
                  </span>
                </div>

                {/* Quantity Available */}
                <div className="flex items-center gap-3">
                  <span className="text-xs sm:text-sm text-gray-500 min-w-[80px]">Availability:</span>
                  {product.quantity_available && product.quantity_available > 0 ? (
                    <span className={`inline-flex items-center px-2.5 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${
                      product.quantity_available <= 3
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {product.quantity_available === 1
                        ? 'Only 1 left!'
                        : `${product.quantity_available} available`}
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium bg-red-100 text-red-800">
                      Sold Out
                    </span>
                  )}
                </div>

                {product.size && (
                  <div className="flex items-center gap-3">
                    <span className="text-xs sm:text-sm text-gray-500 min-w-[80px]">Size:</span>
                    <span className="text-xs sm:text-sm font-medium text-gray-900">{product.size}</span>
                  </div>
                )}

                {product.tags && product.tags.length > 0 && (
                  <div className="flex items-start gap-3">
                    <span className="text-xs sm:text-sm text-gray-500 min-w-[80px] pt-1">Tags:</span>
                    <div className="flex flex-wrap gap-1.5 flex-1">
                      {product.tags.map((tag: string) => (
                        <span key={tag} className="inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-3 border-t border-gray-200">
                  <div className="flex items-center gap-3">
                    <span className="text-xs sm:text-sm text-gray-500">Seller:</span>
                    <span className="text-xs sm:text-sm font-medium text-gray-900">{product.seller?.full_name || 'Anonymous'}</span>
                  </div>
                  {product.seller_id && (
                    <Link
                      href={`/sellers/${product.seller_id}`}
                      className="text-xs sm:text-sm text-indigo-600 hover:text-indigo-500 font-medium inline-flex items-center"
                    >
                      Visit Shop
                      <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  )}
                </div>
              </div>

              {product.description && (
                <div className="mt-4 sm:mt-6">
                  <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-2">Description</h3>
                  <p className="text-xs sm:text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">{product.description}</p>
                </div>
              )}

              <div className="mt-6 bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-gray-600">Product price</span>
                    <span className="font-medium text-gray-900">${product.price}</span>
                  </div>
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-gray-600">Shipping</span>
                    <span className="font-medium text-gray-900">${shippingCost}</span>
                  </div>
                  <div className="flex justify-between text-sm sm:text-base font-semibold border-t border-gray-300 pt-2">
                    <span className="text-gray-900">Total</span>
                    <span className="text-indigo-600">
                      ${(product.price + shippingCost).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <AddToCartButton product={product} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
