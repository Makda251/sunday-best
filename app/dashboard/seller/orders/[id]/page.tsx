'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useParams } from 'next/navigation'
import Image from 'next/image'

export default function SellerOrderDetailPage() {
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [trackingNumber, setTrackingNumber] = useState('')
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showDeclineModal, setShowDeclineModal] = useState(false)
  const [cancellationReason, setCancellationReason] = useState('')
  const [makeProductsAvailable, setMakeProductsAvailable] = useState(true)
  const router = useRouter()
  const params = useParams()
  const supabase = createClient()

  useEffect(() => {
    const fetchOrder = async () => {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth/login')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profile?.role !== 'seller') {
        router.push('/')
        return
      }

      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          buyer:profiles!buyer_id(full_name, email, phone),
          order_items(*, product:products(*))
        `)
        .eq('id', params.id)
        .eq('seller_id', user.id)
        .single()

      if (error || !data) {
        router.push('/dashboard/seller')
        return
      }

      setOrder(data)
      setTrackingNumber(data.tracking_number || '')
      setLoading(false)
    }

    fetchOrder()
  }, [params.id, router, supabase])

  const validateTrackingNumber = (tracking: string): { valid: boolean; message?: string } => {
    const cleaned = tracking.trim().replace(/\s+/g, '')

    if (cleaned.length === 0) {
      return { valid: false, message: 'Please enter a tracking number' }
    }

    // USPS formats
    const uspsFormats = [
      /^\d{20}$/, // 20 digits
      /^\d{22}$/, // 22 digits
      /^(94|93|92|94|95)\d{20}$/, // USPS tracking (starts with 94, 93, 92, 95)
      /^(EA|EC|CP|RA|RB|RC|RR|RS|RT)\d{9}US$/, // International
    ]

    // UPS formats
    const upsFormats = [
      /^1Z[A-Z0-9]{16}$/, // Standard UPS
      /^\d{18}$/, // Alternative UPS format
    ]

    // FedEx formats
    const fedexFormats = [
      /^\d{12}$/, // FedEx Express
      /^\d{15}$/, // FedEx Ground
      /^\d{22}$/, // FedEx SmartPost
    ]

    // DHL formats
    const dhlFormats = [
      /^\d{10,11}$/, // DHL Express
    ]

    const allFormats = [...uspsFormats, ...upsFormats, ...fedexFormats, ...dhlFormats]
    const isValid = allFormats.some(format => format.test(cleaned))

    if (!isValid) {
      return {
        valid: false,
        message: 'Invalid tracking number format. Please verify the tracking number from your carrier (USPS, UPS, FedEx, or DHL).'
      }
    }

    return { valid: true }
  }

  const handleMarkAsShipped = async () => {
    const validation = validateTrackingNumber(trackingNumber)
    if (!validation.valid) {
      setError(validation.message || 'Invalid tracking number')
      return
    }

    setUpdating(true)
    setError(null)

    try {
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          status: 'shipped',
          tracking_number: trackingNumber,
          shipped_at: new Date().toISOString(),
        })
        .eq('id', order.id)

      if (updateError) {
        throw updateError
      }

      // Refresh order data
      const { data } = await supabase
        .from('orders')
        .select(`
          *,
          buyer:profiles!buyer_id(full_name, email, phone),
          order_items(*, product:products(*))
        `)
        .eq('id', params.id)
        .single()

      // Send shipping notification email to buyer
      if (data) {
        const firstItem = data.order_items?.[0]
        try {
          await fetch('/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'order-shipped',
              params: {
                to: data.buyer.email,
                buyerName: data.buyer.full_name || 'Customer',
                orderNumber: `#${data.id.slice(0, 8).toUpperCase()}`,
                productTitle: firstItem?.product_title + (data.order_items.length > 1 ? ` and ${data.order_items.length - 1} more` : ''),
                productImage: firstItem?.product_image,
                trackingNumber: trackingNumber,
                estimatedDelivery: '7-10 business days',
              },
            }),
          })
        } catch (emailError) {
          console.error('Failed to send shipping email:', emailError)
        }
      }

      setOrder(data)
      setUpdating(false)
    } catch (err: any) {
      setError(err.message)
      setUpdating(false)
    }
  }

  const handleDeclineOrder = async () => {
    if (!cancellationReason.trim()) {
      setError('Please provide a reason for declining this order')
      return
    }

    setUpdating(true)
    setError(null)

    try {
      // Update order status to cancelled with reason
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          status: 'cancelled',
          payment_status: 'rejected',
          cancellation_reason: cancellationReason,
        })
        .eq('id', order.id)

      if (updateError) {
        throw updateError
      }

      // Update product availability based on seller's choice
      const productIds = order.order_items?.map((item: any) => item.product_id) || []
      if (productIds.length > 0) {
        const { error: productError } = await supabase
          .from('products')
          .update({ is_active: makeProductsAvailable })
          .in('id', productIds)

        if (productError) {
          console.error('Error updating products:', productError)
        }
      }

      // Send cancellation email to buyer
      const firstItem = order.order_items?.[0]
      try {
        await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'order-cancelled',
            params: {
              to: order.buyer.email,
              buyerName: order.buyer.full_name || 'Customer',
              orderNumber: `#${order.id.slice(0, 8).toUpperCase()}`,
              productTitle: firstItem?.product_title + (order.order_items.length > 1 ? ` and ${order.order_items.length - 1} more` : ''),
              refundAmount: `$${order.total.toFixed(2)}`,
              reason: cancellationReason,
            },
          }),
        })
      } catch (emailError) {
        console.error('Failed to send cancellation email:', emailError)
      }

      // Redirect back to dashboard
      router.push('/dashboard/seller')
    } catch (err: any) {
      setError(err.message)
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#FFFFFF' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 mx-auto" style={{ borderColor: '#C4622D' }}></div>
          <p className="mt-4 text-sm" style={{ color: '#6B6B6B' }}>Loading order...</p>
        </div>
      </div>
    )
  }

  const statusStyle = (s: string) => {
    if (s === 'shipped') return { background: '#EDE9FE', color: '#6D28D9' }
    if (s === 'delivered') return { background: '#D1FAE5', color: '#065F46' }
    if (s === 'payment_verified' || s === 'processing') return { background: '#DBEAFE', color: '#1E40AF' }
    if (s === 'cancelled') return { background: '#FEE2E2', color: '#991B1B' }
    return { background: '#FEF3C7', color: '#92400E' }
  }

  return (
    <div className="min-h-screen py-8" style={{ backgroundColor: '#FFFFFF' }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-7">
          <button onClick={() => router.push('/dashboard/seller')} className="text-sm font-medium mb-3 block" style={{ color: '#C4622D' }}>
            ← Back to Dashboard
          </button>
          <h1 className="text-2xl font-bold" style={{ color: '#111111' }}>Order #{order.id.slice(0, 8).toUpperCase()}</h1>
        </div>

        {error && (
          <div className="rounded-xl p-4 mb-6" style={{ background: '#FFF0F0', border: '1px solid #FFCCCC' }}>
            <p className="text-sm" style={{ color: '#CC3333' }}>{error}</p>
          </div>
        )}

        {/* Order Status */}
        <div className="bg-white rounded-2xl p-6 mb-5" style={{ border: '1px solid #EBEBEB' }}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-base font-semibold" style={{ color: '#111111' }}>Order Status</h2>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold" style={statusStyle(order.status)}>
              {order.status.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
            </span>
          </div>

          <div className="space-y-2 text-sm" style={{ color: '#6B6B6B' }}>
            <div className="flex justify-between">
              <span>Payment Status</span>
              <span className="font-semibold" style={{ color: order.payment_status === 'verified' ? '#065F46' : order.payment_status === 'pending' ? '#92400E' : '#991B1B' }}>
                {order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Order Date</span>
              <span style={{ color: '#111111' }}>{new Date(order.created_at).toLocaleDateString()}</span>
            </div>
            {order.shipped_at && (
              <div className="flex justify-between">
                <span>Shipped Date</span>
                <span style={{ color: '#111111' }}>{new Date(order.shipped_at).toLocaleDateString()}</span>
              </div>
            )}
          </div>

          {/* Shipping Action */}
          {order.payment_status === 'verified' && order.status !== 'shipped' && order.status !== 'delivered' && order.status !== 'cancelled' && (
            <div className="mt-5 pt-5 space-y-4" style={{ borderTop: '1px solid #EBEBEB' }}>
              <div>
                <h3 className="text-sm font-semibold mb-1" style={{ color: '#111111' }}>Mark as Shipped</h3>
                <p className="text-xs mb-3" style={{ color: '#9A9A9A' }}>
                  Enter the tracking number from USPS, UPS, FedEx, or DHL.
                </p>
                <div className="flex gap-3">
                  <input
                    type="text"
                    placeholder="e.g., 1Z999AA10123456784"
                    className="flex-1 rounded-lg px-4 py-2.5 text-sm outline-none transition-all"
                    style={{ border: '1.5px solid #EBEBEB', background: '#F7F7F7', color: '#111111' }}
                    onFocus={e => { e.currentTarget.style.borderColor = '#C4622D'; e.currentTarget.style.background = '#fff' }}
                    onBlur={e => { e.currentTarget.style.borderColor = '#EBEBEB'; e.currentTarget.style.background = '#F7F7F7' }}
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                  />
                  <button
                    onClick={handleMarkAsShipped}
                    disabled={updating}
                    className="px-5 py-2.5 rounded-full text-sm font-semibold text-white disabled:opacity-50 transition-all whitespace-nowrap"
                    style={{ backgroundColor: '#C4622D' }}
                    onMouseEnter={e => { if (!updating) e.currentTarget.style.backgroundColor = '#A84F22' }}
                    onMouseLeave={e => { if (!updating) e.currentTarget.style.backgroundColor = '#C4622D' }}
                  >
                    {updating ? 'Updating...' : 'Mark as Shipped'}
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setShowDeclineModal(true)}
                  disabled={updating}
                  className="px-5 py-2 rounded-full text-sm font-semibold disabled:opacity-50 transition-all"
                  style={{ border: '1.5px solid #FFCCCC', color: '#CC3333', background: '#FFF0F0' }}
                >
                  Decline Order
                </button>
              </div>
            </div>
          )}

          {order.tracking_number && (
            <div className="mt-4 p-4 rounded-xl" style={{ background: '#F0F7FF', border: '1px solid #BFDBFE' }}>
              <p className="text-xs font-semibold mb-1" style={{ color: '#1E40AF' }}>Tracking Number</p>
              <p className="text-base font-mono font-bold" style={{ color: '#1E40AF' }}>{order.tracking_number}</p>
            </div>
          )}
        </div>

        {/* Order Items */}
        <div className="bg-white rounded-2xl p-6 mb-5" style={{ border: '1px solid #EBEBEB' }}>
          <h2 className="text-base font-semibold mb-4" style={{ color: '#111111' }}>Items to Ship</h2>
          <ul className="space-y-3">
            {order.order_items?.map((item: any) => (
              <li key={item.id} className="flex items-center gap-4 p-3 rounded-xl" style={{ background: '#F7F7F7' }}>
                <div className="flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden" style={{ background: '#EBEBEB' }}>
                  {item.product_image ? (
                    <Image src={item.product_image} alt={item.product_title} width={64} height={64} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs" style={{ color: '#9A9A9A' }}>No image</div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold" style={{ color: '#111111' }}>{item.product_title}</p>
                  <p className="text-xs mt-0.5" style={{ color: '#6B6B6B' }}>Qty: {item.quantity}</p>
                </div>
                <p className="text-sm font-bold" style={{ color: '#111111' }}>${item.product_price}</p>
              </li>
            ))}
          </ul>

          <div className="mt-5 pt-4 space-y-2" style={{ borderTop: '1px solid #EBEBEB' }}>
            <div className="flex justify-between text-sm">
              <span style={{ color: '#6B6B6B' }}>Subtotal</span>
              <span style={{ color: '#111111' }}>${order.subtotal}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span style={{ color: '#6B6B6B' }}>Shipping (Buyer Paid)</span>
              <span style={{ color: '#065F46' }}>+${order.shipping_cost}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span style={{ color: '#6B6B6B' }}>Platform Fee (10%)</span>
              <span style={{ color: '#991B1B' }}>-${order.platform_fee}</span>
            </div>
            <div className="flex justify-between text-sm font-bold pt-2" style={{ borderTop: '1px solid #EBEBEB', color: '#111111' }}>
              <span>You Receive</span>
              <span style={{ color: '#065F46' }}>${(order.subtotal + order.shipping_cost - order.platform_fee).toFixed(2)}</span>
            </div>
            <div className="mt-3 p-3 rounded-xl text-xs" style={{ background: '#F0F7FF', border: '1px solid #BFDBFE', color: '#1E40AF' }}>
              We will send you ${(order.subtotal + order.shipping_cost - order.platform_fee).toFixed(2)} via Zelle, including the ${order.shipping_cost} shipping cost the buyer paid. You are responsible for shipping the item.
            </div>
          </div>
        </div>

        {/* Buyer & Shipping Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-white rounded-2xl p-6" style={{ border: '1px solid #EBEBEB' }}>
            <h2 className="text-base font-semibold mb-3" style={{ color: '#111111' }}>Buyer Information</h2>
            <div className="text-sm space-y-0.5">
              <p className="font-semibold" style={{ color: '#111111' }}>{order.buyer?.full_name || 'Anonymous'}</p>
              <p style={{ color: '#6B6B6B' }}>{order.buyer?.email}</p>
              {order.buyer?.phone && <p style={{ color: '#6B6B6B' }}>{order.buyer.phone}</p>}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6" style={{ border: '1px solid #EBEBEB' }}>
            <h2 className="text-base font-semibold mb-3" style={{ color: '#111111' }}>Shipping Address</h2>
            <address className="text-sm not-italic space-y-0.5" style={{ color: '#6B6B6B' }}>
              <p>{order.shipping_address_line1}</p>
              {order.shipping_address_line2 && <p>{order.shipping_address_line2}</p>}
              <p>{order.shipping_city}, {order.shipping_state} {order.shipping_zip}</p>
              <p>{order.shipping_country}</p>
            </address>
          </div>
        </div>
      </div>

      {/* Decline Order Modal */}
      {showDeclineModal && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-7" style={{ border: '1px solid #EBEBEB' }}>
            <h3 className="text-lg font-bold mb-1.5" style={{ color: '#111111' }}>Decline Order</h3>
            <p className="text-sm mb-5" style={{ color: '#6B6B6B' }}>Please provide a reason for declining. The buyer will be notified.</p>

            <div className="mb-4">
              <label htmlFor="cancellation-reason" className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: '#6B6B6B' }}>
                Reason <span style={{ color: '#C4622D' }}>*</span>
              </label>
              <textarea
                id="cancellation-reason"
                rows={4}
                className="block w-full px-4 py-2.5 rounded-lg text-sm outline-none transition-all resize-none"
                style={{ border: '1.5px solid #EBEBEB', background: '#F7F7F7', color: '#111111' }}
                onFocus={e => { e.currentTarget.style.borderColor = '#C4622D'; e.currentTarget.style.background = '#fff' }}
                onBlur={e => { e.currentTarget.style.borderColor = '#EBEBEB'; e.currentTarget.style.background = '#F7F7F7' }}
                placeholder="e.g., Item damaged, currently traveling, personal emergency..."
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
              />
            </div>

            <div className="mb-5">
              <label className="block text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: '#6B6B6B' }}>Product Availability</label>
              <div className="space-y-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="radio" name="product-availability" checked={makeProductsAvailable} onChange={() => setMakeProductsAvailable(true)} className="mt-0.5" />
                  <div>
                    <span className="text-sm font-semibold" style={{ color: '#111111' }}>Make products available again</span>
                    <p className="text-xs mt-0.5" style={{ color: '#9A9A9A' }}>Choose this if you can fulfill the order later</p>
                  </div>
                </label>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="radio" name="product-availability" checked={!makeProductsAvailable} onChange={() => setMakeProductsAvailable(false)} className="mt-0.5" />
                  <div>
                    <span className="text-sm font-semibold" style={{ color: '#111111' }}>Keep products unavailable</span>
                    <p className="text-xs mt-0.5" style={{ color: '#9A9A9A' }}>Choose this if the item is permanently unavailable</p>
                  </div>
                </label>
              </div>
            </div>

            {error && (
              <div className="mb-4 rounded-xl p-3" style={{ background: '#FFF0F0', border: '1px solid #FFCCCC' }}>
                <p className="text-sm" style={{ color: '#CC3333' }}>{error}</p>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={() => { setShowDeclineModal(false); setCancellationReason(''); setMakeProductsAvailable(true); setError(null) }}
                disabled={updating}
                className="px-5 py-2 rounded-full text-sm font-semibold disabled:opacity-50 transition-all"
                style={{ border: '1.5px solid #D4D4D4', color: '#6B6B6B' }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeclineOrder}
                disabled={updating}
                className="px-5 py-2 rounded-full text-sm font-semibold text-white disabled:opacity-50 transition-all"
                style={{ backgroundColor: '#CC3333' }}
              >
                {updating ? 'Declining...' : 'Decline Order'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
