import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import DashboardVisitTracker from '@/components/DashboardVisitTracker'

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

  const { count: pendingProducts } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('review_status', 'pending')

  const { data: revenueData } = await supabase
    .from('orders')
    .select('platform_fee')
    .eq('payment_status', 'verified')

  const totalRevenue = revenueData?.reduce((sum, order) => sum + parseFloat(order.platform_fee), 0) || 0

  const { count: pendingApplications } = await supabase
    .from('seller_applications')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending')

  const paymentBadge = (s: string) => s === 'verified' ? { background: '#D1FAE5', color: '#065F46' } : s === 'pending' ? { background: '#FEF3C7', color: '#92400E' } : { background: '#FEE2E2', color: '#991B1B' }
  const statusBadge = (s: string) => {
    if (s === 'delivered') return { background: '#D1FAE5', color: '#065F46' }
    if (s === 'shipped') return { background: '#EDE9FE', color: '#6D28D9' }
    if (s === 'cancelled') return { background: '#FEE2E2', color: '#991B1B' }
    if (s === 'refunded') return { background: '#FDF0EA', color: '#C4622D' }
    return { background: '#DBEAFE', color: '#1E40AF' }
  }

  return (
    <div className="min-h-screen py-8" style={{ backgroundColor: '#FFFFFF' }}>
      <DashboardVisitTracker role="admin" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: '#111111' }}>Admin Dashboard</h1>
          <p className="mt-1 text-sm" style={{ color: '#6B6B6B' }}>Manage orders and verify payments</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Orders', value: totalOrders || 0, color: '#111111' },
            { label: 'Pending Verifications', value: pendingPayments || 0, color: '#92400E', alert: true },
            { label: 'Pending Reviews', value: pendingProducts || 0, color: '#6D28D9', alert: true, href: '/dashboard/admin/products' },
            { label: 'Platform Revenue', value: `$${totalRevenue.toFixed(2)}`, color: '#065F46' },
            { label: 'Seller Applications', value: pendingApplications || 0, color: '#C4622D', alert: true, href: '/dashboard/admin/sellers' },
          ].map(({ label, value, color, alert, href }) => {
            const inner = (
              <div className="p-5 rounded-xl" style={{ border: '1px solid #EBEBEB', background: '#FFFFFF' }}>
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#6B6B6B' }}>{label}</p>
                <p className="mt-2 text-3xl font-bold" style={{ color }}>{value}</p>
                {alert && Number(value) > 0 && (
                  <p className="mt-1 text-xs font-medium" style={{ color }}>Action needed</p>
                )}
              </div>
            )
            return href ? (
              <Link key={label} href={href} className="block transition-all hover:shadow-md rounded-xl">{inner}</Link>
            ) : (
              <div key={label}>{inner}</div>
            )
          })}
        </div>

        {/* Quick Links */}
        <div className="bg-white rounded-xl mb-8 p-5" style={{ border: '1px solid #EBEBEB' }}>
          <h2 className="text-base font-semibold mb-4" style={{ color: '#111111' }}>Management Tools</h2>
          <div className="flex flex-wrap gap-3">
            <Link href="/dashboard/admin/sellers" className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all" style={{ background: '#FDF0EA', color: '#C4622D' }}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Seller Applications
              {(pendingApplications || 0) > 0 && (
                <span className="inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold text-white rounded-full" style={{ backgroundColor: '#C4622D' }}>
                  {pendingApplications}
                </span>
              )}
            </Link>
            <Link href="/dashboard/admin/designers" className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all" style={{ background: '#FDF0EA', color: '#C4622D' }}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              Manage Designers
            </Link>
            <Link href="/dashboard/admin/settings" className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all" style={{ background: '#F7F7F7', color: '#6B6B6B' }}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Settings
            </Link>
          </div>
        </div>

        {/* Pending Payment Verifications */}
        <div className="bg-white rounded-xl mb-6" style={{ border: '1px solid #EBEBEB' }}>
          <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid #EBEBEB' }}>
            <div>
              <h2 className="text-base font-semibold" style={{ color: '#111111' }}>Pending Payment Verifications</h2>
              <p className="text-xs mt-0.5" style={{ color: '#6B6B6B' }}>Review and verify Zelle payments</p>
            </div>
            {pendingOrders && pendingOrders.length > 0 && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold" style={{ background: '#FEF3C7', color: '#92400E' }}>{pendingOrders.length}</span>
            )}
          </div>
          <div>
            {pendingOrders && pendingOrders.length > 0 ? (
              <ul>
                {pendingOrders.map((order) => (
                  <li key={order.id} className="px-5 py-4" style={{ borderBottom: '1px solid #EBEBEB' }}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <p className="text-sm font-semibold" style={{ color: '#111111' }}>Order #{order.id.slice(0, 8)}</p>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold" style={{ background: '#FEF3C7', color: '#92400E' }}>Pending Verification</span>
                        </div>
                        <div className="flex flex-wrap gap-3 text-xs" style={{ color: '#6B6B6B' }}>
                          <span>Buyer: {order.buyer?.full_name || 'Anonymous'}</span>
                          <span>Amount: ${order.total}</span>
                          <span>{new Date(order.created_at).toLocaleDateString()}</span>
                        </div>
                        {order.payment_screenshot_url && (
                          <div className="mt-3">
                            <p className="text-xs mb-1" style={{ color: '#9A9A9A' }}>Payment Screenshot:</p>
                            <Image src={order.payment_screenshot_url} alt="Payment screenshot" width={200} height={150} className="rounded-lg border" style={{ borderColor: '#EBEBEB' }} />
                          </div>
                        )}
                      </div>
                      <Link href={`/dashboard/admin/orders/${order.id}`} className="flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold text-white transition-all" style={{ backgroundColor: '#C4622D' }}>
                        Review
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-12">
                <p className="text-sm" style={{ color: '#9A9A9A' }}>No pending verifications</p>
              </div>
            )}
          </div>
        </div>

        {/* All Orders */}
        <div className="bg-white rounded-xl" style={{ border: '1px solid #EBEBEB' }}>
          <div className="px-5 py-4" style={{ borderBottom: '1px solid #EBEBEB' }}>
            <h2 className="text-base font-semibold" style={{ color: '#111111' }}>Recent Orders</h2>
          </div>
          <div>
            {allOrders && allOrders.length > 0 ? (
              <ul>
                {allOrders.map((order) => (
                  <li key={order.id} style={{ borderBottom: '1px solid #EBEBEB' }}>
                    <Link href={`/dashboard/admin/orders/${order.id}`} className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-[#F7F7F7]" style={{ color: 'inherit' }}>
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <p className="text-sm font-semibold" style={{ color: '#111111' }}>Order #{order.id.slice(0, 8)}</p>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold" style={paymentBadge(order.payment_status)}>{order.payment_status}</span>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold" style={statusBadge(order.status)}>{order.status.replace(/_/g, ' ')}</span>
                        </div>
                        <div className="flex gap-3 text-xs" style={{ color: '#9A9A9A' }}>
                          <span>${order.total}</span>
                          <span>{new Date(order.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#9A9A9A' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-12">
                <p className="text-sm" style={{ color: '#9A9A9A' }}>No orders yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
