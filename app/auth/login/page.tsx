'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/')
      router.refresh()
    }
  }

  const inputStyle = { border: '1.5px solid #EBEBEB', backgroundColor: '#F7F7F7', color: '#111111', borderRadius: '10px' }
  const inputFocus = (e: React.FocusEvent<HTMLInputElement>) => { e.currentTarget.style.borderColor = '#C4622D'; e.currentTarget.style.background = '#fff' }
  const inputBlur = (e: React.FocusEvent<HTMLInputElement>) => { e.currentTarget.style.borderColor = '#EBEBEB'; e.currentTarget.style.background = '#F7F7F7' }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: '#FFFFFF' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-6">
            <span className="text-3xl font-extrabold tracking-tight" style={{ color: '#C4622D' }}>Kemis<span style={{ color: '#111111' }}>House</span></span>
          </Link>
          <h2 className="text-2xl font-bold" style={{ color: '#111111' }}>Welcome back</h2>
          <p className="mt-2 text-sm" style={{ color: '#6B6B6B' }}>
            Don&apos;t have an account?{' '}
            <Link href="/auth/signup" className="font-semibold" style={{ color: '#C4622D' }}>Sign up</Link>
          </p>
        </div>

        <div className="bg-white rounded-2xl p-8" style={{ border: '1px solid #EBEBEB', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
          <form className="space-y-5" onSubmit={handleLogin}>
            {error && (
              <div className="rounded-xl p-4" style={{ backgroundColor: '#FDF0EA', border: '1px solid #F0C9B2' }}>
                <p className="text-sm font-medium" style={{ color: '#C4622D' }}>{error}</p>
              </div>
            )}
            <div>
              <label htmlFor="email-address" className="block text-sm font-semibold mb-1.5" style={{ color: '#111111' }}>Email address</label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none block w-full px-4 py-3 focus:outline-none transition"
                style={inputStyle}
                onFocus={inputFocus}
                onBlur={inputBlur}
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-semibold mb-1.5" style={{ color: '#111111' }}>Password</label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  className="appearance-none block w-full px-4 py-3 pr-12 focus:outline-none transition"
                  style={inputStyle}
                  onFocus={inputFocus}
                  onBlur={inputBlur}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 transition"
                  style={{ color: '#9A9A9A' }}
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 px-4 py-3.5 text-sm font-semibold rounded-full text-white disabled:opacity-50 disabled:cursor-not-allowed transition"
                style={{ backgroundColor: '#C4622D' }}
                onMouseEnter={e => { if (!loading) e.currentTarget.style.backgroundColor = '#A84F22' }}
                onMouseLeave={e => { if (!loading) e.currentTarget.style.backgroundColor = '#C4622D' }}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </>
                ) : 'Sign in'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
