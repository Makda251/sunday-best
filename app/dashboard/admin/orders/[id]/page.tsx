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

      setOrder(data)
      setUpdating(false)
    } catch (err: any) {
      setError(err.message)
      setUpdating(false)
    }
  }

  const handleRejectPayment = async () => {
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading order...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <button
            onClick={() => router.push('/dashboard/admin')}
            className="text-sm text-indigo-600 hover:text-indigo-500 mb-4"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Order #{order.id.slice(0, 8)}</h1>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4 mb-6">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Payment Verification */}
        {order.payment_status === 'pending' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-medium text-yellow-900 mb-4">Payment Verification Required</h2>
            <p className="text-sm text-yellow-700 mb-4">
              Review the payment screenshot and verify the payment has been received in your Zelle account.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={handleVerifyPayment}
                disabled={updating}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
              >
                {updating ? 'Processing...' : 'Verify Payment'}
              </button>
              <button
                onClick={handleRejectPayment}
                disabled={updating}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
              >
                Reject Payment
              </button>
            </div>
          </div>
        )}

        {/* Order Status */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Order Information</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Order Date:</span>
              <p className="font-medium text-gray-900">{new Date(order.created_at).toLocaleString()}</p>
            </div>
            <div>
              <span className="text-gray-600">Order Status:</span>
              <p className="font-medium text-gray-900 capitalize">{order.status.replace(/_/g, ' ')}</p>
            </div>
            <div>
              <span className="text-gray-600">Payment Status:</span>
              <p className={`font-medium ${
                order.payment_status === 'verified' ? 'text-green-600' :
                order.payment_status === 'pending' ? 'text-yellow-600' :
                'text-red-600'
              }`}>
                {order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
              </p>
            </div>
            <div>
              <span className="text-gray-600">Payment Method:</span>
              <p className="font-medium text-gray-900 uppercase">{order.payment_method}</p>
            </div>
            {order.tracking_number && (
              <div className="col-span-2">
                <span className="text-gray-600">Tracking Number:</span>
                <p className="font-medium font-mono text-gray-900">{order.tracking_number}</p>
              </div>
            )}
          </div>

          {/* Cancellation Reason */}
          {order.cancellation_reason && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <h3 className="text-sm font-medium text-red-900 mb-2">Cancellation Reason</h3>
              <p className="text-sm text-red-700">{order.cancellation_reason}</p>
            </div>
          )}
        </div>

        {/* Payment Screenshot */}
        {order.payment_screenshot_url && (
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Payment Screenshot</h2>
            <div className="max-w-md">
              <Image
                src={order.payment_screenshot_url}
                alt="Payment screenshot"
                width={400}
                height={300}
                className="rounded border"
              />
            </div>
          </div>
        )}

        {/* Order Items */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Order Items</h2>
          <ul className="divide-y divide-gray-200">
            {order.order_items?.map((item: any) => (
              <li key={item.id} className="py-4 flex items-center">
                <div className="flex-shrink-0 w-20 h-20 bg-gray-200 rounded-md overflow-hidden">
                  {item.product_image ? (
                    <Image
                      src={item.product_image}
                      alt={item.product_title}
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                      No image
                    </div>
                  )}
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-base font-medium text-gray-900">{item.product_title}</p>
                  <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                </div>
                <p className="text-base font-medium text-gray-900">${item.product_price}</p>
              </li>
            ))}
          </ul>

          <div className="mt-6 border-t pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-medium text-gray-900">${order.subtotal}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Shipping</span>
              <span className="font-medium text-gray-900">${order.shipping_cost}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Platform Fee (10%)</span>
              <span className="font-medium text-green-600">${order.platform_fee}</span>
            </div>
            <div className="border-t pt-2 flex justify-between text-base font-medium">
              <span className="text-gray-900">Total Paid</span>
              <span className="text-gray-900">${order.total}</span>
            </div>
          </div>
        </div>

        {/* Customer Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Buyer</h2>
            <div className="text-sm space-y-1">
              <p className="font-medium text-gray-900">{order.buyer?.full_name}</p>
              <p className="text-gray-600">{order.buyer?.email}</p>
              {order.buyer?.phone && <p className="text-gray-600">{order.buyer.phone}</p>}
            </div>

            {/* Buyer Zelle Info for Refunds */}
            {(order.buyer_zelle_email || order.buyer_zelle_phone) && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-900 mb-2">Zelle Info (for refunds)</h3>
                <div className="text-sm space-y-1">
                  {order.buyer_zelle_email && (
                    <p className="text-gray-600">
                      <span className="font-medium">Email:</span> {order.buyer_zelle_email}
                    </p>
                  )}
                  {order.buyer_zelle_phone && (
                    <p className="text-gray-600">
                      <span className="font-medium">Phone:</span> {order.buyer_zelle_phone}
                    </p>
                  )}
                </div>

                {/* Refund Tracking */}
                {order.status === 'cancelled' && !order.refunded_at && (
                  <button
                    onClick={handleMarkAsRefunded}
                    disabled={updating}
                    className="mt-3 w-full px-3 py-2 border border-transparent rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 transition"
                  >
                    Mark as Refunded
                  </button>
                )}

                {order.refunded_at && (
                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm font-medium text-green-900">✓ Refunded</p>
                    <p className="text-xs text-green-700 mt-1">{new Date(order.refunded_at).toLocaleString()}</p>
                    {order.refund_notes && (
                      <p className="text-xs text-green-700 mt-1 italic">{order.refund_notes}</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Seller</h2>
            <div className="text-sm space-y-1">
              <p className="font-medium text-gray-900">{order.seller?.full_name}</p>
              <p className="text-gray-600">{order.seller?.email}</p>
              {order.seller?.phone && <p className="text-gray-600">{order.seller.phone}</p>}
            </div>
          </div>
        </div>

        {/* Shipping Address */}
        <div className="bg-white shadow rounded-lg p-6 mt-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Shipping Address</h2>
          <address className="text-sm text-gray-600 not-italic">
            {order.shipping_address_line1}<br />
            {order.shipping_address_line2 && <>{order.shipping_address_line2}<br /></>}
            {order.shipping_city}, {order.shipping_state} {order.shipping_zip}<br />
            {order.shipping_country}
          </address>
        </div>
      </div>
    </div>
  )
}
