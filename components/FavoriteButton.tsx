'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface FavoriteButtonProps {
  productId: string
}

export default function FavoriteButton({ productId }: FavoriteButtonProps) {
  const [isFavorited, setIsFavorited] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkFavoriteStatus()
  }, [productId])

  const checkFavoriteStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', user.id)
      .eq('product_id', productId)
      .maybeSingle()

    setIsFavorited(!!data)
  }

  const toggleFavorite = async () => {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/auth/login')
      return
    }

    setLoading(true)

    try {
      if (isFavorited) {
        // Remove from favorites
        await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', productId)

        setIsFavorited(false)
      } else {
        // Add to favorites
        await supabase
          .from('favorites')
          .insert({
            user_id: user.id,
            product_id: productId
          })

        setIsFavorited(true)
      }
    } catch (error) {
      console.error('Error toggling favorite:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        toggleFavorite()
      }}
      disabled={loading}
      className="p-2 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors disabled:opacity-50"
      title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill={isFavorited ? 'currentColor' : 'none'}
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className={`w-5 h-5 ${isFavorited ? 'text-red-500' : 'text-gray-600'}`}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
        />
      </svg>
    </button>
  )
}
