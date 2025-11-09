import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import SellerAddressPrompt from '@/components/SellerAddressPrompt'

export default async function SellerDashboard() {
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

  if (profile?.role !== 'seller') {
    redirect('/')
  }

  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('seller_id', user.id)
    .order('created_at', { ascending: false })

  const { data: orders } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('seller_id', user.id)
    .order('created_at', { ascending: false })

  // Check if seller needs to provide shipping address
  const hasOrders = orders && orders.length > 0
  const needsAddress = hasOrders && !profile?.address_line1

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      {/* Address prompt modal */}
      {needsAddress && (
        <SellerAddressPrompt
          sellerId={user.id}
          hasOrders={true}
        />
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Seller Dashboard</h1>
          <p className="mt-2 text-sm text-gray-600">
            Manage your products and orders
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-1">
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Products
                  </dt>
                  <dd className="mt-1 text-3xl font-semibold text-gray-900">
                    {products?.length || 0}
                  </dd>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-1">
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Orders
                  </dt>
                  <dd className="mt-1 text-3xl font-semibold text-gray-900">
                    {orders?.length || 0}
                  </dd>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-1">
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Pending Orders
                  </dt>
                  <dd className="mt-1 text-3xl font-semibold text-gray-900">
                    {orders?.filter(o => o.status === 'payment_verified').length || 0}
                  </dd>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Products Section */}
        <div className="bg-white shadow rounded-lg mb-8">
          <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-medium text-gray-900">My Products</h2>
              <p className="mt-1 text-sm text-gray-500">
                Manage your product listings
              </p>
            </div>
            <Link
              href="/dashboard/seller/products/new"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Add Product
            </Link>
          </div>
          <div className="border-t border-gray-200">
            {products && products.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {products.map((product) => (
                  <li key={product.id} className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center min-w-0 flex-1">
                        <div className="flex-shrink-0">
                          {product.images && product.images.length > 0 ? (
                            <Image
                              src={product.images[0]}
                              alt={product.title}
                              width={64}
                              height={64}
                              className="h-16 w-16 rounded-md object-cover"
                            />
                          ) : (
                            <div className="h-16 w-16 rounded-md bg-gray-200 flex items-center justify-center">
                              <span className="text-xs text-gray-400">No image</span>
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1 px-4">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {product.title}
                          </p>
                          <p className="text-sm text-gray-500">
                            ${product.price} • {product.condition}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {product.is_active ? (
                              <span className="text-green-600">Active</span>
                            ) : (
                              <span className="text-gray-500">Inactive</span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Link
                          href={`/dashboard/seller/products/${product.id}/edit`}
                          className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                        >
                          Edit
                        </Link>
                        <Link
                          href={`/products/${product.id}`}
                          className="text-gray-600 hover:text-gray-900 text-sm font-medium"
                        >
                          View
                        </Link>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">No products yet. Create your first listing!</p>
              </div>
            )}
          </div>
        </div>

        {/* Orders Section */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h2 className="text-lg font-medium text-gray-900">Recent Orders</h2>
            <p className="mt-1 text-sm text-gray-500">
              View and manage your orders
            </p>
          </div>
          <div className="border-t border-gray-200">
            {orders && orders.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {orders.map((order) => (
                  <li key={order.id} className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          Order #{order.id.slice(0, 8)}
                        </p>
                        <p className="text-sm text-gray-500">
                          {order.order_items?.length || 0} item(s) • ${order.total}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          Status: <span className="capitalize">{order.status.replace('_', ' ')}</span>
                        </p>
                      </div>
                      <div>
                        <Link
                          href={`/dashboard/seller/orders/${order.id}`}
                          className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">No orders yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
