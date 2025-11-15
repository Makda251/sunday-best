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

        // Fetch notification counts based on role
        if (data?.role === 'seller') {
          // Count verified orders that need shipping
          const { count } = await supabase
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .eq('seller_id', user.id)
            .eq('payment_status', 'verified')
            .in('status', ['payment_verified', 'processing'])

          setPendingOrders(count || 0)
        } else if (data?.role === 'admin') {
          // Count pending payment verifications and product reviews
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

    return () => subscription.unsubscribe()
  }, [supabase])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setProfile(null)
    router.push('/')
    router.refresh()
  }

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16">
          <div className="flex items-center min-w-0">
            <Link href="/" className="flex-shrink-0 min-w-0">
              <span className="text-lg sm:text-xl lg:text-2xl font-bold text-indigo-600 truncate">The Kemis House</span>
            </Link>
          </div>
          <div className="flex items-center">
            {!loading && (
              <>
                {profile ? (
                  <div className="flex items-center gap-1 sm:gap-2">
                    <Link
                      href="/favorites"
                      className="text-gray-600 hover:text-indigo-600 p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 transition-colors"
                      title="Favorites"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </Link>
                    <Link
                      href="/cart"
                      className="text-gray-600 hover:text-indigo-600 p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 transition-colors"
                      title="Cart"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                    </Link>
                    {(profile.role === 'seller' || profile.role === 'admin') && (
                      <Link
                        href={profile.role === 'seller' ? '/dashboard/seller' : '/dashboard/admin'}
                        className="text-gray-600 hover:text-indigo-600 p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 transition-colors relative"
                        title="Dashboard"
                      >
                        <svg className="w-5 h-5 sm:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        <span className="hidden sm:inline">Dashboard</span>
                        {((profile.role === 'seller' && pendingOrders > 0) || (profile.role === 'admin' && pendingPayments > 0)) && (
                          <span className="absolute -top-1 -right-1 sm:relative sm:top-0 sm:right-0 sm:ml-2 inline-flex items-center justify-center min-w-[16px] h-4 sm:min-w-[20px] sm:h-5 px-1 sm:px-1.5 text-[10px] sm:text-xs font-bold text-white bg-red-600 rounded-full">
                            {profile.role === 'seller' ? pendingOrders : pendingPayments}
                          </span>
                        )}
                      </Link>
                    )}
                    <button
                      onClick={handleSignOut}
                      className="text-gray-600 hover:text-indigo-600 p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 transition-colors"
                      title="Sign out"
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
                      className="text-gray-600 hover:text-indigo-600 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors"
                    >
                      Sign in
                    </Link>
                    <Link
                      href="/auth/signup"
                      className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all shadow-sm"
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
