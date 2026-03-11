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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-500">Loading cart...</p>
      </div>
    )
  }

  if (cart.items.length === 0) {
    return (
      <div className="min-h-screen py-16 flex items-center justify-center" style={{ backgroundColor: '#FFFFFF' }}>
        <div className="text-center">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5" style={{ backgroundColor: '#FDF0EA' }}>
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#C4622D' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-stone-900 mb-2" style={{  }}>Your cart is empty</h1>
          <p className="mb-8 text-sm" style={{ color: '#6B6B6B' }}>Browse our collection and add items to your cart</p>
          <Link href="/" className="inline-flex items-center justify-center px-6 py-3 text-sm font-semibold rounded-lg text-white transition" style={{ backgroundColor: '#C4622D' }}>
            Browse Dresses
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-8" style={{ backgroundColor: '#FFFFFF' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 mb-8" style={{  }}>
          Shopping Cart
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl overflow-hidden" style={{ border: '1px solid #EBEBEB' }}>
              <ul>
                {cart.items.map((item, idx) => (
                  <li key={item.product.id} className="p-5 sm:p-6" style={{ borderTop: idx > 0 ? '1px solid #EBEBEB' : 'none' }}>
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden" style={{ backgroundColor: '#EDE8E3' }}>
                        {item.product.images && item.product.images.length > 0 ? (
                          <Image src={item.product.images[0]} alt={item.product.title} width={96} height={96} className="w-full h-full object-center object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs" style={{ color: '#B5A899' }}>No image</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="text-sm sm:text-base font-semibold text-stone-900">
                              <Link href={`/products/${item.product.id}`} className="hover:underline">{item.product.title}</Link>
                            </h3>
                            <p className="mt-0.5 text-xs capitalize" style={{ color: '#6B6B6B' }}>{item.product.condition}</p>
                            {item.product.size && <p className="text-xs" style={{ color: '#6B6B6B' }}>Size: {item.product.size}</p>}
                          </div>
                          <p className="text-sm sm:text-base font-bold text-stone-900 flex-shrink-0">${item.product.price}</p>
                        </div>
                        <div className="mt-3 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs" style={{ color: '#6B6B6B' }}>Qty:</span>
                            <div className="flex items-center rounded-lg overflow-hidden" style={{ border: '1px solid #EBEBEB' }}>
                              <button onClick={() => updateQuantity(item.product.id, item.quantity - 1)} disabled={item.quantity <= 1} className="px-4 py-2.5 text-sm transition disabled:opacity-40 min-w-[44px]" style={{ color: '#6B6B6B' }}>−</button>
                              <span className="px-3 py-2.5 text-sm font-semibold text-stone-900" style={{ borderLeft: '1px solid #EBEBEB', borderRight: '1px solid #EBEBEB' }}>{item.quantity}</span>
                              <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)} disabled={item.quantity >= (item.product.quantity_available || 1)} className="px-4 py-2.5 text-sm transition disabled:opacity-40 min-w-[44px]" style={{ color: '#6B6B6B' }}>+</button>
                            </div>
                          </div>
                          <button onClick={() => removeItem(item.product.id)} className="text-xs font-medium" style={{ color: '#C4622D' }}>Remove</button>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="px-6 py-4" style={{ borderTop: '1px solid #EBEBEB', backgroundColor: '#FDFCFB' }}>
                <button onClick={clearCart} className="text-sm" style={{ color: '#6B6B6B' }}>Clear cart</button>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl p-6 lg:sticky lg:top-8" style={{ border: '1px solid #EBEBEB' }}>
              <h2 className="text-lg font-semibold text-stone-900 mb-4" style={{  }}>Order Summary</h2>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span style={{ color: '#6B6B6B' }}>Subtotal ({cart.items.length} item{cart.items.length !== 1 ? 's' : ''})</span>
                  <span className="font-medium text-stone-900">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: '#6B6B6B' }}>Shipping</span>
                  <span className="font-medium text-stone-900">${shipping.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-base font-bold pt-3" style={{ borderTop: '1px solid #EBEBEB' }}>
                  <span className="text-stone-900">Total</span>
                  <span style={{ color: '#C4622D' }}>${total.toFixed(2)}</span>
                </div>
              </div>
              <Link href="/checkout" className="mt-6 w-full flex items-center justify-center py-3 px-4 text-sm font-semibold text-white rounded-lg transition" style={{ backgroundColor: '#C4622D' }}>
                Proceed to Checkout
              </Link>
              <Link href="/" className="mt-3 w-full flex items-center justify-center py-3 px-4 text-sm font-medium rounded-lg transition" style={{ border: '1px solid #EBEBEB', color: '#6B6B6B' }}>
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
