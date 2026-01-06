'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'
import type { CartItem } from '@/lib/types/database'

export default function CheckoutPage() {
  const [cart, setCart] = useState<{ items: CartItem[]; seller_id: string | null }>({ items: [], seller_id: null })
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [addressLine1, setAddressLine1] = useState('')
  const [addressLine2, setAddressLine2] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [zip, setZip] = useState('')
  const [paymentScreenshot, setPaymentScreenshot] = useState<File | null>(null)
  const [buyerZelleEmail, setBuyerZelleEmail] = useState('')
  const [buyerZellePhone, setBuyerZellePhone] = useState('')

  const router = useRouter()
  const supabase = createClient()

  const shippingCost = parseFloat(process.env.NEXT_PUBLIC_SHIPPING_FLAT_RATE || '10')
  const platformFee = parseFloat(process.env.NEXT_PUBLIC_PLATFORM_FEE_PERCENTAGE || '10')
  const zelleEmail = process.env.NEXT_PUBLIC_ZELLE_EMAIL || ''
  const zellePhone = process.env.NEXT_PUBLIC_ZELLE_PHONE || ''

  useEffect(() => {
    const init = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      if (!currentUser) {
        router.push('/auth/login')
        return
      }

      // Check if user is admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', currentUser.id)
        .single()

      if (profile?.role === 'admin') {
        alert('Admins cannot place orders. Redirecting to dashboard.')
        router.push('/dashboard/admin')
        return
      }

      setUser(currentUser)

      const cartData = localStorage.getItem('cart')
      if (cartData) {
        const parsedCart = JSON.parse(cartData)
        if (parsedCart.items.length === 0) {
          router.push('/cart')
          return
        }
        setCart(parsedCart)
      } else {
        router.push('/cart')
        return
      }

      setLoading(false)
    }

    init()
  }, [router, supabase.auth])

  const subtotal = cart.items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0)
  const shipping = shippingCost
  const total = subtotal + shipping
  const platformFeeAmount = subtotal * (platformFee / 100)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPaymentScreenshot(e.target.files[0])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      if (!user) {
        throw new Error('Not authenticated')
      }

      if (!paymentScreenshot) {
        throw new Error('Please upload payment screenshot')
      }

      // Upload payment screenshot
      const fileExt = paymentScreenshot.name.split('.').pop()
      const fileName = `${user.id}/${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('payment-screenshots')
        .upload(fileName, paymentScreenshot)

      if (uploadError) {
        throw uploadError
      }

      const { data: { publicUrl } } = supabase.storage
        .from('payment-screenshots')
        .getPublicUrl(fileName)

      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          buyer_id: user.id,
          seller_id: cart.seller_id,
          subtotal,
          shipping_cost: shipping,
          platform_fee: platformFeeAmount,
          total,
          payment_method: 'zelle',
          payment_status: 'pending',
          payment_screenshot_url: publicUrl,
          buyer_zelle_email: buyerZelleEmail || null,
          buyer_zelle_phone: buyerZellePhone || null,
          shipping_address_line1: addressLine1,
          shipping_address_line2: addressLine2,
          shipping_city: city,
          shipping_state: state,
          shipping_zip: zip,
          shipping_country: 'USA',
          status: 'pending_payment',
        })
        .select()
        .single()

      if (orderError) {
        throw orderError
      }

      // Create order items
      const orderItems = cart.items.map(item => ({
        order_id: order.id,
        product_id: item.product.id,
        product_title: item.product.title,
        product_price: item.product.price,
        product_image: item.product.images?.[0] || null,
        quantity: 1, // Always 1 for unique items
      }))

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)

      if (itemsError) {
        throw itemsError
      }

      // Decrement product quantities
      for (const item of cart.items) {
        const newQuantity = (item.product.quantity_available || 1) - item.quantity

        const updateData: any = {
          quantity_available: Math.max(0, newQuantity)
        }

        // If quantity reaches 0, mark as inactive (sold out)
        if (newQuantity <= 0) {
          updateData.is_active = false
        }

        const { error: productError } = await supabase
          .from('products')
          .update(updateData)
          .eq('id', item.product.id)

        if (productError) {
          console.error('Error updating product quantity:', productError)
          // Don't fail the order if this fails
        }
      }

      // Get buyer profile for name
      const { data: buyerProfile } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', user.id)
        .single()

      // Send order confirmation email via API route
      const shippingAddress = `${addressLine1}${addressLine2 ? ', ' + addressLine2 : ''}, ${city}, ${state} ${zip}, USA`
      const orderNumber = `#${order.id.slice(0, 8).toUpperCase()}`
      const productTitle = cart.items[0].product.title + (cart.items.length > 1 ? ` and ${cart.items.length - 1} more` : '')

      // Send email to buyer
      try {
        await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'order-placed',
            params: {
              to: user.email || buyerProfile?.email || '',
              buyerName: buyerProfile?.full_name || 'Customer',
              orderNumber,
              orderTotal: `$${total.toFixed(2)}`,
              productTitle,
              productImage: cart.items[0].product.images?.[0],
              productPrice: `$${subtotal.toFixed(2)}`,
              shippingCost: `$${shipping.toFixed(2)}`,
              shippingAddress,
            },
          }),
        })
      } catch (emailError) {
        console.error('Failed to send order confirmation email:', emailError)
        // Don't fail the order if email fails
      }

      // Check if admin email notifications are enabled
      const { data: adminSettings } = await supabase
        .from('admin_settings')
        .select('email_notifications_enabled')
        .single()

      // Send notification email to admin if enabled
      if (adminSettings?.email_notifications_enabled !== false) {
        try {
          await fetch('/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'admin-order-notification',
              params: {
                to: process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'asmesmarketplace@gmail.com',
                orderNumber,
                orderTotal: `$${total.toFixed(2)}`,
                buyerName: buyerProfile?.full_name || 'Customer',
                buyerEmail: user.email || buyerProfile?.email || '',
                productTitle,
                productImage: cart.items[0].product.images?.[0],
                productPrice: `$${subtotal.toFixed(2)}`,
                shippingCost: `$${shipping.toFixed(2)}`,
                shippingAddress,
                paymentScreenshotUrl: publicUrl,
                buyerZelleEmail: buyerZelleEmail || undefined,
                buyerZellePhone: buyerZellePhone || undefined,
                orderUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/admin/orders/${order.id}`,
              },
            }),
          })
        } catch (emailError) {
          console.error('Failed to send admin notification email:', emailError)
          // Don't fail the order if email fails
        }
      }

      // Clear cart
      localStorage.removeItem('cart')

      // Redirect to order confirmation
      router.push(`/orders/${order.id}`)
    } catch (err: any) {
      console.error('Checkout error:', err)
      setError(err.message)
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2 space-y-6">
            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Shipping Address */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Shipping Address</h2>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Street Address *</label>
                  <input
                    type="text"
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={addressLine1}
                    onChange={(e) => setAddressLine1(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Apartment, suite, etc.</label>
                  <input
                    type="text"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={addressLine2}
                    onChange={(e) => setAddressLine2(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">City *</label>
                    <input
                      type="text"
                      required
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">State *</label>
                    <input
                      type="text"
                      required
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">ZIP Code *</label>
                  <input
                    type="text"
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={zip}
                    onChange={(e) => setZip(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Payment Instructions */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Payment via Zelle</h2>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <h3 className="font-medium text-blue-900 mb-2">Send payment to:</h3>
                <div className="space-y-1 text-sm text-blue-900">
                  {zelleEmail && <p><strong>Email:</strong> {zelleEmail}</p>}
                  {zellePhone && <p><strong>Phone:</strong> {zellePhone}</p>}
                  <p><strong>Amount:</strong> ${total.toFixed(2)}</p>
                  <p className="text-xs text-blue-700 mt-2">
                    Please include your order reference in the Zelle memo
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Zelle Email or Phone <span className="text-xs text-gray-500">(for refunds if needed)</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="email"
                      placeholder="Email used for Zelle"
                      className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      value={buyerZelleEmail}
                      onChange={(e) => setBuyerZelleEmail(e.target.value)}
                    />
                    <input
                      type="tel"
                      placeholder="Phone used for Zelle"
                      className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      value={buyerZellePhone}
                      onChange={(e) => setBuyerZellePhone(e.target.value)}
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Provide at least one so we can refund you if the order is cancelled
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload Zelle Payment Screenshot *
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    required
                    onChange={handleFileChange}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                  />
                  {paymentScreenshot && (
                    <p className="mt-2 text-sm text-green-600">
                      ✓ {paymentScreenshot.name}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white shadow rounded-lg p-6 sticky top-8">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Order Summary</h2>

              <div className="mb-4 max-h-60 overflow-y-auto">
                {cart.items.map((item) => (
                  <div key={item.product.id} className="flex items-center space-x-3 mb-3">
                    <div className="flex-shrink-0 w-16 h-16 bg-gray-200 rounded overflow-hidden">
                      {item.product.images?.[0] && (
                        <Image
                          src={item.product.images[0]}
                          alt={item.product.title}
                          width={64}
                          height={64}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{item.product.title}</p>
                      <p className="text-xs text-gray-500">Qty: {item.quantity} × ${item.product.price}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium text-gray-900">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-medium text-gray-900">${shipping.toFixed(2)}</span>
                </div>
                <div className="border-t pt-2 flex justify-between text-base font-medium">
                  <span className="text-gray-900">Total</span>
                  <span className="text-gray-900">${total.toFixed(2)}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="mt-6 w-full bg-gradient-to-r from-indigo-600 to-purple-600 border border-transparent rounded-xl py-3 px-4 text-base font-semibold text-white hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition shadow-lg hover:shadow-xl"
              >
                {submitting ? 'Placing order...' : 'Place Order'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
