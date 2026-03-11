import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import SellerAddressPrompt from '@/components/SellerAddressPrompt'
import DashboardVisitTracker from '@/components/DashboardVisitTracker'

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
    <div className="min-h-screen py-8" style={{ backgroundColor: '#FFFFFF' }}>
      <DashboardVisitTracker role="seller" />

      {needsAddress && (
        <SellerAddressPrompt sellerId={user.id} hasOrders={true} />
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-stone-900" style={{  }}>Seller Dashboard</h1>
            <p className="mt-1 text-sm" style={{ color: '#6B6B6B' }}>Manage your products and orders</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-8">
          {[
            { label: 'Total Products', value: products?.length || 0, color: '#111111' },
            { label: 'Total Orders', value: orders?.length || 0, color: '#111111' },
            { label: 'Pending Orders', value: orders?.filter(o => o.status === 'payment_verified' || o.status === 'processing').length || 0, color: '#C4622D', alert: true },
          ].map(({ label, value, color, alert }) => (
            <div key={label} className="bg-white rounded-xl p-5" style={{ border: '1px solid #EBEBEB' }}>
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#6B6B6B' }}>{label}</p>
              <p className="mt-2 text-3xl font-bold" style={{ color }}>{value}</p>
              {alert && value > 0 && (
                <p className="mt-1 text-xs font-medium" style={{ color: '#C4622D' }}>Action needed</p>
              )}
            </div>
          ))}
        </div>

        {/* Products Section */}
        <div className="bg-white rounded-xl mb-6" style={{ border: '1px solid #EBEBEB' }}>
          <div className="px-5 py-4 sm:px-6 flex justify-between items-center" style={{ borderBottom: '1px solid #EBEBEB' }}>
            <div>
              <h2 className="text-base font-semibold text-stone-900" style={{  }}>My Products</h2>
              <p className="mt-0.5 text-xs" style={{ color: '#6B6B6B' }}>Manage your product listings</p>
            </div>
            <Link href="/dashboard/seller/products/new" className="inline-flex items-center justify-center px-5 py-2 text-sm font-semibold rounded-full text-white transition-all hover:opacity-90" style={{ backgroundColor: '#C4622D' }}>
              + Add Product
            </Link>
          </div>
          <div>
            {products && products.length > 0 ? (
              <ul>
                {products.map((product) => (
                  <li key={product.id} className="px-5 py-4" style={{ borderBottom: '1px solid #EBEBEB' }}>
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center min-w-0 flex-1 gap-4">
                        <div className="flex-shrink-0">
                          {product.images && product.images.length > 0 ? (
                            <Image
                              src={product.images[0]}
                              alt={product.title}
                              width={64}
                              height={64}
                              className="h-14 w-14 rounded-xl object-cover"
                            />
                          ) : (
                            <div className="h-14 w-14 rounded-xl flex items-center justify-center" style={{ background: '#F7F7F7' }}>
                              <span className="text-xs" style={{ color: '#9A9A9A' }}>No image</span>
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold truncate" style={{ color: '#111111' }}>{product.title}</p>
                          <p className="text-sm mt-0.5" style={{ color: '#6B6B6B' }}>${product.price} · {product.condition}</p>
                          <div className="mt-1.5 flex flex-wrap gap-1.5 items-center">
                            {product.review_status === 'pending' && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold" style={{ background: '#FEF3C7', color: '#92400E' }}>Pending Review</span>
                            )}
                            {product.review_status === 'approved' && product.is_active && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold" style={{ background: '#D1FAE5', color: '#065F46' }}>Active</span>
                            )}
                            {product.review_status === 'approved' && !product.is_active && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold" style={{ background: '#F7F7F7', color: '#6B6B6B' }}>Sold</span>
                            )}
                            {product.review_status === 'rejected' && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold" style={{ background: '#FEE2E2', color: '#991B1B' }}>Rejected</span>
                            )}
                          </div>
                          {product.review_status === 'rejected' && product.rejection_reason && (
                            <div className="mt-2 p-2.5 rounded-lg" style={{ background: '#FFF0F0', border: '1px solid #FFCCCC' }}>
                              <p className="text-xs font-semibold" style={{ color: '#CC3333' }}>Rejection Reason:</p>
                              <p className="text-xs mt-0.5" style={{ color: '#CC3333' }}>{product.rejection_reason}</p>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <Link href={`/dashboard/seller/products/${product.id}/edit`} className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all" style={{ background: '#FDF0EA', color: '#C4622D' }}>
                          Edit
                        </Link>
                        <Link href={`/products/${product.id}`} className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all" style={{ background: '#F7F7F7', color: '#6B6B6B' }}>
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
        <div className="bg-white rounded-xl" style={{ border: '1px solid #EBEBEB' }}>
          <div className="px-5 py-4 sm:px-6" style={{ borderBottom: '1px solid #EBEBEB' }}>
            <h2 className="text-base font-semibold" style={{ color: '#111111' }}>Recent Orders</h2>
            <p className="mt-0.5 text-xs" style={{ color: '#6B6B6B' }}>View and manage your orders</p>
          </div>
          <div>
            {orders && orders.length > 0 ? (
              <ul>
                {orders.map((order) => (
                  <li key={order.id} className="px-5 py-4" style={{ borderBottom: '1px solid #EBEBEB' }}>
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold" style={{ color: '#111111' }}>Order #{order.id.slice(0, 8)}</p>
                        <p className="text-sm mt-0.5" style={{ color: '#6B6B6B' }}>{order.order_items?.length || 0} item(s) · ${order.total}</p>
                        <p className="text-xs mt-1 capitalize" style={{ color: '#9A9A9A' }}>{order.status.replace(/_/g, ' ')}</p>
                      </div>
                      <Link href={`/dashboard/seller/orders/${order.id}`} className="px-3 py-1.5 rounded-full text-xs font-semibold flex-shrink-0 transition-all" style={{ background: '#FDF0EA', color: '#C4622D' }}>
                        View Details
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-12">
                <p className="text-sm" style={{ color: '#9A9A9A' }}>No orders yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
