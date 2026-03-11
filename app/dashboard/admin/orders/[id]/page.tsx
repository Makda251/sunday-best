'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useParams } from 'next/navigation'
import Image from 'next/image'

export default function AdminOrderDetailPage() {
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)
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

      if (profile?.role !== 'admin') {
        router.push('/')
        return
      }

      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          buyer:profiles!buyer_id(full_name, email, phone),
          seller:profiles!seller_id(full_name, email, phone),
          order_items(*, product:products(*))
        `)
        .eq('id', params.id)
        .single()

      if (error || !data) {
        router.push('/dashboard/admin')
        return
      }

      setOrder(data)
      setLoading(false)
    }

    fetchOrder()
  }, [params.id, router, supabase])

  const handleVerifyPayment = async () => {
    setUpdating(true)
    setError(null)

    try {
      // Update order status
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          payment_status: 'verified',
          payment_verified_at: new Date().toISOString(),
          status: 'payment_verified',
        })
        .eq('id', order.id)

      if (updateError) {
        throw updateError
      }

      // Mark all products in this order as inactive (sold)
      const productIds = order.order_items?.map((item: any) => item.product_id) || []
      if (productIds.length > 0) {
        const { error: productError } = await supabase
          .from('products')
          .update({ is_active: false })
          .in('id', productIds)

        if (productError) {
          console.error('Error marking products as sold:', productError)
        }
      }

      // Refresh order data
      const { data } = await supabase
        .from('orders')
        .select(`
          *,
          buyer:profiles!buyer_id(full_name, email, phone),
          seller:profiles!seller_id(full_name, email, phone),
          order_items(*, product:products(*))
        `)
        .eq('id', params.id)
        .single()

      // Send payment verified email to buyer
      if (data) {
        const firstItem = data.order_items?.[0]
        try {
          await fetch('/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'payment-verified',
              params: {
                to: data.buyer.email,
                buyerName: data.buyer.full_name || 'Customer',
                orderNumber: `#${data.id.slice(0, 8).toUpperCase()}`,
                productTitle: firstItem?.product_title + (data.order_items.length > 1 ? ` and ${data.order_items.length - 1} more` : ''),
                productImage: firstItem?.product_image,
                estimatedDelivery: 'within 7-10 business days',
              },
            }),
          })
        } catch (emailError) {
          console.error('Failed to send payment verified email:', emailError)
        }
      }

      setOrder(data)
      setUpdating(false)
    } catch (err: any) {
      setError(err.message)
      setUpdating(false)
    }
  }

  const handleRejectPayment = async () => {
    const reason = prompt('Please provide a reason for rejecting this payment:')
    if (!reason || !reason.trim()) return

    const confirmed = confirm('Are you sure you want to reject this payment? This action cannot be undone.')
    if (!confirmed) return

    setUpdating(true)
    setError(null)

    try {
      const { error: updateError} = await supabase
        .from('orders')
        .update({
          payment_status: 'rejected',
          status: 'cancelled',
          cancellation_reason: reason,
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
          seller:profiles!seller_id(full_name, email, phone),
          order_items(*, product:products(*))
        `)
        .eq('id', params.id)
        .single()

      // Send cancellation email to buyer
      if (data) {
        const firstItem = data.order_items?.[0]
        try {
          await fetch('/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'order-cancelled',
              params: {
                to: data.buyer.email,
                buyerName: data.buyer.full_name || 'Customer',
                orderNumber: `#${data.id.slice(0, 8).toUpperCase()}`,
                productTitle: firstItem?.product_title + (data.order_items.length > 1 ? ` and ${data.order_items.length - 1} more` : ''),
                refundAmount: `$${data.total.toFixed(2)}`,
                reason: reason,
              },
            }),
          })
        } catch (emailError) {
          console.error('Failed to send cancellation email:', emailError)
        }
      }

      setOrder(data)
      setUpdating(false)
    } catch (err: any) {
      setError(err.message)
      setUpdating(false)
    }
  }

  const handleMarkAsRefunded = async () => {
    const refundNotes = prompt('Add any notes about this refund (optional):')

    setUpdating(true)
    setError(null)

    try {
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          refunded_at: new Date().toISOString(),
          refund_notes: refundNotes || null,
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
          seller:profiles!seller_id(full_name, email, phone),
          order_items(*, product:products(*))
        `)
        .eq('id', params.id)
        .single()

      setOrder(data)
      setUpdating(false)
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

  return (
    <div className="min-h-screen py-8" style={{ backgroundColor: '#FFFFFF' }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-7">
          <button onClick={() => router.push('/dashboard/admin')} className="text-sm font-medium mb-3 block" style={{ color: '#C4622D' }}>
            ← Back to Dashboard
          </button>
          <h1 className="text-2xl font-bold" style={{ color: '#111111' }}>Order #{order.id.slice(0, 8).toUpperCase()}</h1>
        </div>

        {error && (
          <div className="rounded-xl p-4 mb-6" style={{ background: '#FFF0F0', border: '1px solid #FFCCCC' }}>
            <p className="text-sm" style={{ color: '#CC3333' }}>{error}</p>
          </div>
        )}

        {/* Payment Verification */}
        {order.payment_status === 'pending' && (
          <div className="rounded-2xl p-6 mb-5" style={{ background: '#FFFBEB', border: '1px solid #FDE68A' }}>
            <h2 className="text-base font-bold mb-2" style={{ color: '#92400E' }}>Payment Verification Required</h2>
            <p className="text-sm mb-4" style={{ color: '#92400E' }}>Review the payment screenshot and verify the payment has been received in your Zelle account.</p>
            <div className="flex gap-3">
              <button onClick={handleVerifyPayment} disabled={updating}
                className="px-5 py-2 text-sm font-semibold text-white rounded-full disabled:opacity-50 transition-all"
                style={{ backgroundColor: '#16A34A' }}
                onMouseEnter={e => { if (!updating) e.currentTarget.style.backgroundColor = '#15803D' }}
                onMouseLeave={e => { if (!updating) e.currentTarget.style.backgroundColor = '#16A34A' }}
              >
                {updating ? 'Processing...' : 'Verify Payment'}
              </button>
              <button onClick={handleRejectPayment} disabled={updating}
                className="px-5 py-2 text-sm font-semibold rounded-full disabled:opacity-50 transition-all"
                style={{ border: '1.5px solid #FFCCCC', color: '#CC3333', background: '#FFF0F0' }}
              >
                Reject Payment
              </button>
            </div>
          </div>
        )}

        {/* Order Info */}
        <div className="bg-white rounded-2xl p-6 mb-5" style={{ border: '1px solid #EBEBEB' }}>
          <h2 className="text-base font-semibold mb-4" style={{ color: '#111111' }}>Order Information</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span style={{ color: '#6B6B6B' }}>Order Date</span>
              <p className="font-semibold mt-0.5" style={{ color: '#111111' }}>{new Date(order.created_at).toLocaleString()}</p>
            </div>
            <div>
              <span style={{ color: '#6B6B6B' }}>Order Status</span>
              <p className="font-semibold mt-0.5 capitalize" style={{ color: '#111111' }}>{order.status.replace(/_/g, ' ')}</p>
            </div>
            <div>
              <span style={{ color: '#6B6B6B' }}>Payment Status</span>
              <p className="font-semibold mt-0.5" style={{ color: order.payment_status === 'verified' ? '#065F46' : order.payment_status === 'pending' ? '#92400E' : '#991B1B' }}>
                {order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
              </p>
            </div>
            <div>
              <span style={{ color: '#6B6B6B' }}>Payment Method</span>
              <p className="font-semibold mt-0.5 uppercase" style={{ color: '#111111' }}>{order.payment_method}</p>
            </div>
            {order.tracking_number && (
              <div className="col-span-2">
                <span style={{ color: '#6B6B6B' }}>Tracking Number</span>
                <p className="font-semibold font-mono mt-0.5" style={{ color: '#111111' }}>{order.tracking_number}</p>
              </div>
            )}
          </div>
          {order.cancellation_reason && (
            <div className="mt-5 p-4 rounded-xl" style={{ background: '#FFF0F0', border: '1px solid #FFCCCC' }}>
              <h3 className="text-xs font-semibold mb-1" style={{ color: '#CC3333' }}>Cancellation Reason</h3>
              <p className="text-sm" style={{ color: '#CC3333' }}>{order.cancellation_reason}</p>
            </div>
          )}
        </div>

        {/* Payment Screenshot */}
        {order.payment_screenshot_url && (
          <div className="bg-white rounded-2xl p-6 mb-5" style={{ border: '1px solid #EBEBEB' }}>
            <h2 className="text-base font-semibold mb-4" style={{ color: '#111111' }}>Payment Screenshot</h2>
            <div className="max-w-md">
              <Image src={order.payment_screenshot_url} alt="Payment screenshot" width={400} height={300} className="rounded-xl" style={{ border: '1px solid #EBEBEB' }} />
            </div>
          </div>
        )}

        {/* Order Items */}
        <div className="bg-white rounded-2xl p-6 mb-5" style={{ border: '1px solid #EBEBEB' }}>
          <h2 className="text-base font-semibold mb-4" style={{ color: '#111111' }}>Order Items</h2>
          <ul className="space-y-3">
            {order.order_items?.map((item: any) => (
              <li key={item.id} className="flex items-center gap-4 p-3 rounded-xl" style={{ background: '#F7F7F7' }}>
                <div className="flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden" style={{ background: '#EBEBEB' }}>
                  {item.product_image ? (
                    <Image
                      src={item.product_image}
                      alt={item.product_title}
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#9A9A9A] text-xs">
                      No image
                    </div>
                  )}
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-base font-medium text-[#111111]">{item.product_title}</p>
                  <p className="text-sm text-[#9A9A9A]">Quantity: {item.quantity}</p>
                </div>
                <p className="text-base font-medium text-[#111111]">${item.product_price}</p>
              </li>
            ))}
          </ul>

          <div className="mt-6 border-t pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-[#6B6B6B]">Subtotal</span>
              <span className="font-medium text-[#111111]">${order.subtotal}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#6B6B6B]">Shipping</span>
              <span className="font-medium text-[#111111]">${order.shipping_cost}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#6B6B6B]">Platform Fee (10%)</span>
              <span className="font-medium text-green-600">${order.platform_fee}</span>
            </div>
            <div className="border-t pt-2 flex justify-between text-base font-medium">
              <span className="text-[#111111]">Total Paid</span>
              <span className="text-[#111111]">${order.total}</span>
            </div>
          </div>
        </div>

        {/* Customer Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl p-6">
            <h2 className="text-lg font-medium text-[#111111] mb-4">Buyer</h2>
            <div className="text-sm space-y-1">
              <p className="font-medium text-[#111111]">{order.buyer?.full_name}</p>
              <p className="text-[#6B6B6B]">{order.buyer?.email}</p>
              {order.buyer?.phone && <p className="text-[#6B6B6B]">{order.buyer.phone}</p>}
            </div>

            {/* Buyer Zelle Info for Refunds */}
            {(order.buyer_zelle_email || order.buyer_zelle_phone || order.buyer_zelle_name) && (
              <div className="mt-4 pt-4 border-t border-[#EBEBEB]">
                <h3 className="text-sm font-medium text-[#111111] mb-2">Zelle Info (for verification & refunds)</h3>
                <div className="text-sm space-y-1">
                  {order.buyer_zelle_name && (
                    <p className="text-[#6B6B6B]">
                      <span className="font-medium">Name on Zelle:</span> {order.buyer_zelle_name}
                    </p>
                  )}
                  {order.buyer_zelle_email && (
                    <p className="text-[#6B6B6B]">
                      <span className="font-medium">Email:</span> {order.buyer_zelle_email}
                    </p>
                  )}
                  {order.buyer_zelle_phone && (
                    <p className="text-[#6B6B6B]">
                      <span className="font-medium">Phone:</span> {order.buyer_zelle_phone}
                    </p>
                  )}
                </div>

                {/* Refund Tracking */}
                {order.status === 'cancelled' && !order.refunded_at && (
                  <button
                    onClick={handleMarkAsRefunded}
                    disabled={updating}
                    className="mt-3 w-full px-3 py-2 text-sm font-semibold text-white rounded-full disabled:opacity-50 transition-all"
                    style={{ backgroundColor: '#16A34A' }}
                    onMouseEnter={e => { if (!updating) e.currentTarget.style.backgroundColor = '#15803D' }}
                    onMouseLeave={e => { if (!updating) e.currentTarget.style.backgroundColor = '#16A34A' }}
                  >
                    Mark as Refunded
                  </button>
                )}

                {order.refunded_at && (
                  <div className="mt-3 p-3 rounded-xl" style={{ background: '#F0FFF4', border: '1px solid #BBF7D0' }}>
                    <p className="text-sm font-semibold" style={{ color: '#166534' }}>✓ Refunded</p>
                    <p className="text-xs mt-1" style={{ color: '#166534' }}>{new Date(order.refunded_at).toLocaleString()}</p>
                    {order.refund_notes && <p className="text-xs mt-1 italic" style={{ color: '#166534' }}>{order.refund_notes}</p>}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl p-6" style={{ border: '1px solid #EBEBEB' }}>
            <h2 className="text-base font-semibold mb-3" style={{ color: '#111111' }}>Seller</h2>
            <div className="text-sm space-y-0.5">
              <p className="font-semibold" style={{ color: '#111111' }}>{order.seller?.full_name}</p>
              <p style={{ color: '#6B6B6B' }}>{order.seller?.email}</p>
              {order.seller?.phone && <p style={{ color: '#6B6B6B' }}>{order.seller.phone}</p>}
            </div>
          </div>
        </div>

        {/* Shipping Address */}
        <div className="bg-white rounded-2xl p-6 mt-5" style={{ border: '1px solid #EBEBEB' }}>
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
  )
}
