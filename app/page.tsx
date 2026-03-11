'use client'

import Link from 'next/link'
import Image from 'next/image'
import ProductGrid from '@/components/ProductGrid'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

export default function Home() {
  const [userRole, setUserRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [heroProducts, setHeroProducts] = useState<{ id: string; title: string; price: number; images: string[]; size?: string }[]>([])
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
    const getHeroProducts = async () => {
      const { data } = await supabase
        .from('products')
        .select('id, title, price, images, size')
        .eq('is_active', true)
        .eq('review_status', 'approved')
        .order('created_at', { ascending: false })
        .limit(3)
      setHeroProducts(data || [])
    }
    getProfile()
    getHeroProducts()
  }, [supabase])

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FFFFFF' }}>

      {/* Hero */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-4 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
        <div>
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight" style={{ color: '#111111', letterSpacing: '-1.5px' }}>
            Habesha fashion,<br />
            <em className="not-italic" style={{ color: '#C4622D' }}>reimagined</em> for you
          </h1>
          <p className="mt-5 text-base leading-relaxed max-w-md" style={{ color: '#6B6B6B' }}>
            Buy and sell authentic Habesha dresses — new, pre-loved, and everything in between.
          </p>
          <div className="mt-8 flex flex-wrap gap-3 items-center">
            <Link
              href="#products"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-sm font-semibold text-white transition-all"
              style={{ backgroundColor: '#C4622D' }}
              onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => (e.currentTarget.style.backgroundColor = '#A84F22')}
              onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => (e.currentTarget.style.backgroundColor = '#C4622D')}
            >
              Shop Now
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
            {!loading && userRole !== 'admin' && (
              <Link
                href={userRole === 'seller' ? '/dashboard/seller/products/new' : '/auth/signup'}
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-sm font-medium transition-all"
                style={{ border: '1.5px solid #D4D4D4', color: '#6B6B6B' }}
                onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => { e.currentTarget.style.borderColor = '#6B6B6B'; e.currentTarget.style.color = '#111111' }}
                onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => { e.currentTarget.style.borderColor = '#D4D4D4'; e.currentTarget.style.color = '#6B6B6B' }}
              >
                {userRole === 'seller' ? 'List a Dress' : 'Start Selling'}
              </Link>
            )}
          </div>
          <div className="mt-10 flex gap-5 sm:gap-8">
            {[
              { num: '2,400+', label: 'Items listed' },
              { num: '840+', label: 'Happy buyers' },
              { num: '320+', label: 'Sellers' },
            ].map(stat => (
              <div key={stat.label}>
                <div className="text-2xl font-extrabold" style={{ color: '#111111', letterSpacing: '-0.5px' }}>{stat.num}</div>
                <div className="text-xs uppercase tracking-wide mt-0.5" style={{ color: '#9A9A9A' }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Hero visual — real product cards */}
        {heroProducts.length > 0 && (
          <div className="hidden lg:flex justify-center relative h-96">
            {heroProducts[1] && (
              <Link href={`/products/${heroProducts[1].id}`} className="absolute left-0 top-16 w-32 h-40 rounded-2xl shadow-xl overflow-hidden block" style={{ border: '1px solid #EBEBEB' }}>
                {heroProducts[1].images?.[0] ? (
                  <Image src={heroProducts[1].images[0]} alt={heroProducts[1].title} fill className="object-cover object-center" />
                ) : (
                  <div className="w-full h-full" style={{ background: 'linear-gradient(135deg,#F5E6D3,#E8C9A0)' }} />
                )}
                <div className="absolute bottom-0 left-0 right-0 p-2" style={{ background: 'rgba(255,255,255,0.95)' }}>
                  <div className="text-xs font-bold" style={{ color: '#C4622D' }}>${heroProducts[1].price}</div>
                  <div className="text-[10px] truncate" style={{ color: '#6B6B6B' }}>{heroProducts[1].title}</div>
                </div>
              </Link>
            )}
            {heroProducts[0] && (
              <Link href={`/products/${heroProducts[0].id}`} className="absolute right-12 top-4 w-56 h-80 rounded-2xl shadow-2xl overflow-hidden block" style={{ border: '1px solid #EBEBEB' }}>
                {heroProducts[0].images?.[0] ? (
                  <Image src={heroProducts[0].images[0]} alt={heroProducts[0].title} fill className="object-cover object-center" />
                ) : (
                  <div className="w-full h-full" style={{ background: 'linear-gradient(135deg,#E8C9A0,#C4622D)' }} />
                )}
                <div className="absolute bottom-0 left-0 right-0 p-3" style={{ background: 'rgba(255,255,255,0.95)' }}>
                  <div className="text-sm font-bold" style={{ color: '#C4622D' }}>${heroProducts[0].price}</div>
                  <div className="text-xs truncate" style={{ color: '#6B6B6B' }}>{heroProducts[0].title}{heroProducts[0].size ? ` — ${heroProducts[0].size}` : ''}</div>
                </div>
              </Link>
            )}
            {heroProducts[2] && (
              <Link href={`/products/${heroProducts[2].id}`} className="absolute right-0 bottom-4 w-40 h-52 rounded-2xl shadow-xl overflow-hidden block" style={{ border: '1px solid #EBEBEB' }}>
                {heroProducts[2].images?.[0] ? (
                  <Image src={heroProducts[2].images[0]} alt={heroProducts[2].title} fill className="object-cover object-center" />
                ) : (
                  <div className="w-full h-full" style={{ background: 'linear-gradient(135deg,#FDF0EA,#F5E6D3)' }} />
                )}
                <div className="absolute bottom-0 left-0 right-0 p-2" style={{ background: 'rgba(255,255,255,0.95)' }}>
                  <div className="text-xs font-bold" style={{ color: '#C4622D' }}>${heroProducts[2].price}</div>
                  <div className="text-[10px] truncate" style={{ color: '#6B6B6B' }}>{heroProducts[2].title}</div>
                </div>
              </Link>
            )}
          </div>
        )}
      </div>

      {/* How it works */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { num: '1', title: 'Browse & discover', desc: 'Explore authentic Habesha dresses from sellers across the US and beyond.' },
            { num: '2', title: 'Pay securely via Zelle', desc: 'Send payment through Zelle. Our admin verifies every transaction before processing.' },
            { num: '3', title: 'Receive your dress', desc: 'Track your order from seller to your door. Get notified every step of the way.' },
          ].map(step => (
            <div key={step.num} className="p-7 rounded-2xl" style={{ border: '1px solid #EBEBEB' }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base font-extrabold mb-5" style={{ background: '#FDF0EA', color: '#C4622D' }}>{step.num}</div>
              <div className="text-base font-bold mb-2" style={{ color: '#111111' }}>{step.title}</div>
              <div className="text-sm leading-relaxed" style={{ color: '#6B6B6B' }}>{step.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Products */}
      <div id="products" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <ProductGrid />
      </div>

      {/* Sell banner */}
      {!loading && userRole !== 'seller' && userRole !== 'admin' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <div className="rounded-2xl p-6 sm:p-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6" style={{ backgroundColor: '#C4622D' }}>
            <div>
              <div className="text-xl sm:text-2xl font-bold text-white leading-snug">Have a dress to sell?<br />Join our community of sellers.</div>
              <div className="text-sm mt-2" style={{ color: 'rgba(255,255,255,0.75)' }}>List your Habesha dress in minutes. We handle payments, you handle shipping.</div>
            </div>
            <Link
              href="/auth/signup"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-sm font-bold transition-all flex-shrink-0"
              style={{ backgroundColor: '#fff', color: '#C4622D' }}
            >
              Start Selling
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
