'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import type { Profile } from '@/lib/types/database'

export default function Navbar() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [pendingOrders, setPendingOrders] = useState(0)
  const [pendingPayments, setPendingPayments] = useState(0)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle()

        setProfile(data)

        if (data?.role === 'seller') {
          const { count } = await supabase
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .eq('seller_id', user.id)
            .eq('payment_status', 'verified')
            .in('status', ['payment_verified', 'processing'])

          setPendingOrders(count || 0)
        } else if (data?.role === 'admin') {
          const { count: paymentCount } = await supabase
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .eq('payment_status', 'pending')

          const { count: productCount } = await supabase
            .from('products')
            .select('*', { count: 'exact', head: true })
            .eq('review_status', 'pending')

          setPendingPayments((paymentCount || 0) + (productCount || 0))
        }
      }
      setLoading(false)
    }

    getProfile()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      getProfile()
    })

    const handleDashboardVisit = () => {
      setPendingOrders(0)
      setPendingPayments(0)
    }

    window.addEventListener('dashboard-visited', handleDashboardVisit)

    return () => {
      subscription.unsubscribe()
      window.removeEventListener('dashboard-visited', handleDashboardVisit)
    }
  }, [supabase])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setProfile(null)
    router.push('/')
    router.refresh()
  }

  return (
    <nav
      className="sticky top-0 z-50 border-b"
      style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(12px)', borderColor: '#EBEBEB' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 gap-4">
          {/* Brand */}
          <Link href="/" className="flex-shrink-0">
            <span className="text-xl font-extrabold tracking-tight" style={{ color: '#C4622D' }}>
              Kemis<span style={{ color: '#111111' }}>House</span>
            </span>
          </Link>

          {/* Search — hidden on mobile */}
          <div className="hidden sm:flex flex-1 max-w-md relative">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: '#9A9A9A' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search Habesha dresses..."
              className="w-full pl-10 pr-4 py-2 text-sm rounded-full outline-none transition-all"
              style={{ border: '1.5px solid #EBEBEB', background: '#F7F7F7', color: '#111111' }}
              onFocus={e => { e.currentTarget.style.borderColor = '#C4622D'; e.currentTarget.style.background = '#fff' }}
              onBlur={e => { e.currentTarget.style.borderColor = '#EBEBEB'; e.currentTarget.style.background = '#F7F7F7' }}
            />
          </div>

          {/* Nav Actions */}
          <div className="flex items-center gap-1">
            {!loading && (
              <>
                {profile ? (
                  <div className="flex items-center gap-1">
                    {/* Favorites */}
                    <NavIconLink href="/favorites" title="Favorites">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </NavIconLink>

                    {/* Cart */}
                    <NavIconLink href="/cart" title="Cart">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                    </NavIconLink>

                    {/* Buyer links */}
                    {profile.role === 'buyer' && (
                      <>
                        <NavIconLink href="/dashboard/buyer/profile" title="Profile">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </NavIconLink>
                        <NavTextLink href="/dashboard/buyer/orders" title="My Orders">
                          <span className="hidden sm:inline text-sm font-medium">My Orders</span>
                          <svg className="w-5 h-5 sm:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                        </NavTextLink>
                      </>
                    )}

                    {/* Seller profile */}
                    {profile.role === 'seller' && (
                      <NavIconLink href="/dashboard/seller/profile" title="Profile">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </NavIconLink>
                    )}

                    {/* Dashboard (seller / admin) */}
                    {(profile.role === 'seller' || profile.role === 'admin') && (
                      <NavTextLink
                        href={profile.role === 'seller' ? '/dashboard/seller' : '/dashboard/admin'}
                        title="Dashboard"
                      >
                        <span className="hidden sm:inline text-sm font-medium">Dashboard</span>
                        <svg className="w-5 h-5 sm:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        {((profile.role === 'seller' && pendingOrders > 0) || (profile.role === 'admin' && pendingPayments > 0)) && (
                          <span className="ml-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white rounded-full" style={{ backgroundColor: '#C4622D' }}>
                            {profile.role === 'seller' ? pendingOrders : pendingPayments}
                          </span>
                        )}
                      </NavTextLink>
                    )}

                    {/* Sign out */}
                    <button
                      onClick={handleSignOut}
                      title="Sign out"
                      className="p-2 rounded-full transition-colors"
                      style={{ color: '#6B6B6B' }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#F7F7F7'; e.currentTarget.style.color = '#111111' }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#6B6B6B' }}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Link
                      href="/auth/login"
                      className="px-4 py-2 rounded-full text-sm font-medium transition-colors"
                      style={{ color: '#6B6B6B' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#F7F7F7')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      Sign in
                    </Link>
                    <Link
                      href="/auth/signup"
                      className="px-4 py-2 rounded-full text-sm font-semibold text-white transition-all"
                      style={{ backgroundColor: '#C4622D' }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#A84F22')}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#C4622D')}
                    >
                      Sign up
                    </Link>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

function NavIconLink({ href, title, children }: { href: string; title: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      title={title}
      className="p-2 rounded-full transition-colors"
      style={{ color: '#6B6B6B' }}
      onMouseEnter={e => { e.currentTarget.style.background = '#F7F7F7'; e.currentTarget.style.color = '#111111' }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#6B6B6B' }}
    >
      {children}
    </Link>
  )
}

function NavTextLink({ href, title, children }: { href: string; title: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      title={title}
      className="flex items-center gap-1 px-3 py-2 rounded-full text-sm font-medium transition-colors"
      style={{ color: '#6B6B6B' }}
      onMouseEnter={e => { e.currentTarget.style.background = '#F7F7F7'; e.currentTarget.style.color = '#111111' }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#6B6B6B' }}
    >
      {children}
    </Link>
  )
}
