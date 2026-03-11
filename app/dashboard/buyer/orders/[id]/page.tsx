'use client'

import { use, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

type OrderDetails = {
  id: string
  order_number: string
  created_at: string
  status: string
  payment_status: string
  subtotal: number
  shipping_cost: number
  total: number
  tracking_number: string | null
  shipping_address_line1: string
  shipping_address_line2: string | null
  shipping_city: string
  shipping_state: string
  shipping_zip: string
  shipping_country: string
  order_items: {
    product_id: string
    product_title: string
    product_price: number
    product_image: string | null
  }[]
  seller: {
    full_name: string
    email: string
    phone: string | null
  }
}

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [order, setOrder] = useState<OrderDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const fetchOrder = async () => {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth/login')
        return
      }

      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items(
            product_id,
            product_title,
            product_price,
            product_image
          ),
          seller:profiles!orders_seller_id_fkey(full_name, email, phone)
        `)
        .eq('id', id)
        .eq('buyer_id', user.id)
        .single()

      if (error || !data) {
        console.error('Error fetching order:', error)
        router.push('/dashboard/buyer/orders')
        return
      }

      setOrder(data as unknown as OrderDetails)
      setLoading(false)
    }

    fetchOrder()
  }, [id, router, supabase])

  const getStatusStyle = (status: string, paymentStatus: string): React.CSSProperties => {
    if (status === 'cancelled') return { background: '#FEE2E2', color: '#991B1B' }
    if (status === 'delivered') return { background: '#D1FAE5', color: '#065F46' }
    if (status === 'shipped') return { background: '#EDE9FE', color: '#6D28D9' }
    if (paymentStatus === 'verified') return { background: '#DBEAFE', color: '#1E40AF' }
    return { background: '#FEF3C7', color: '#92400E' }
  }

  const getStatusText = (status: string, paymentStatus: string) => {
    if (status === 'cancelled') return 'Cancelled'
    if (status === 'delivered') return 'Delivered'
    if (status === 'shipped') return 'Shipped'
    if (paymentStatus === 'verified') return 'Processing – Seller will ship soon'
    if (paymentStatus === 'pending') return 'Pending Payment Verification'
    return status
  }

  if (loading || !order) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 mx-auto" style={{ borderColor: '#C4622D' }}></div>
          <p className="mt-4 text-[#6B6B6B]">Loading order details...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <Link href="/dashboard/buyer/orders" className="font-medium text-sm mb-4 inline-block" style={{ color: '#C4622D' }}>
            ← Back to Orders
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[#111111]">Order {order.order_number}</h1>
              <p className="mt-1 text-sm text-[#9A9A9A]">
                Placed on {new Date(order.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
            <span className="mt-4 sm:mt-0 px-4 py-2 rounded-full text-sm font-semibold" style={getStatusStyle(order.status, order.payment_status)}>
              {getStatusText(order.status, order.payment_status)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Product */}
            <div className="bg-white rounded-2xl p-6" style={{ border: '1px solid #EBEBEB' }}>
              <h2 className="text-lg font-semibold text-[#111111] mb-4">Order Items</h2>
              <div className="flex gap-4">
                {order.order_items[0]?.product_image && (
                  <div className="flex-shrink-0">
                    <Image
                      src={order.order_items[0].product_image}
                      alt={order.order_items[0].product_title}
                      width={120}
                      height={120}
                      className="rounded-lg object-cover"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-[#111111]">{order.order_items[0]?.product_title}</h3>
                  <p className="text-lg font-bold text-[#111111] mt-2">${order.order_items[0]?.product_price.toFixed(2)}</p>
                </div>
              </div>
            </div>

            {/* Tracking */}
            {order.tracking_number && (
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-3">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h2 className="text-lg font-semibold text-blue-900">Tracking Information</h2>
                </div>
                <p className="text-sm text-blue-700 mb-2">Your order has been shipped!</p>
                <p className="text-xs font-semibold text-blue-900 mb-1">Tracking Number:</p>
                <p className="text-sm font-mono bg-white px-3 py-2 rounded text-blue-900 border border-blue-200">
                  {order.tracking_number}
                </p>
              </div>
            )}

            {/* Shipping Address */}
            <div className="bg-white rounded-2xl p-6" style={{ border: '1px solid #EBEBEB' }}>
              <h2 className="text-lg font-semibold text-[#111111] mb-4">Shipping Address</h2>
              <address className="text-[#6B6B6B] not-italic">
                {order.shipping_address_line1}<br />
                {order.shipping_address_line2 && <>{order.shipping_address_line2}<br /></>}
                {order.shipping_city}, {order.shipping_state} {order.shipping_zip}<br />
                {order.shipping_country}
              </address>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Order Summary */}
            <div className="bg-white rounded-2xl p-6" style={{ border: '1px solid #EBEBEB' }}>
              <h2 className="text-lg font-semibold text-[#111111] mb-4">Order Summary</h2>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[#6B6B6B]">Subtotal</span>
                  <span className="text-[#111111]">${order.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#6B6B6B]">Shipping</span>
                  <span className="text-[#111111]">${order.shipping_cost.toFixed(2)}</span>
                </div>
                <div className="pt-2 mt-2" style={{ borderTop: '1px solid #EBEBEB' }}>
                  <div className="flex justify-between">
                    <span className="font-semibold text-[#111111]">Total</span>
                    <span className="font-bold text-xl text-[#111111]">${order.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Seller Info */}
            <div className="bg-white rounded-2xl p-6" style={{ border: '1px solid #EBEBEB' }}>
              <h2 className="text-lg font-semibold text-[#111111] mb-4">Seller Information</h2>
              <div className="space-y-2">
                <p className="text-sm">
                  <span className="text-[#6B6B6B]">Name:</span>
                  <span className="ml-2 text-[#111111] font-medium">{order.seller.full_name}</span>
                </p>
                <p className="text-sm">
                  <span className="text-[#6B6B6B]">Email:</span>
                  <a href={`mailto:${order.seller.email}`} className="ml-2 font-medium" style={{ color: '#C4622D' }}>
                    {order.seller.email}
                  </a>
                </p>
                {order.seller.phone && (
                  <p className="text-sm">
                    <span className="text-[#6B6B6B]">Phone:</span>
                    <a href={`tel:${order.seller.phone}`} className="ml-2 font-medium" style={{ color: '#C4622D' }}>
                      {order.seller.phone}
                    </a>
                  </p>
                )}
              </div>
            </div>

            {/* Actions */}
            {order.status === 'delivered' && (
              <Link
                href={`/dashboard/buyer/orders/${order.id}/refund`}
                className="block w-full px-4 py-3 text-white text-center font-semibold rounded-full transition-all hover:opacity-90"
                style={{ backgroundColor: '#CC3333' }}
              >
                Request Refund
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
