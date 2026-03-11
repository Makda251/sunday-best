import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import type { Product } from '@/lib/types/database'
import FavoriteButton from '@/components/FavoriteButton'

export default async function SellerShopPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  // Fetch seller profile
  const { data: seller, error: sellerError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single()

  if (sellerError || !seller) {
    notFound()
  }

  // Fetch seller's active products
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('seller_id', id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  const productList = products || []

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Banner */}
      <div className="bg-orange-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl md:text-3xl font-bold mb-2">
              {seller.full_name || 'Anonymous Seller'}&apos;s Collection
            </h1>
            <p className="text-sm md:text-base text-indigo-100">
              {productList.length} {productList.length === 1 ? 'item' : 'items'} available
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Products Grid */}
        {productList.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
            {productList.map((product: Product) => (
              <Link key={product.id} href={`/products/${product.id}`} className="group">
                <div className="bg-white rounded-xl overflow-hidden transition-all duration-300 hover:-translate-y-1" style={{ border: '1px solid #EBEBEB', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                  {/* Image Container */}
                  <div className="relative aspect-square overflow-hidden bg-gray-100">
                    {/* Badges */}
                    <div className="absolute top-3 left-3 z-10">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                        product.condition === 'new'
                          ? 'bg-green-500 text-white'
                          : 'bg-amber-500 text-white'
                      }`}>
                        {product.condition === 'new' ? 'New' : 'Pre-Loved'}
                      </span>
                    </div>

                    {/* Favorite Button */}
                    <div className="absolute top-3 right-3 z-10">
                      <FavoriteButton productId={product.id} />
                    </div>

                    {/* Product Image */}
                    {product.images && product.images.length > 0 ? (
                      <Image
                        src={product.images[0]}
                        alt={product.title}
                        width={400}
                        height={400}
                        className="w-full h-full object-center object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#9A9A9A]">
                        <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="p-4">
                    <h3 className="text-sm font-semibold text-[#111111] line-clamp-2 mb-2 transition-colors">
                      {product.title}
                    </h3>
                    <p className="text-lg font-bold" style={{ color: '#C4622D' }}>${product.price}</p>

                    {/* Tags */}
                    {product.tags && product.tags.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {product.tags.slice(0, 2).map((tag: string) => (
                          <span key={tag} className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-medium bg-gray-100 text-[#6B6B6B]">
                            {tag}
                          </span>
                        ))}
                        {product.tags.length > 2 && (
                          <span className="text-xs text-[#9A9A9A] self-center">+{product.tags.length - 2}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-xl" style={{ border: '1px solid #EBEBEB' }}>
            <svg className="mx-auto h-24 w-24 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <h3 className="mt-6 text-xl font-semibold text-[#111111]">No products yet</h3>
            <p className="mt-2 text-[#9A9A9A]">This seller hasn&apos;t listed any products yet. Check back soon!</p>
          </div>
        )}
      </div>
    </div>
  )
}
