import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import AddToCartButton from '@/components/AddToCartButton'
import ProductImageGallery from '@/components/ProductImageGallery'
import FavoriteButton from '@/components/FavoriteButton'

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: product } = await supabase
    .from('products')
    .select('*, seller:profiles!products_seller_id_fkey(id, full_name, email)')
    .eq('id', id)
    .single()

  if (!product) {
    notFound()
  }

  const shippingCost = parseFloat(process.env.NEXT_PUBLIC_SHIPPING_FLAT_RATE || '10')

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-4 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
                    {product.condition}
                  </span>
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
