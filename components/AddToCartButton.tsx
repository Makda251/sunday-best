'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Product } from '@/lib/types/database'

interface AddToCartButtonProps {
  product: Product
}

export default function AddToCartButton({ product }: AddToCartButtonProps) {
  const [adding, setAdding] = useState(false)
  const router = useRouter()

  const addToCart = () => {
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
      // Increment quantity
      cart.items[existingItemIndex].quantity += 1
    } else {
      // Add new item
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
      className="w-full bg-indigo-600 border border-transparent rounded-md py-3 px-8 flex items-center justify-center text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
    >
      {adding ? 'Adding to cart...' : 'Add to cart'}
    </button>
  )
}
