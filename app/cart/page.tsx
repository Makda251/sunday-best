'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import type { CartItem } from '@/lib/types/database'

export default function CartPage() {
  const [cart, setCart] = useState<{ items: CartItem[]; seller_id: string | null }>({ items: [], seller_id: null })
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const shippingCost = parseFloat(process.env.NEXT_PUBLIC_SHIPPING_FLAT_RATE || '10')

  useEffect(() => {
    const cartData = localStorage.getItem('cart')
    if (cartData) {
      setCart(JSON.parse(cartData))
    }
    setLoading(false)
  }, [])

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      removeItem(productId)
      return
    }

    const updatedCart = {
      ...cart,
      items: cart.items.map(item =>
        item.product.id === productId ? { ...item, quantity: newQuantity } : item
      )
    }
    setCart(updatedCart)
    localStorage.setItem('cart', JSON.stringify(updatedCart))
  }

  const removeItem = (productId: string) => {
    const updatedCart = {
      ...cart,
      items: cart.items.filter(item => item.product.id !== productId)
    }

    if (updatedCart.items.length === 0) {
      updatedCart.seller_id = null
    }

    setCart(updatedCart)
    localStorage.setItem('cart', JSON.stringify(updatedCart))
  }

  const clearCart = () => {
    setCart({ items: [], seller_id: null })
    localStorage.removeItem('cart')
  }

  const subtotal = cart.items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0)
  const shipping = shippingCost
  const total = subtotal + shipping

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading cart...</p>
      </div>
    )
  }

  if (cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Your cart is empty</h1>
          <p className="text-gray-600 mb-8">Browse our collection and add items to your cart</p>
          <Link
            href="/"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <ul className="divide-y divide-gray-200">
                {cart.items.map((item) => (
                  <li key={item.product.id} className="p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 w-24 h-24 bg-gray-200 rounded-md overflow-hidden">
                        {item.product.images && item.product.images.length > 0 ? (
                          <Image
                            src={item.product.images[0]}
                            alt={item.product.title}
                            width={96}
                            height={96}
                            className="w-full h-full object-center object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                            No image
                          </div>
                        )}
                      </div>
                      <div className="ml-6 flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-base font-medium text-gray-900">
                              <Link href={`/products/${item.product.id}`} className="hover:text-indigo-600">
                                {item.product.title}
                              </Link>
                            </h3>
                            <p className="mt-1 text-sm text-gray-500 capitalize">{item.product.condition}</p>
                            {item.product.size && (
                              <p className="mt-1 text-sm text-gray-500">Size: {item.product.size}</p>
                            )}
                          </div>
                          <p className="text-base font-medium text-gray-900">${item.product.price}</p>
                        </div>
                        <div className="mt-4 flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                              className="p-1 rounded-md hover:bg-gray-100"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                              </svg>
                            </button>
                            <span className="text-gray-900 w-8 text-center">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                              className="p-1 rounded-md hover:bg-gray-100"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              </svg>
                            </button>
                          </div>
                          <button
                            onClick={() => removeItem(item.product.id)}
                            className="text-sm text-red-600 hover:text-red-500"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="p-6 bg-gray-50 border-t">
                <button
                  onClick={clearCart}
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Clear cart
                </button>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white shadow rounded-lg p-6 sticky top-8">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Order Summary</h2>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal ({cart.items.length} item{cart.items.length !== 1 ? 's' : ''})</span>
                  <span className="font-medium text-gray-900">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-medium text-gray-900">${shipping.toFixed(2)}</span>
                </div>
                <div className="border-t pt-3 flex justify-between text-base font-medium">
                  <span className="text-gray-900">Total</span>
                  <span className="text-gray-900">${total.toFixed(2)}</span>
                </div>
              </div>
              <Link
                href="/checkout"
                className="mt-6 w-full bg-indigo-600 border border-transparent rounded-md py-3 px-4 flex items-center justify-center text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Proceed to Checkout
              </Link>
              <Link
                href="/"
                className="mt-3 w-full bg-white border border-gray-300 rounded-md py-3 px-4 flex items-center justify-center text-base font-medium text-gray-700 hover:bg-gray-50"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
