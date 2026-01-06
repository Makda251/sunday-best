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
  product: {
    id: string
    title: string
    images: string[]
  }
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

      // Fetch buyer's orders
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
          product:products(id, title, images),
          seller:profiles!orders_seller_id_fkey(full_name)
        `)
        .eq('buyer_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching orders:', error)
      } else {
        setOrders(ordersData || [])
      }

      setLoading(false)
    }

    fetchOrders()
  }, [router, supabase])

  const getStatusBadge = (status: string, paymentStatus: string) => {
    if (status === 'cancelled') {
      return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">Cancelled</span>
    }
    if (status === 'delivered') {
      return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Delivered</span>
    }
    if (status === 'shipped') {
      return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">Shipped</span>
    }
    if (paymentStatus === 'verified') {
      return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">Processing</span>
    }
    if (paymentStatus === 'pending') {
      return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">Pending Payment Verification</span>
    }
    return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">{status}</span>
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your orders...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
          <p className="mt-2 text-sm text-gray-600">
            Track and manage your orders
          </p>
        </div>

        {/* Orders List */}
        {orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">No orders yet</h3>
            <p className="mt-2 text-sm text-gray-500">Start shopping to see your orders here</p>
            <Link
              href="/"
              className="mt-6 inline-block px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-lg hover:from-indigo-700 hover:to-purple-700 transition"
            >
              Browse Dresses
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Order {order.order_number}
                        </h3>
                        {getStatusBadge(order.status, order.payment_status)}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        Placed on {new Date(order.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                    <div className="mt-4 sm:mt-0 text-right">
                      <p className="text-2xl font-bold text-gray-900">${order.total.toFixed(2)}</p>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex gap-4">
                      {order.product.images?.[0] && (
                        <div className="flex-shrink-0">
                          <Image
                            src={order.product.images[0]}
                            alt={order.product.title}
                            width={80}
                            height={80}
                            className="rounded-lg object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900">{order.product.title}</h4>
                        <p className="text-sm text-gray-500 mt-1">Sold by {order.seller.full_name}</p>

                        {order.tracking_number && (
                          <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                            <p className="text-xs font-semibold text-blue-900 mb-1">Tracking Number</p>
                            <p className="text-sm font-mono text-blue-700">{order.tracking_number}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-col sm:flex-row gap-3">
                    <Link
                      href={`/dashboard/buyer/orders/${order.id}`}
                      className="flex-1 px-4 py-2 bg-indigo-600 text-white text-center font-semibold rounded-lg hover:bg-indigo-700 transition"
                    >
                      View Details
                    </Link>
                    {order.status === 'delivered' && (
                      <Link
                        href={`/dashboard/buyer/orders/${order.id}/refund`}
                        className="flex-1 px-4 py-2 border-2 border-red-600 text-red-600 text-center font-semibold rounded-lg hover:bg-red-50 transition"
                      >
                        Request Refund
                      </Link>
                    )}
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
