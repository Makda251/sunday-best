'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Product } from '@/lib/types/database'

interface AddToCartButtonProps {
  product: Product
}

export default function AddToCartButton({ product }: AddToCartButtonProps) {
  const [adding, setAdding] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setIsLoggedIn(!!user)
    }
    checkAuth()
  }, [supabase])

  const addToCart = async () => {
    // Check if user is logged in
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/auth/login')
      return
    }

    setAdding(true)

    // Get current cart from localStorage
    const cartData = localStorage.getItem('cart')
    const cart = cartData ? JSON.parse(cartData) : { items: [], seller_id: null }

    // Check if cart has items from a different seller
    if (cart.seller_id && cart.seller_id !== product.seller_id) {
      const confirmed = confirm(
        'Your cart contains items from another seller. Adding this item will clear your current cart. Continue?'
      )
      if (!confirmed) {
        setAdding(false)
        return
      }
      // Clear cart
      cart.items = []
    }

    // Set seller_id
    cart.seller_id = product.seller_id

    // Check if product already in cart
    const existingItemIndex = cart.items.findIndex((item: any) => item.product.id === product.id)

    if (existingItemIndex > -1) {
      // Product already in cart - increase quantity if available
      const currentQuantity = cart.items[existingItemIndex].quantity
      const maxAvailable = product.quantity_available || 1

      if (currentQuantity >= maxAvailable) {
        alert(`You already have the maximum available quantity (${maxAvailable}) in your cart.`)
        setAdding(false)
        router.push('/cart')
        return
      }

      // Increase quantity
      cart.items[existingItemIndex].quantity += 1
    } else {
      // Add new item with quantity 1
      cart.items.push({
        product,
        quantity: 1
      })
    }

    localStorage.setItem('cart', JSON.stringify(cart))
    setAdding(false)

    // Redirect to cart
    router.push('/cart')
  }

  return (
    <button
      onClick={addToCart}
      disabled={adding}
      className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 border border-transparent rounded-xl py-3 sm:py-4 px-8 flex items-center justify-center text-sm sm:text-base font-semibold text-white hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transform hover:scale-[1.02] transition-all shadow-lg"
    >
      {adding ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 sm:h-5 sm:w-5 text-white" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Adding...
        </>
      ) : (
        <>
          <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          {isLoggedIn ? 'Add to Cart' : 'Sign in to Purchase'}
        </>
      )}
    </button>
  )
}
