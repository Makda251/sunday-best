'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { UserRole } from '@/lib/types/database'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [role, setRole] = useState<UserRole>('buyer')
  const [addressLine1, setAddressLine1] = useState('')
  const [addressLine2, setAddressLine2] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [zipCode, setZipCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [signupSuccess, setSignupSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  // Password strength calculation
  const getPasswordStrength = (pwd: string) => {
    let strength = 0
    if (pwd.length >= 8) strength++
    if (pwd.length >= 12) strength++
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) strength++
    if (/\d/.test(pwd)) strength++
    if (/[^a-zA-Z0-9]/.test(pwd)) strength++
    return strength
  }

  const passwordStrength = getPasswordStrength(password)
  const getStrengthLabel = () => {
    if (password.length === 0) return ''
    if (passwordStrength <= 1) return 'Weak'
    if (passwordStrength <= 3) return 'Fair'
    if (passwordStrength <= 4) return 'Good'
    return 'Strong'
  }
  const getStrengthColor = () => {
    if (passwordStrength <= 1) return 'bg-red-500'
    if (passwordStrength <= 3) return 'bg-yellow-500'
    if (passwordStrength <= 4) return 'bg-blue-500'
    return 'bg-green-500'
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Check if email already exists
    const { data: existingUsers, error: checkError } = await supabase
      .from('profiles')
      .select('email, role')
      .eq('email', email.toLowerCase())
      .maybeSingle()

    if (checkError) {
      console.error('Error checking email:', checkError)
    }

    if (existingUsers) {
      setError(`An account with this email already exists as a ${existingUsers.role}. Please sign in instead.`)
      setLoading(false)
      return
    }

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone: phone || null,
          role,
          address_line1: addressLine1 || null,
          address_line2: addressLine2 || null,
          city: city || null,
          state: state || null,
          zip_code: zipCode || null,
        },
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    // Check if email confirmation is required
    if (data.session) {
      // User is logged in immediately (no email confirmation required)
      if (data.user) {
        // Update profile with additional info
        const updateData: Record<string, string | null> = {
          full_name: fullName,
          role,
        }

        if (phone) {
          updateData.phone = phone
        }

        // Add address fields for sellers
        if (role === 'seller') {
          updateData.address_line1 = addressLine1
          updateData.address_line2 = addressLine2 || null
          updateData.city = city
          updateData.state = state
          updateData.zip_code = zipCode
          updateData.country = 'USA'
        }

        const { error: profileError } = await supabase
          .from('profiles')
          .update(updateData)
          .eq('id', data.user.id)

        if (profileError) {
          console.error('Profile update error:', profileError)
        }

        router.push('/')
        router.refresh()
      }
    } else {
      // Email confirmation required - show success message
      setLoading(false)
      setSignupSuccess(true)
      setError('Success! Check your email to confirm your account.')
    }
  }

  const inputCls = 'appearance-none block w-full px-4 py-3 focus:outline-none transition'
  const inputSt = { border: '1.5px solid #EBEBEB', backgroundColor: '#F7F7F7', color: '#111111', borderRadius: '10px' }
  const onFocus = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => { e.currentTarget.style.borderColor = '#C4622D'; e.currentTarget.style.background = '#fff' }
  const onBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => { e.currentTarget.style.borderColor = '#EBEBEB'; e.currentTarget.style.background = '#F7F7F7' }
  const labelCls = 'block text-sm font-semibold mb-1.5'

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: '#FFFFFF' }}>
      <div className="max-w-md w-full mx-auto">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-4">
            <span className="text-3xl font-extrabold tracking-tight" style={{ color: '#C4622D' }}>Kemis<span style={{ color: '#111111' }}>House</span></span>
          </Link>
          <h2 className="text-2xl font-bold mt-4" style={{ color: '#111111' }}>Create your account</h2>
          <p className="mt-2 text-sm" style={{ color: '#6B6B6B' }}>
            Already have an account?{' '}
            <Link href="/auth/login" className="font-semibold" style={{ color: '#C4622D' }}>Sign in</Link>
          </p>
        </div>

        <div className="bg-white rounded-2xl p-8" style={{ border: '1px solid #EBEBEB', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
        {signupSuccess ? (
          /* Success message - hide the form */
          <div className="text-center py-8">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: '#FDF0EA' }}>
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#C4622D' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <h3 className="text-2xl font-bold mb-3" style={{ color: '#111111' }}>Account Created!</h3>
            <p className="text-sm mb-6" style={{ color: '#6B6B6B' }}>
              We sent a confirmation email to <span className="font-semibold" style={{ color: '#111111' }}>{email}</span>
            </p>
            <div className="rounded-xl p-5 mb-8 text-left" style={{ backgroundColor: '#F7F7F7', border: '1px solid #EBEBEB' }}>
              <p className="text-sm font-semibold mb-2" style={{ color: '#111111' }}>Next steps:</p>
              <ol className="text-sm space-y-2 list-decimal list-inside" style={{ color: '#6B6B6B' }}>
                <li>Check your email inbox (and spam folder)</li>
                <li>Click the confirmation link in the email</li>
                <li>Return here and sign in with your credentials</li>
              </ol>
            </div>
            <Link href="/auth/login" className="inline-flex items-center justify-center px-6 py-3 text-sm font-semibold text-white rounded-full transition" style={{ backgroundColor: '#C4622D' }}>
              Go to Sign In
            </Link>
          </div>
        ) : (
          <form className="space-y-5" onSubmit={handleSignup}>
          {error && (
            <div className="rounded-xl p-4" style={{ backgroundColor: '#FDF0EA', border: '1px solid #F0C9B2' }}>
              <p className="text-sm font-medium" style={{ color: '#C4622D' }}>{error}</p>
            </div>
          )}
          <div className="space-y-5">
            <div>
              <label htmlFor="full-name" className={labelCls} style={{ color: '#111111' }}>
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                id="full-name"
                name="fullName"
                type="text"
                required
                className={inputCls} style={inputSt} onFocus={onFocus} onBlur={onBlur}
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="email" className={labelCls} style={{ color: '#111111' }}>
                Email address <span className="text-red-500">*</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className={inputCls} style={inputSt} onFocus={onFocus} onBlur={onBlur}
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="phone" className={labelCls} style={{ color: '#111111' }}>
                Phone Number {role === 'seller' ? (
                  <span className="text-red-500">*</span>
                ) : (
                  <span className="text-gray-400 text-xs font-normal">(optional)</span>
                )}
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                required={role === 'seller'}
                className={inputCls} style={inputSt} onFocus={onFocus} onBlur={onBlur}
                placeholder="+1 (555) 123-4567"
                value={phone}
                onChange={(e) => {
                  // Only allow numbers, spaces, hyphens, parentheses, and plus sign
                  const cleaned = e.target.value.replace(/[^\d\s\-\(\)\+]/g, '')
                  setPhone(cleaned)
                }}
              />
              {role === 'seller' && (
                <p className="mt-1.5 text-xs" style={{ color: '#9A9A9A' }}>
                  Required for buyers and admins to contact you about orders
                </p>
              )}
            </div>

            {/* Address fields - only for sellers */}
            {role === 'seller' && (
              <>
                <div className="pt-5 mt-1 border-t border-gray-200">
                  <h3 className="text-base font-bold mb-1" style={{ color: '#111111' }}>Shipping Address</h3>
                  <p className="text-xs mb-5" style={{ color: '#6B6B6B' }}>Used as return address for orders</p>
                </div>

                <div>
                  <label htmlFor="address-line1" className={labelCls} style={{ color: '#111111' }}>
                    Street Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="address-line1"
                    name="addressLine1"
                    type="text"
                    required
                    className={inputCls} style={inputSt} onFocus={onFocus} onBlur={onBlur}
                    placeholder="123 Main St"
                    value={addressLine1}
                    onChange={(e) => setAddressLine1(e.target.value)}
                  />
                </div>

                <div>
                  <label htmlFor="address-line2" className={labelCls} style={{ color: '#111111' }}>
                    Apartment, suite, etc. <span className="text-gray-400 text-xs font-normal">(optional)</span>
                  </label>
                  <input
                    id="address-line2"
                    name="addressLine2"
                    type="text"
                    className={inputCls} style={inputSt} onFocus={onFocus} onBlur={onBlur}
                    placeholder="Apt 4B"
                    value={addressLine2}
                    onChange={(e) => setAddressLine2(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="city" className={labelCls} style={{ color: '#111111' }}>
                      City <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="city"
                      name="city"
                      type="text"
                      required
                      className={inputCls} style={inputSt} onFocus={onFocus} onBlur={onBlur}
                      placeholder="New York"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                    />
                  </div>

                  <div>
                    <label htmlFor="state" className={labelCls} style={{ color: '#111111' }}>
                      State <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="state"
                      name="state"
                      required
                      className={inputCls} style={inputSt} onFocus={onFocus} onBlur={onBlur}
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                    >
                      <option value="">Select</option>
                      <option value="AL">AL</option>
                      <option value="AK">AK</option>
                      <option value="AZ">AZ</option>
                      <option value="AR">AR</option>
                      <option value="CA">CA</option>
                      <option value="CO">CO</option>
                      <option value="CT">CT</option>
                      <option value="DE">DE</option>
                      <option value="FL">FL</option>
                      <option value="GA">GA</option>
                      <option value="HI">HI</option>
                      <option value="ID">ID</option>
                      <option value="IL">IL</option>
                      <option value="IN">IN</option>
                      <option value="IA">IA</option>
                      <option value="KS">KS</option>
                      <option value="KY">KY</option>
                      <option value="LA">LA</option>
                      <option value="ME">ME</option>
                      <option value="MD">MD</option>
                      <option value="MA">MA</option>
                      <option value="MI">MI</option>
                      <option value="MN">MN</option>
                      <option value="MS">MS</option>
                      <option value="MO">MO</option>
                      <option value="MT">MT</option>
                      <option value="NE">NE</option>
                      <option value="NV">NV</option>
                      <option value="NH">NH</option>
                      <option value="NJ">NJ</option>
                      <option value="NM">NM</option>
                      <option value="NY">NY</option>
                      <option value="NC">NC</option>
                      <option value="ND">ND</option>
                      <option value="OH">OH</option>
                      <option value="OK">OK</option>
                      <option value="OR">OR</option>
                      <option value="PA">PA</option>
                      <option value="RI">RI</option>
                      <option value="SC">SC</option>
                      <option value="SD">SD</option>
                      <option value="TN">TN</option>
                      <option value="TX">TX</option>
                      <option value="UT">UT</option>
                      <option value="VT">VT</option>
                      <option value="VA">VA</option>
                      <option value="WA">WA</option>
                      <option value="WV">WV</option>
                      <option value="WI">WI</option>
                      <option value="WY">WY</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="zip-code" className={labelCls} style={{ color: '#111111' }}>
                    ZIP Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="zip-code"
                    name="zipCode"
                    type="text"
                    required
                    maxLength={5}
                    pattern="[0-9]{5}"
                    className={inputCls} style={inputSt} onFocus={onFocus} onBlur={onBlur}
                    placeholder="10001"
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value.replace(/\D/g, '').slice(0, 5))}
                  />
                </div>
              </>
            )}

            <div>
              <label htmlFor="password" className={labelCls} style={{ color: '#111111' }}>
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  minLength={8}
                  className={inputCls + ' pr-12'} style={inputSt} onFocus={onFocus} onBlur={onBlur}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 transition" style={{ color: '#9A9A9A' }}
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

              {/* Password strength indicator */}
              {password.length > 0 && (
                <div className="mt-2">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${getStrengthColor()}`}
                        style={{ width: `${(passwordStrength / 5) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium min-w-[45px]" style={{ color: '#111111' }}>
                      {getStrengthLabel()}
                    </span>
                  </div>
                  <ul className="text-xs space-y-0.5" style={{ color: '#9A9A9A' }}>
                    <li className={password.length >= 8 ? 'text-green-600' : ''}>
                      {password.length >= 8 ? '✓' : '•'} At least 8 characters
                    </li>
                    <li className={/[a-z]/.test(password) && /[A-Z]/.test(password) ? 'text-green-600' : ''}>
                      {/[a-z]/.test(password) && /[A-Z]/.test(password) ? '✓' : '•'} Upper & lowercase letters
                    </li>
                    <li className={/\d/.test(password) ? 'text-green-600' : ''}>
                      {/\d/.test(password) ? '✓' : '•'} At least one number
                    </li>
                    <li className={/[^a-zA-Z0-9]/.test(password) ? 'text-green-600' : ''}>
                      {/[^a-zA-Z0-9]/.test(password) ? '✓' : '•'} Special character (!@#$%^&*)
                    </li>
                  </ul>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold mb-3" style={{ color: '#111111' }}>
                I want to <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label
                  className="relative flex items-center justify-center px-4 py-3 rounded-xl cursor-pointer transition"
                  style={{
                    border: role === 'buyer' ? '2px solid #C4622D' : '2px solid #EBEBEB',
                    background: role === 'buyer' ? '#FDF0EA' : '#fff',
                  }}
                >
                  <input
                    type="radio"
                    name="role"
                    value="buyer"
                    checked={role === 'buyer'}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="sr-only"
                  />
                  <div className="flex items-center space-x-2">
                    <svg className="w-5 h-5" style={{ color: role === 'buyer' ? '#C4622D' : '#9A9A9A' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                    <span className="text-sm font-medium" style={{ color: role === 'buyer' ? '#C4622D' : '#6B6B6B' }}>Buy</span>
                  </div>
                </label>

                <label
                  className="relative flex items-center justify-center px-4 py-3 rounded-xl cursor-pointer transition"
                  style={{
                    border: role === 'seller' ? '2px solid #C4622D' : '2px solid #EBEBEB',
                    background: role === 'seller' ? '#FDF0EA' : '#fff',
                  }}
                >
                  <input type="radio" name="role" value="seller" checked={role === 'seller'} onChange={(e) => setRole(e.target.value as UserRole)} className="sr-only" />
                  <div className="flex items-center space-x-2">
                    <svg className="w-5 h-5" style={{ color: role === 'seller' ? '#C4622D' : '#9A9A9A' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span className="text-sm font-medium" style={{ color: role === 'seller' ? '#C4622D' : '#6B6B6B' }}>Sell</span>
                  </div>
                </label>
              </div>
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
                  Creating account...
                </>
              ) : 'Create account'}
            </button>
          </div>
        </form>
        )}
        </div>
      </div>
    </div>
  )
}
