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
  const [saveAddress, setSaveAddress] = useState(true)

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

      // Check if user is admin and load saved address
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, address_line1, address_line2, city, state, zip_code')
        .eq('id', currentUser.id)
        .single()

      if (profile?.role === 'admin') {
        alert('Admins cannot place orders. Redirecting to dashboard.')
        router.push('/dashboard/admin')
        return
      }

      // Pre-fill saved address if available
      if (profile?.address_line1) {
        setAddressLine1(profile.address_line1)
        setAddressLine2(profile.address_line2 || '')
        setCity(profile.city || '')
        setState(profile.state || '')
        setZip(profile.zip_code || '')
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

      // Mark products as sold/unavailable immediately
      // Use database function to bypass RLS policies
      for (const item of cart.items) {
        const { data, error: reserveError } = await supabase.rpc('reserve_product', {
          product_id: item.product.id,
          quantity_to_reserve: item.quantity
        })

        if (reserveError) {
          console.error('Error reserving product:', reserveError)
          throw new Error('Failed to reserve product. Please try again.')
        }
      }

      // Get buyer profile for name
      const { data: buyerProfile } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', user.id)
        .single()

      // Save shipping address to profile if checkbox is checked
      if (saveAddress) {
        await supabase
          .from('profiles')
          .update({
            address_line1: addressLine1,
            address_line2: addressLine2 || null,
            city: city,
            state: state,
            zip_code: zip,
            country: 'USA',
          })
          .eq('id', user.id)
      }

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
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#FFFFFF' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 mx-auto mb-3" style={{ borderColor: '#EBEBEB', borderTopColor: '#C4622D' }} />
          <p className="text-sm" style={{ color: '#6B6B6B' }}>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-8" style={{ backgroundColor: '#FFFFFF' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 mb-8" style={{  }}>Checkout</h1>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2 space-y-5">
            {error && (
              <div className="rounded-xl p-4" style={{ backgroundColor: '#FDF0EA', border: '1px solid #FECACA' }}>
                <p className="text-sm" style={{ color: '#C4622D' }}>{error}</p>
              </div>
            )}

            {/* Shipping Address */}
            <div className="bg-white rounded-xl p-6" style={{ border: '1px solid #EBEBEB' }}>
              <h2 className="text-base font-semibold text-stone-900 mb-5" style={{  }}>Shipping Address</h2>
              <div className="grid grid-cols-1 gap-4">
                {[
                  { label: 'Street Address', value: addressLine1, onChange: setAddressLine1, required: true },
                  { label: 'Apartment, suite, etc.', value: addressLine2, onChange: setAddressLine2, required: false },
                ].map(({ label, value, onChange, required }) => (
                  <div key={label}>
                    <label className="block text-sm font-semibold mb-1.5" style={{ color: '#111111' }}>{label}{required ? ' *' : ''}</label>
                    <input type="text" required={required} value={value} onChange={(e) => onChange(e.target.value)}
                      className="block w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none" style={{ border: '1px solid #EBEBEB', backgroundColor: '#FDFCFB' }} />
                  </div>
                ))}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-1.5" style={{ color: '#111111' }}>City *</label>
                    <input type="text" required value={city} onChange={(e) => setCity(e.target.value)}
                      className="block w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none" style={{ border: '1px solid #EBEBEB', backgroundColor: '#FDFCFB' }} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1.5" style={{ color: '#111111' }}>State *</label>
                    <input type="text" required value={state} onChange={(e) => setState(e.target.value)}
                      className="block w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none" style={{ border: '1px solid #EBEBEB', backgroundColor: '#FDFCFB' }} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5" style={{ color: '#111111' }}>ZIP Code *</label>
                  <input type="text" required value={zip} onChange={(e) => setZip(e.target.value)}
                    className="block w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none" style={{ border: '1px solid #EBEBEB', backgroundColor: '#FDFCFB' }} />
                </div>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input id="save-address" type="checkbox" checked={saveAddress} onChange={(e) => setSaveAddress(e.target.checked)} className="mt-0.5 h-4 w-4 rounded" style={{ accentColor: '#C4622D' }} />
                  <div>
                    <span className="text-sm font-medium text-stone-900">Save this address for future orders</span>
                    <p className="text-xs mt-0.5" style={{ color: '#6B6B6B' }}>We&apos;ll pre-fill this address next time you checkout</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Payment */}
            <div className="bg-white rounded-xl p-6" style={{ border: '1px solid #EBEBEB' }}>
              <h2 className="text-base font-semibold text-stone-900 mb-5" style={{  }}>Payment via Zelle</h2>
              <div className="rounded-xl p-4 mb-5" style={{ backgroundColor: '#F7F7F7', border: '1px solid #F0D99A' }}>
                <h3 className="text-sm font-semibold mb-2" style={{ color: '#6B6B6B' }}>Send payment to:</h3>
                <div className="space-y-1 text-sm" style={{ color: '#6B4C0A' }}>
                  {zelleEmail && <p><strong>Email:</strong> {zelleEmail}</p>}
                  {zellePhone && <p><strong>Phone:</strong> {zellePhone}</p>}
                  <p><strong>Amount:</strong> ${total.toFixed(2)}</p>
                  <p className="text-xs mt-2" style={{ color: '#6B6B6B' }}>Please include your order reference in the Zelle memo</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#111111' }}>Upload Zelle Payment Screenshot *</label>
                <input type="file" accept="image/*" required onChange={handleFileChange}
                  className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold"
                  style={{ color: '#6B6B6B' }} />
                {paymentScreenshot && (
                  <p className="mt-2 text-sm font-medium" style={{ color: '#166534' }}>✓ {paymentScreenshot.name}</p>
                )}
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl p-6 lg:sticky lg:top-8" style={{ border: '1px solid #EBEBEB' }}>
              <h2 className="text-base font-semibold text-stone-900 mb-4" style={{  }}>Order Summary</h2>
              <div className="mb-4 max-h-56 overflow-y-auto space-y-3">
                {cart.items.map((item) => (
                  <div key={item.product.id} className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden" style={{ backgroundColor: '#EDE8E3' }}>
                      {item.product.images?.[0] && (
                        <Image src={item.product.images[0]} alt={item.product.title} width={56} height={56} className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-stone-900 truncate">{item.product.title}</p>
                      <p className="text-xs" style={{ color: '#6B6B6B' }}>Qty: {item.quantity} × ${item.product.price}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="space-y-2 pt-3" style={{ borderTop: '1px solid #EBEBEB' }}>
                <div className="flex justify-between text-sm">
                  <span style={{ color: '#6B6B6B' }}>Subtotal</span>
                  <span className="font-medium text-stone-900">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: '#6B6B6B' }}>Shipping</span>
                  <span className="font-medium text-stone-900">${shipping.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-base font-bold pt-2" style={{ borderTop: '1px solid #EBEBEB' }}>
                  <span className="text-stone-900">Total</span>
                  <span style={{ color: '#C4622D' }}>${total.toFixed(2)}</span>
                </div>
              </div>
              <button type="submit" disabled={submitting} className="mt-6 w-full py-3 px-4 text-sm font-semibold text-white rounded-lg transition disabled:opacity-50" style={{ backgroundColor: '#C4622D' }}>
                {submitting ? 'Placing order...' : 'Place Order'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
