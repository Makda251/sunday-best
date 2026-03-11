'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type SellerProfile = {
  id: string
  email: string
  full_name: string
  phone: string | null
  address_line1: string | null
  address_line2: string | null
  city: string | null
  state: string | null
  zip_code: string | null
  country: string | null
}

export default function SellerProfilePage() {
  const [profile, setProfile] = useState<SellerProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Form fields
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [addressLine1, setAddressLine1] = useState('')
  const [addressLine2, setAddressLine2] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [zipCode, setZipCode] = useState('')

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth/login')
        return
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error || !data) {
        console.error('Error fetching profile:', error)
        setError('Failed to load profile')
        setLoading(false)
        return
      }

      if (data.role !== 'seller') {
        router.push('/')
        return
      }

      setProfile(data as SellerProfile)
      setFullName(data.full_name || '')
      setPhone(data.phone || '')
      setAddressLine1(data.address_line1 || '')
      setAddressLine2(data.address_line2 || '')
      setCity(data.city || '')
      setState(data.state || '')
      setZipCode(data.zip_code || '')
      setLoading(false)
    }

    fetchProfile()
  }, [router, supabase])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      if (!profile) return

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          phone: phone || null,
          address_line1: addressLine1 || null,
          address_line2: addressLine2 || null,
          city: city || null,
          state: state || null,
          zip_code: zipCode || null,
        })
        .eq('id', profile.id)

      if (updateError) throw updateError

      setSuccess('Profile updated successfully!')
      setEditing(false)

      // Refresh profile data
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profile.id)
        .single()

      if (data) {
        setProfile(data as SellerProfile)
      }
    } catch (err: any) {
      console.error('Error updating profile:', err)
      setError(err.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    if (!profile) return
    setFullName(profile.full_name || '')
    setPhone(profile.phone || '')
    setAddressLine1(profile.address_line1 || '')
    setAddressLine2(profile.address_line2 || '')
    setCity(profile.city || '')
    setState(profile.state || '')
    setZipCode(profile.zip_code || '')
    setEditing(false)
    setError(null)
    setSuccess(null)
  }

  if (loading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#FFFFFF' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 mx-auto" style={{ borderColor: '#C4622D' }}></div>
          <p className="mt-4 text-sm" style={{ color: '#6B6B6B' }}>Loading profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-8" style={{ backgroundColor: '#FFFFFF' }}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link href="/dashboard/seller" className="font-medium text-sm mb-6 inline-block" style={{ color: '#C4622D' }}>
          ← Back to Dashboard
        </Link>

        <div className="bg-white rounded-2xl" style={{ border: '1px solid #EBEBEB' }}>
          <div className="px-6 py-5 flex justify-between items-center" style={{ borderBottom: '1px solid #EBEBEB' }}>
            <div>
              <h1 className="text-xl font-bold" style={{ color: '#111111' }}>My Profile</h1>
              <p className="text-sm mt-0.5" style={{ color: '#6B6B6B' }}>View and manage your seller information</p>
            </div>
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="px-5 py-2 text-white text-sm font-semibold rounded-full transition-all"
                style={{ backgroundColor: '#C4622D' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#A84F22'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = '#C4622D'}
              >
                Edit Profile
              </button>
            )}
          </div>

          <div className="p-6">
            {error && (
              <div className="mb-5 p-4 rounded-xl" style={{ background: '#FFF0F0', border: '1px solid #FFCCCC' }}>
                <p className="text-sm" style={{ color: '#CC3333' }}>{error}</p>
              </div>
            )}

            {success && (
              <div className="mb-5 p-4 rounded-xl" style={{ background: '#F0FFF4', border: '1px solid #BBF7D0' }}>
                <p className="text-sm" style={{ color: '#166534' }}>{success}</p>
              </div>
            )}

            {editing ? (
              <form onSubmit={handleSave} className="space-y-5">
                <div>
                  <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: '#6B6B6B' }}>Email</label>
                  <input
                    type="email"
                    id="email"
                    disabled
                    value={profile.email}
                    className="w-full rounded-lg px-4 py-2.5 text-sm cursor-not-allowed"
                    style={{ border: '1.5px solid #EBEBEB', background: '#F7F7F7', color: '#9A9A9A' }}
                  />
                  <p className="text-xs mt-1" style={{ color: '#9A9A9A' }}>Email cannot be changed</p>
                </div>

                <div>
                  <label htmlFor="fullName" className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: '#6B6B6B' }}>
                    Full Name <span style={{ color: '#C4622D' }}>*</span>
                  </label>
                  <input
                    type="text"
                    id="fullName"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full rounded-lg px-4 py-2.5 text-sm outline-none transition-all"
                    style={{ border: '1.5px solid #EBEBEB', background: '#F7F7F7', color: '#111111' }}
                    onFocus={e => { e.currentTarget.style.borderColor = '#C4622D'; e.currentTarget.style.background = '#fff' }}
                    onBlur={e => { e.currentTarget.style.borderColor = '#EBEBEB'; e.currentTarget.style.background = '#F7F7F7' }}
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: '#6B6B6B' }}>
                    Phone Number <span style={{ color: '#C4622D' }}>*</span>
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    required
                    value={phone}
                    onChange={(e) => {
                      const cleaned = e.target.value.replace(/[^\d\s\-\(\)\+]/g, '')
                      setPhone(cleaned)
                    }}
                    className="w-full rounded-lg px-4 py-2.5 text-sm outline-none transition-all"
                    style={{ border: '1.5px solid #EBEBEB', background: '#F7F7F7', color: '#111111' }}
                    onFocus={e => { e.currentTarget.style.borderColor = '#C4622D'; e.currentTarget.style.background = '#fff' }}
                    onBlur={e => { e.currentTarget.style.borderColor = '#EBEBEB'; e.currentTarget.style.background = '#F7F7F7' }}
                    placeholder="+1 (555) 123-4567"
                  />
                  <p className="text-xs mt-1" style={{ color: '#9A9A9A' }}>Used for order notifications and customer contact</p>
                </div>

                <div className="pt-4" style={{ borderTop: '1px solid #EBEBEB' }}>
                  <h3 className="text-sm font-bold mb-1" style={{ color: '#111111' }}>Return Address</h3>
                  <p className="text-xs mb-4" style={{ color: '#6B6B6B' }}>This address is used as the return address for your orders</p>

                  <div className="space-y-4">
                    <div>
                      <label htmlFor="addressLine1" className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: '#6B6B6B' }}>Street Address</label>
                      <input
                        type="text"
                        id="addressLine1"
                        value={addressLine1}
                        onChange={(e) => setAddressLine1(e.target.value)}
                        className="w-full rounded-lg px-4 py-2.5 text-sm outline-none transition-all"
                        style={{ border: '1.5px solid #EBEBEB', background: '#F7F7F7', color: '#111111' }}
                        onFocus={e => { e.currentTarget.style.borderColor = '#C4622D'; e.currentTarget.style.background = '#fff' }}
                        onBlur={e => { e.currentTarget.style.borderColor = '#EBEBEB'; e.currentTarget.style.background = '#F7F7F7' }}
                        placeholder="123 Main St"
                      />
                    </div>

                    <div>
                      <label htmlFor="addressLine2" className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: '#6B6B6B' }}>
                        Apt, suite, etc. <span className="normal-case font-normal" style={{ color: '#9A9A9A' }}>(optional)</span>
                      </label>
                      <input
                        type="text"
                        id="addressLine2"
                        value={addressLine2}
                        onChange={(e) => setAddressLine2(e.target.value)}
                        className="w-full rounded-lg px-4 py-2.5 text-sm outline-none transition-all"
                        style={{ border: '1.5px solid #EBEBEB', background: '#F7F7F7', color: '#111111' }}
                        onFocus={e => { e.currentTarget.style.borderColor = '#C4622D'; e.currentTarget.style.background = '#fff' }}
                        onBlur={e => { e.currentTarget.style.borderColor = '#EBEBEB'; e.currentTarget.style.background = '#F7F7F7' }}
                        placeholder="Apt 4B"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="city" className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: '#6B6B6B' }}>City</label>
                        <input
                          type="text"
                          id="city"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          className="w-full rounded-lg px-4 py-2.5 text-sm outline-none transition-all"
                          style={{ border: '1.5px solid #EBEBEB', background: '#F7F7F7', color: '#111111' }}
                          onFocus={e => { e.currentTarget.style.borderColor = '#C4622D'; e.currentTarget.style.background = '#fff' }}
                          onBlur={e => { e.currentTarget.style.borderColor = '#EBEBEB'; e.currentTarget.style.background = '#F7F7F7' }}
                          placeholder="New York"
                        />
                      </div>

                      <div>
                        <label htmlFor="state" className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: '#6B6B6B' }}>State</label>
                        <select
                          id="state"
                          value={state}
                          onChange={(e) => setState(e.target.value)}
                          className="w-full rounded-lg px-4 py-2.5 text-sm outline-none transition-all"
                          style={{ border: '1.5px solid #EBEBEB', background: '#F7F7F7', color: '#111111' }}
                          onFocus={e => { e.currentTarget.style.borderColor = '#C4622D'; e.currentTarget.style.background = '#fff' }}
                          onBlur={e => { e.currentTarget.style.borderColor = '#EBEBEB'; e.currentTarget.style.background = '#F7F7F7' }}
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
                      <label htmlFor="zipCode" className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: '#6B6B6B' }}>ZIP Code</label>
                      <input
                        type="text"
                        id="zipCode"
                        maxLength={5}
                        value={zipCode}
                        onChange={(e) => setZipCode(e.target.value.replace(/\D/g, '').slice(0, 5))}
                        className="w-full rounded-lg px-4 py-2.5 text-sm outline-none transition-all"
                        style={{ border: '1.5px solid #EBEBEB', background: '#F7F7F7', color: '#111111' }}
                        onFocus={e => { e.currentTarget.style.borderColor = '#C4622D'; e.currentTarget.style.background = '#fff' }}
                        onBlur={e => { e.currentTarget.style.borderColor = '#EBEBEB'; e.currentTarget.style.background = '#F7F7F7' }}
                        placeholder="10001"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="flex-1 px-6 py-2.5 text-sm font-semibold rounded-full transition-all"
                    style={{ border: '1.5px solid #D4D4D4', color: '#6B6B6B' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#6B6B6B'; e.currentTarget.style.color = '#111111' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#D4D4D4'; e.currentTarget.style.color = '#6B6B6B' }}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 px-6 py-2.5 text-sm text-white font-semibold rounded-full transition-all disabled:opacity-50"
                    style={{ backgroundColor: '#C4622D' }}
                    onMouseEnter={e => { if (!saving) e.currentTarget.style.backgroundColor = '#A84F22' }}
                    onMouseLeave={e => { if (!saving) e.currentTarget.style.backgroundColor = '#C4622D' }}
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: '#6B6B6B' }}>Email</label>
                  <p className="text-sm" style={{ color: '#111111' }}>{profile.email}</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: '#6B6B6B' }}>Full Name</label>
                  <p className="text-sm" style={{ color: '#111111' }}>{profile.full_name || 'Not provided'}</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: '#6B6B6B' }}>Phone Number</label>
                  <p className="text-sm" style={{ color: '#111111' }}>{profile.phone || 'Not provided'}</p>
                </div>
                <div className="pt-4" style={{ borderTop: '1px solid #EBEBEB' }}>
                  <h3 className="text-sm font-bold mb-3" style={{ color: '#111111' }}>Return Address</h3>
                  {profile.address_line1 ? (
                    <div className="text-sm space-y-0.5" style={{ color: '#111111' }}>
                      <p>{profile.address_line1}</p>
                      {profile.address_line2 && <p>{profile.address_line2}</p>}
                      <p>{profile.city}, {profile.state} {profile.zip_code}</p>
                      <p>{profile.country || 'USA'}</p>
                    </div>
                  ) : (
                    <p className="text-sm" style={{ color: '#9A9A9A' }}>No address provided</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
