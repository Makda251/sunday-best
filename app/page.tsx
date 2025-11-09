'use client'

import Link from 'next/link'
import ProductGrid from '@/components/ProductGrid'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

export default function Home() {
  const [userRole, setUserRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const getProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle()
        setUserRole(data?.role || null)
      }
      setLoading(false)
    }
    getProfile()
  }, [supabase])

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500">
        {/* Decorative background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-1/4 w-72 h-72 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto py-12 px-4 sm:py-20 sm:px-6 lg:py-28 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white sm:text-5xl lg:text-6xl xl:text-7xl tracking-tight leading-tight">
              Your Home for<br />
              <span className="bg-gradient-to-r from-yellow-200 to-pink-200 bg-clip-text text-transparent">
                Habesha Elegance
              </span>
            </h1>
            <p className="mt-4 sm:mt-6 max-w-2xl mx-auto text-base sm:text-xl lg:text-2xl text-indigo-100 leading-relaxed px-4">
              Buy and sell beautiful traditional Habesha dresses
            </p>
            <p className="mt-2 text-sm sm:text-lg text-indigo-200">
              New & pre-loved
            </p>
            <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 px-4">
              <Link
                href="#products"
                className="group inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold rounded-xl text-indigo-600 bg-white hover:bg-gray-50 transform hover:scale-105 transition-all duration-200 shadow-xl hover:shadow-2xl"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Browse Dresses
              </Link>
              {!loading && userRole === 'seller' && (
                <Link
                  href="/dashboard/seller/products/new"
                  className="inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold rounded-xl text-white bg-white/20 backdrop-blur-sm border-2 border-white/40 hover:bg-white/30 transform hover:scale-105 transition-all duration-200"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  List a Dress
                </Link>
              )}
              {!loading && userRole !== 'seller' && userRole !== 'admin' && (
                <Link
                  href="/auth/signup"
                  className="inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold rounded-xl text-white bg-white/20 backdrop-blur-sm border-2 border-white/40 hover:bg-white/30 transform hover:scale-105 transition-all duration-200"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Sign Up to Sell
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Featured Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-8 sm:mb-12 lg:mb-16">
          <div className="text-center p-4 sm:p-6 rounded-2xl bg-white shadow-md hover:shadow-xl transition-shadow">
            <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 bg-indigo-100 rounded-full mb-3 sm:mb-4">
              <svg className="w-6 h-6 sm:w-7 sm:h-7 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Authentic Dresses</h3>
            <p className="text-sm sm:text-base text-gray-600">Beautiful traditional Habesha kemis from trusted sellers</p>
          </div>
          <div className="text-center p-4 sm:p-6 rounded-2xl bg-white shadow-md hover:shadow-xl transition-shadow">
            <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 bg-purple-100 rounded-full mb-3 sm:mb-4">
              <svg className="w-6 h-6 sm:w-7 sm:h-7 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Great Prices</h3>
            <p className="text-sm sm:text-base text-gray-600">Find amazing deals on new and pre-loved dresses</p>
          </div>
          <div className="text-center p-4 sm:p-6 rounded-2xl bg-white shadow-md hover:shadow-xl transition-shadow">
            <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 bg-pink-100 rounded-full mb-3 sm:mb-4">
              <svg className="w-6 h-6 sm:w-7 sm:h-7 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Community Driven</h3>
            <p className="text-sm sm:text-base text-gray-600">Supporting our community by connecting buyers and sellers</p>
          </div>
        </div>

        {/* Products Grid */}
        <div id="products">
          <div className="flex items-center justify-between mb-6 sm:mb-8">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">Latest Arrivals</h2>
          </div>
          <ProductGrid />
        </div>
      </div>
    </div>
  )
}
