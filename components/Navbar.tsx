'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import type { Profile } from '@/lib/types/database'

export default function Navbar() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
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
    <nav className="bg-white shadow-sm border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex flex-col justify-center">
              <span className="text-2xl font-bold text-indigo-600">Sunday Best</span>
              <span className="text-xs text-gray-500 -mt-1">Celebrating Habesha Elegance</span>
            </Link>
            <div className="hidden md:ml-8 md:flex md:space-x-6">
              <Link
                href="/"
                className="text-gray-600 hover:text-indigo-600 inline-flex items-center px-1 text-sm font-medium transition-colors"
              >
                Browse Dresses
              </Link>
            </div>
          </div>
          <div className="flex items-center">
            {!loading && (
              <>
                {profile ? (
                  <div className="flex items-center space-x-2 md:space-x-4">
                    <Link
                      href="/favorites"
                      className="text-gray-600 hover:text-indigo-600 p-2 rounded-md transition-colors"
                      title="Favorites"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </Link>
                    <Link
                      href="/cart"
                      className="text-gray-600 hover:text-indigo-600 p-2 rounded-md transition-colors"
                      title="Cart"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                    </Link>
                    {profile.role === 'seller' && (
                      <Link
                        href="/dashboard/seller"
                        className="hidden md:inline-flex text-gray-600 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                      >
                        Dashboard
                      </Link>
                    )}
                    {profile.role === 'admin' && (
                      <Link
                        href="/dashboard/admin"
                        className="hidden md:inline-flex text-gray-600 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                      >
                        Admin
                      </Link>
                    )}
                    <div className="hidden md:flex items-center space-x-3 pl-3 border-l border-gray-200">
                      <span className="text-sm text-gray-700">{profile.full_name || profile.email}</span>
                      <button
                        onClick={handleSignOut}
                        className="text-gray-600 hover:text-indigo-600 text-sm font-medium transition-colors"
                      >
                        Sign out
                      </button>
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="md:hidden text-gray-600 hover:text-indigo-600 p-2 rounded-md transition-colors"
                      title="Sign out"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-3">
                    <Link
                      href="/auth/login"
                      className="text-gray-600 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                      Sign in
                    </Link>
                    <Link
                      href="/auth/signup"
                      className="bg-indigo-600 text-white hover:bg-indigo-700 px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm"
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
