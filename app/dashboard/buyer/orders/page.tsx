'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

type Order = {
  id: string
  order_number: string
  created_at: string
  status: string
  payment_status: string
  total: number
  tracking_number: string | null
  order_items: {
    product_id: string
    product_title: string
    product_image: string | null
  }[]
  seller: {
    full_name: string
  }
}

export default function BuyerOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const fetchOrders = async () => {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth/login')
        return
      }

      // Fetch buyer's orders with order items
      const { data: ordersData, error } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          created_at,
          status,
          payment_status,
          total,
          tracking_number,
          seller:profiles!orders_seller_id_fkey(full_name),
          order_items(
            product_id,
            product_title,
            product_image
          )
        `)
        .eq('buyer_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching orders:', error)
      } else {
        console.log('Orders fetched:', ordersData)
        setOrders(ordersData || [])
      }

      setLoading(false)
    }

    fetchOrders()
  }, [router, supabase])

  const getStatusBadge = (status: string, paymentStatus: string) => {
    const s = (bg: string, color: string, label: string) => (
      <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full" style={{ background: bg, color }}>{label}</span>
    )
    if (status === 'cancelled') return s('#FEE2E2', '#991B1B', 'Cancelled')
    if (status === 'delivered') return s('#D1FAE5', '#065F46', 'Delivered')
    if (status === 'shipped') return s('#EDE9FE', '#6D28D9', 'Shipped')
    if (paymentStatus === 'verified') return s('#DBEAFE', '#1E40AF', 'Processing')
    if (paymentStatus === 'pending') return s('#FEF3C7', '#92400E', 'Pending Verification')
    return s('#F7F7F7', '#6B6B6B', status)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#FFFFFF' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 mx-auto mb-3" style={{ borderColor: '#EBEBEB', borderTopColor: '#C4622D' }} />
          <p className="text-sm" style={{ color: '#6B6B6B' }}>Loading your orders...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-8" style={{ backgroundColor: '#FFFFFF' }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold font-semibold" style={{  }}>My Orders</h1>
          <p className="mt-1 text-sm" style={{ color: '#6B6B6B' }}>Track and manage your orders</p>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center" style={{ border: '1px solid #EBEBEB' }}>
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#FDF0EA' }}>
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#C4622D' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold font-semibold mb-2">No orders yet</h3>
            <p className="text-sm mb-6" style={{ color: '#6B6B6B' }}>Start shopping to see your orders here</p>
            <Link href="/" className="inline-flex px-6 py-3 text-sm font-semibold text-white rounded-full transition-all" style={{ backgroundColor: '#C4622D' }}>
              Browse Dresses
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-xl overflow-hidden" style={{ border: '1px solid #EBEBEB' }}>
                <div className="p-5 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
                    <div>
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="text-base font-semibold font-semibold">Order {order.order_number}</h3>
                        {getStatusBadge(order.status, order.payment_status)}
                      </div>
                      <p className="text-xs mt-1" style={{ color: '#6B6B6B' }}>
                        Placed on {new Date(order.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                    </div>
                    <p className="text-xl font-bold" style={{ color: '#C4622D' }}>${order.total.toFixed(2)}</p>
                  </div>

                  <div className="pt-4" style={{ borderTop: '1px solid #EBEBEB' }}>
                    <div className="flex gap-4 items-start justify-between">
                      <div className="flex gap-4 flex-1 min-w-0">
                        {order.order_items[0]?.product_image && (
                          <div className="flex-shrink-0">
                            <Image src={order.order_items[0].product_image} alt={order.order_items[0].product_title} width={72} height={72} className="rounded-xl object-cover" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold font-semibold truncate">{order.order_items[0]?.product_title}</h4>
                          <p className="text-xs mt-0.5" style={{ color: '#6B6B6B' }}>Sold by {order.seller.full_name}</p>
                          {order.tracking_number && (
                            <div className="mt-2 p-2 rounded-lg inline-block" style={{ backgroundColor: '#F7F7F7', border: '1px solid #F0C9B2' }}>
                              <p className="text-xs font-semibold" style={{ color: '#6B6B6B' }}>Tracking: {order.tracking_number}</p>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 flex-shrink-0">
                        <Link href={`/dashboard/buyer/orders/${order.id}`} className="px-4 py-2 text-xs font-semibold text-white rounded-full whitespace-nowrap text-center" style={{ backgroundColor: '#C4622D' }}>
                          View Details
                        </Link>
                        {order.status === 'delivered' && (
                          <Link href={`/dashboard/buyer/orders/${order.id}/refund`} className="px-4 py-2 text-xs font-semibold rounded-full whitespace-nowrap text-center" style={{ border: '1px solid #C4622D', color: '#C4622D' }}>
                            Request Refund
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
