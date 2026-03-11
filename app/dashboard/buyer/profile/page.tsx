'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type BuyerProfile = {
  id: string
  email: string
  full_name: string
  phone: string | null
}

export default function BuyerProfilePage() {
  const [profile, setProfile] = useState<BuyerProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Form fields
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')

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

      if (data.role !== 'buyer') {
        router.push('/')
        return
      }

      setProfile(data as BuyerProfile)
      setFullName(data.full_name || '')
      setPhone(data.phone || '')
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
        setProfile(data as BuyerProfile)
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
        <Link href="/" className="font-medium text-sm mb-6 inline-block" style={{ color: '#C4622D' }}>
          ← Back to Home
        </Link>

        <div className="bg-white rounded-2xl" style={{ border: '1px solid #EBEBEB' }}>
          <div className="px-6 py-5 flex justify-between items-center" style={{ borderBottom: '1px solid #EBEBEB' }}>
            <div>
              <h1 className="text-xl font-bold" style={{ color: '#111111' }}>My Profile</h1>
              <p className="text-sm mt-0.5" style={{ color: '#6B6B6B' }}>View and manage your account information</p>
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
                    Phone Number <span className="normal-case font-normal" style={{ color: '#9A9A9A' }}>(optional)</span>
                  </label>
                  <input
                    type="tel"
                    id="phone"
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
                  <p className="text-xs mt-1" style={{ color: '#9A9A9A' }}>Optional contact number for order updates</p>
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
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-[#6B6B6B] mb-2">Email</label>
                  <p className="text-[#111111]">{profile.email}</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#6B6B6B] mb-2">Full Name</label>
                  <p className="text-[#111111]">{profile.full_name || 'Not provided'}</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#6B6B6B] mb-2">Phone Number</label>
                  <p className="text-[#111111]">{profile.phone || 'Not provided'}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-5">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">Shipping Addresses</h3>
          <p className="text-sm text-blue-800">
            Your shipping addresses are managed during checkout. Each order can have a different shipping address.
          </p>
        </div>
      </div>
    </div>
  )
}
