'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import type { Product } from '@/lib/types/database'

interface FavoriteWithProduct {
  id: string
  product_id: string
  created_at: string
  product: Product
}

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<FavoriteWithProduct[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchFavorites()
  }, [])

  const fetchFavorites = async () => {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/auth/login')
      return
    }

    const { data, error } = await supabase
      .from('favorites')
      .select(`
        id,
        product_id,
        created_at,
        product:products(*)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (!error && data) {
      setFavorites(data as any)
    }

    setLoading(false)
  }

  const removeFavorite = async (favoriteId: string) => {
    await supabase
      .from('favorites')
      .delete()
      .eq('id', favoriteId)

    setFavorites(favorites.filter(f => f.id !== favoriteId))
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#FFFFFF' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 mx-auto mb-3" style={{ borderColor: '#EBEBEB', borderTopColor: '#C4622D' }} />
          <p className="text-sm" style={{ color: '#9A9A9A' }}>Loading favorites...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-8" style={{ backgroundColor: '#FFFFFF' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: '#111111' }}>My Favorites</h1>
          <p className="mt-1 text-sm" style={{ color: '#6B6B6B' }}>
            {favorites.length} {favorites.length === 1 ? 'item' : 'items'} saved
          </p>
        </div>

        {favorites.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {favorites.map((favorite) => (
              <div
                key={favorite.id}
                className="group relative bg-white rounded-2xl overflow-hidden transition-all duration-200"
                style={{ border: '1px solid #EBEBEB' }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1), 0 12px 32px rgba(0,0,0,0.08)'; e.currentTarget.style.transform = 'translateY(-3px)' }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)' }}
              >
                <Link href={`/products/${favorite.product.id}`}>
                  <div className="w-full overflow-hidden" style={{ aspectRatio: '3/4', backgroundColor: '#F7F7F7' }}>
                    {favorite.product.images && favorite.product.images.length > 0 ? (
                      <Image
                        src={favorite.product.images[0]}
                        alt={favorite.product.title}
                        width={400}
                        height={533}
                        className="w-full h-full object-center object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center" style={{ color: '#D4D4D4' }}>
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="text-sm font-semibold line-clamp-1" style={{ color: '#111111' }}>{favorite.product.title}</h3>
                    <div className="flex items-center justify-between mt-1.5">
                      <p className="text-base font-bold" style={{ color: '#111111' }}>${favorite.product.price}</p>
                      <span className="text-xs capitalize px-2 py-0.5 rounded-md" style={{ background: '#F7F7F7', color: '#6B6B6B', border: '1px solid #EBEBEB' }}>{favorite.product.condition.replace('_', ' ')}</span>
                    </div>
                  </div>
                </Link>
                <button
                  onClick={() => removeFavorite(favorite.id)}
                  className="absolute top-2.5 right-2.5 w-8 h-8 flex items-center justify-center rounded-full transition-colors"
                  style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(4px)' }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="#C4622D" viewBox="0 0 24 24" strokeWidth={2} stroke="#C4622D" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#FDF0EA' }}>
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#C4622D' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h3 className="text-base font-semibold mb-1" style={{ color: '#111111' }}>No favorites yet</h3>
            <p className="text-sm mb-6" style={{ color: '#6B6B6B' }}>Start adding items to your favorites!</p>
            <Link href="/" className="inline-flex items-center justify-center px-6 py-3 text-sm font-semibold rounded-full text-white transition" style={{ backgroundColor: '#C4622D' }}>
              Browse Dresses
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
