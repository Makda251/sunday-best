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

  const handleMarkAsShipped = async () => {
    if (!trackingNumber.trim()) {
      setError('Please enter a tracking number')
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

      // Redirect back to dashboard
      router.push('/dashboard/seller')
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
            onClick={() => router.push('/dashboard/seller')}
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

        {/* Order Status */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-900">Order Status</h2>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              order.status === 'pending_payment' ? 'bg-yellow-100 text-yellow-800' :
              order.status === 'payment_verified' ? 'bg-blue-100 text-blue-800' :
              order.status === 'shipped' ? 'bg-purple-100 text-purple-800' :
              order.status === 'delivered' ? 'bg-green-100 text-green-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {order.status.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
            </span>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Payment Status:</span>
              <span className={`font-medium ${
                order.payment_status === 'verified' ? 'text-green-600' :
                order.payment_status === 'pending' ? 'text-yellow-600' :
                'text-red-600'
              }`}>
                {order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Order Date:</span>
              <span className="text-gray-900">{new Date(order.created_at).toLocaleDateString()}</span>
            </div>
            {order.shipped_at && (
              <div className="flex justify-between">
                <span className="text-gray-600">Shipped Date:</span>
                <span className="text-gray-900">{new Date(order.shipped_at).toLocaleDateString()}</span>
              </div>
            )}
          </div>

          {/* Shipping Action */}
          {order.payment_status === 'verified' && order.status !== 'shipped' && order.status !== 'delivered' && order.status !== 'cancelled' && (
            <div className="mt-6 border-t pt-6 space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-4">Mark as Shipped</h3>
                <div className="flex space-x-4">
                  <input
                    type="text"
                    placeholder="Enter tracking number"
                    className="flex-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                  />
                  <button
                    onClick={handleMarkAsShipped}
                    disabled={updating}
                    className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    {updating ? 'Updating...' : 'Mark as Shipped'}
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setShowDeclineModal(true)}
                  disabled={updating}
                  className="px-4 py-2 border border-red-300 rounded-lg shadow-sm text-sm font-semibold text-red-700 bg-white hover:bg-red-50 transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                >
                  Decline Order
                </button>
              </div>
            </div>
          )}

          {order.tracking_number && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm font-medium text-blue-900">Tracking Number:</p>
              <p className="text-lg font-mono text-blue-700">{order.tracking_number}</p>
            </div>
          )}
        </div>

        {/* Order Items */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Items to Ship</h2>
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
              <span className="text-gray-600">Subtotal (Your Product)</span>
              <span className="font-medium text-gray-900">${order.subtotal}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Shipping (Buyer Paid)</span>
              <span className="font-medium text-blue-600">+${order.shipping_cost}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Platform Fee (10%)</span>
              <span className="font-medium text-red-600">-${order.platform_fee}</span>
            </div>
            <div className="border-t pt-2 flex justify-between text-base font-medium">
              <span className="text-gray-900">You Receive (After Shipping)</span>
              <span className="text-green-600">${(order.subtotal + order.shipping_cost - order.platform_fee).toFixed(2)}</span>
            </div>
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-800">
                <strong>Note:</strong> We will send you ${(order.subtotal + order.shipping_cost - order.platform_fee).toFixed(2)} via Zelle.
                This includes the ${order.shipping_cost} shipping cost that the buyer paid.
                You are responsible for shipping the item to the buyer.
              </p>
            </div>
          </div>
        </div>

        {/* Buyer & Shipping Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Buyer Information</h2>
            <div className="text-sm space-y-1">
              <p className="font-medium text-gray-900">{order.buyer?.full_name || 'Anonymous'}</p>
              <p className="text-gray-600">{order.buyer?.email}</p>
              {order.buyer?.phone && (
                <p className="text-gray-600">{order.buyer.phone}</p>
              )}
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
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

      {/* Decline Order Modal */}
      {showDeclineModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Decline Order</h3>
              <p className="mt-2 text-sm text-gray-600">
                Please provide a reason for declining this order. The buyer will be notified.
              </p>
            </div>

            <div className="mb-4">
              <label htmlFor="cancellation-reason" className="block text-sm font-medium text-gray-700 mb-2">
                Reason for cancellation <span className="text-red-600">*</span>
              </label>
              <textarea
                id="cancellation-reason"
                rows={4}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="e.g., Item damaged, currently traveling, personal emergency, etc."
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Product Availability
              </label>
              <div className="space-y-3">
                <label className="flex items-start cursor-pointer">
                  <input
                    type="radio"
                    name="product-availability"
                    checked={makeProductsAvailable}
                    onChange={() => setMakeProductsAvailable(true)}
                    className="mt-0.5 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                  />
                  <div className="ml-3">
                    <span className="text-sm font-medium text-gray-900">Make products available again</span>
                    <p className="text-xs text-gray-500">Choose this if you can fulfill the order later (e.g., traveling, temporary issue)</p>
                  </div>
                </label>
                <label className="flex items-start cursor-pointer">
                  <input
                    type="radio"
                    name="product-availability"
                    checked={!makeProductsAvailable}
                    onChange={() => setMakeProductsAvailable(false)}
                    className="mt-0.5 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                  />
                  <div className="ml-3">
                    <span className="text-sm font-medium text-gray-900">Keep products unavailable</span>
                    <p className="text-xs text-gray-500">Choose this if the item is permanently unavailable (e.g., damaged, sold elsewhere)</p>
                  </div>
                </label>
              </div>
            </div>

            {error && (
              <div className="mb-4 rounded-md bg-red-50 p-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeclineModal(false)
                  setCancellationReason('')
                  setMakeProductsAvailable(true)
                  setError(null)
                }}
                disabled={updating}
                className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeclineOrder}
                disabled={updating}
                className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 transition"
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
