import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

export default async function AdminDashboard() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    redirect('/')
  }

  // Get pending payment verifications
  const { data: pendingOrders } = await supabase
    .from('orders')
    .select(`
      *,
      buyer:profiles!buyer_id(full_name, email),
      seller:profiles!seller_id(full_name, email),
      order_items(*)
    `)
    .eq('payment_status', 'pending')
    .order('created_at', { ascending: false })

  // Get all recent orders
  const { data: allOrders } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20)

  // Get stats
  const { count: totalOrders } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })

  const { count: pendingPayments } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('payment_status', 'pending')

  const { data: revenueData } = await supabase
    .from('orders')
    .select('platform_fee')
    .eq('payment_status', 'verified')

  const totalRevenue = revenueData?.reduce((sum, order) => sum + parseFloat(order.platform_fee), 0) || 0

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="mt-2 text-sm text-gray-600">
            Manage orders and verify payments
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <dt className="text-sm font-medium text-gray-500 truncate">
                Total Orders
              </dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">
                {totalOrders || 0}
              </dd>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <dt className="text-sm font-medium text-gray-500 truncate">
                Pending Verifications
              </dt>
              <dd className="mt-1 text-3xl font-semibold text-yellow-600">
                {pendingPayments || 0}
              </dd>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <dt className="text-sm font-medium text-gray-500 truncate">
                Platform Revenue
              </dt>
              <dd className="mt-1 text-3xl font-semibold text-green-600">
                ${totalRevenue.toFixed(2)}
              </dd>
            </div>
          </div>
        </div>

        {/* Pending Payment Verifications */}
        <div className="bg-white shadow rounded-lg mb-8">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Pending Payment Verifications</h2>
            <p className="mt-1 text-sm text-gray-500">
              Review and verify Zelle payments
            </p>
          </div>
          <div>
            {pendingOrders && pendingOrders.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {pendingOrders.map((order) => (
                  <li key={order.id} className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3">
                          <p className="text-sm font-medium text-gray-900">
                            Order #{order.id.slice(0, 8)}
                          </p>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Pending Verification
                          </span>
                        </div>
                        <div className="mt-2 flex items-center text-sm text-gray-500 space-x-4">
                          <span>Buyer: {order.buyer?.full_name || 'Anonymous'}</span>
                          <span>•</span>
                          <span>Amount: ${order.total}</span>
                          <span>•</span>
                          <span>{new Date(order.created_at).toLocaleDateString()}</span>
                        </div>
                        {order.payment_screenshot_url && (
                          <div className="mt-3">
                            <p className="text-xs text-gray-500 mb-1">Payment Screenshot:</p>
                            <Image
                              src={order.payment_screenshot_url}
                              alt="Payment screenshot"
                              width={200}
                              height={150}
                              className="rounded border"
                            />
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <Link
                          href={`/dashboard/admin/orders/${order.id}`}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                        >
                          Review
                        </Link>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">No pending verifications</p>
              </div>
            )}
          </div>
        </div>

        {/* All Orders */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Recent Orders</h2>
          </div>
          <div>
            {allOrders && allOrders.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {allOrders.map((order) => (
                  <li key={order.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                    <Link href={`/dashboard/admin/orders/${order.id}`} className="block">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <p className="text-sm font-medium text-gray-900">
                              Order #{order.id.slice(0, 8)}
                            </p>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              order.payment_status === 'verified' ? 'bg-green-100 text-green-800' :
                              order.payment_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {order.payment_status}
                            </span>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                              order.status === 'shipped' ? 'bg-purple-100 text-purple-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {order.status.replace(/_/g, ' ')}
                            </span>
                          </div>
                          <div className="mt-1 flex items-center text-sm text-gray-500 space-x-4">
                            <span>${order.total}</span>
                            <span>•</span>
                            <span>{new Date(order.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div>
                          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">No orders yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
