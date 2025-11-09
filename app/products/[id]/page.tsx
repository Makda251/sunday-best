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
    .select('*, seller:profiles(id, full_name, email)')
    .eq('id', id)
    .single()

  if (!product) {
    notFound()
  }

  console.log('Product data:', { seller_id: product.seller_id, seller: product.seller })

  const shippingCost = parseFloat(process.env.NEXT_PUBLIC_SHIPPING_FLAT_RATE || '10')

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8">
            {/* Image Gallery */}
            <div>
              <ProductImageGallery images={product.images || []} productTitle={product.title} />
            </div>

            {/* Product Info */}
            <div className="flex flex-col">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{product.title}</h1>
                  <p className="mt-2 text-3xl text-gray-900">${product.price}</p>
                </div>
                <FavoriteButton productId={product.id} />
              </div>

              <div className="mt-6 space-y-4">
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-500">Condition:</span>
                  <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-green-100 text-green-800 capitalize">
                    {product.condition}
                  </span>
                </div>

                {product.size && (
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-500">Size:</span>
                    <span className="text-sm font-medium text-gray-900">{product.size}</span>
                  </div>
                )}

                {product.tags && product.tags.length > 0 && (
                  <div className="flex items-start space-x-4">
                    <span className="text-sm text-gray-500">Tags:</span>
                    <div className="flex flex-wrap gap-2">
                      {product.tags.map((tag: string) => (
                        <span key={tag} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-500">Seller:</span>
                    <span className="text-sm text-gray-900">{product.seller?.full_name || 'Anonymous'}</span>
                  </div>
                  {product.seller_id && (
                    <Link
                      href={`/sellers/${product.seller_id}`}
                      className="text-sm text-indigo-600 hover:text-indigo-500 font-medium"
                    >
                      Visit Seller's Shop →
                    </Link>
                  )}
                </div>
              </div>

              {product.description && (
                <div className="mt-6">
                  <h3 className="text-sm font-medium text-gray-900">Description</h3>
                  <p className="mt-2 text-sm text-gray-600 whitespace-pre-wrap">{product.description}</p>
                </div>
              )}

              <div className="mt-6 border-t border-gray-200 pt-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Product price</span>
                    <span className="font-medium text-gray-900">${product.price}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Shipping</span>
                    <span className="font-medium text-gray-900">${shippingCost}</span>
                  </div>
                  <div className="flex justify-between text-base font-medium border-t pt-2">
                    <span className="text-gray-900">Total</span>
                    <span className="text-gray-900">
                      ${(product.price + shippingCost).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <AddToCartButton product={product} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
