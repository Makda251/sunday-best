'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import Image from 'next/image'

const US_STATES = [
  { value: 'AL', label: 'Alabama' }, { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' }, { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' }, { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' }, { value: 'DE', label: 'Delaware' },
  { value: 'FL', label: 'Florida' }, { value: 'GA', label: 'Georgia' },
  { value: 'HI', label: 'Hawaii' }, { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' }, { value: 'IN', label: 'Indiana' },
  { value: 'IA', label: 'Iowa' }, { value: 'KS', label: 'Kansas' },
  { value: 'KY', label: 'Kentucky' }, { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' }, { value: 'MD', label: 'Maryland' },
  { value: 'MA', label: 'Massachusetts' }, { value: 'MI', label: 'Michigan' },
  { value: 'MN', label: 'Minnesota' }, { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' }, { value: 'MT', label: 'Montana' },
  { value: 'NE', label: 'Nebraska' }, { value: 'NV', label: 'Nevada' },
  { value: 'NH', label: 'New Hampshire' }, { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' }, { value: 'NY', label: 'New York' },
  { value: 'NC', label: 'North Carolina' }, { value: 'ND', label: 'North Dakota' },
  { value: 'OH', label: 'Ohio' }, { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' }, { value: 'PA', label: 'Pennsylvania' },
  { value: 'RI', label: 'Rhode Island' }, { value: 'SC', label: 'South Carolina' },
  { value: 'SD', label: 'South Dakota' }, { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' }, { value: 'UT', label: 'Utah' },
  { value: 'VT', label: 'Vermont' }, { value: 'VA', label: 'Virginia' },
  { value: 'WA', label: 'Washington' }, { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' }, { value: 'WY', label: 'Wyoming' },
]

export default function SellPage() {
  const [step, setStep] = useState(1)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [photos, setPhotos] = useState<File[]>([])
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const inputCls = 'appearance-none block w-full px-4 py-3 focus:outline-none transition text-sm'
  const inputSt = { border: '1.5px solid #EBEBEB', backgroundColor: '#F7F7F7', color: '#111111', borderRadius: '10px' }
  const onFocus = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => { e.currentTarget.style.borderColor = '#C4622D'; e.currentTarget.style.background = '#fff' }
  const onBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => { e.currentTarget.style.borderColor = '#EBEBEB'; e.currentTarget.style.background = '#F7F7F7' }
  const labelCls = 'block text-sm font-semibold mb-1.5'

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (photos.length + files.length > 5) {
      setError('Maximum 5 photos allowed')
      return
    }
    setError(null)
    const newFiles = [...photos, ...files]
    setPhotos(newFiles)
    setPhotoPreviews(newFiles.map(f => URL.createObjectURL(f)))
    // Reset input so same file can be re-selected if removed
    e.target.value = ''
  }

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index))
    setPhotoPreviews(prev => prev.filter((_, i) => i !== index))
  }

  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setStep(2)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (photos.length < 2) {
      setError('Please upload at least 2 photos of your dresses')
      return
    }
    setLoading(true)
    setError(null)

    try {
      const photoUrls: string[] = []
      for (const photo of photos) {
        const ext = photo.name.split('.').pop() || 'jpg'
        const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('seller-application-photos')
          .upload(filename, photo)
        if (uploadError) throw uploadError
        const { data: { publicUrl } } = supabase.storage
          .from('seller-application-photos')
          .getPublicUrl(filename)
        photoUrls.push(publicUrl)
      }

      const { error: insertError } = await supabase
        .from('seller_applications')
        .insert({ full_name: fullName, email, phone, city, state, photos: photoUrls })
      if (insertError) throw insertError

      setSubmitted(true)
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen py-16 px-4" style={{ backgroundColor: '#FFFFFF' }}>
        <div className="max-w-md mx-auto text-center">
          <Link href="/" className="inline-block mb-10">
            <span className="text-2xl font-extrabold tracking-tight" style={{ color: '#C4622D' }}>Kemis<span style={{ color: '#111111' }}>House</span></span>
          </Link>
          <div className="bg-white rounded-2xl p-10" style={{ border: '1px solid #EBEBEB', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5" style={{ backgroundColor: '#FDF0EA' }}>
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#C4622D' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-3" style={{ color: '#111111' }}>Application received!</h2>
            <p className="text-sm leading-relaxed mb-2" style={{ color: '#6B6B6B' }}>
              Thanks, <span className="font-semibold" style={{ color: '#111111' }}>{fullName}</span>!
            </p>
            <p className="text-sm leading-relaxed mb-8" style={{ color: '#6B6B6B' }}>
              We&apos;ll review your application and reach out at{' '}
              <span className="font-semibold" style={{ color: '#111111' }}>{email}</span> within 48 hours.
            </p>
            <p className="text-sm" style={{ color: '#9A9A9A' }}>Keep an eye on your inbox — we&apos;ll be in touch soon.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-12 px-4" style={{ backgroundColor: '#FFFFFF' }}>
      <div className="max-w-md mx-auto">

        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-5">
            <span className="text-2xl font-extrabold tracking-tight" style={{ color: '#C4622D' }}>Kemis<span style={{ color: '#111111' }}>House</span></span>
          </Link>

          {/* US-only badge */}
          <div className="flex justify-center mb-5">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium" style={{ backgroundColor: '#FDF0EA', color: '#C4622D', border: '1px solid #F0C9B2' }}>
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" />
              </svg>
              US sellers &amp; buyers only — all 50 states
            </div>
          </div>

          <h1 className="text-2xl font-bold" style={{ color: '#111111' }}>Sell your Habesha dress</h1>
          <p className="mt-2 text-sm" style={{ color: '#6B6B6B' }}>Apply in 2 minutes. We&apos;ll get back to you within 48 hours.</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center mb-8">
          {[
            { n: 1, label: 'Your info' },
            { n: 2, label: 'Your photos' },
          ].map(({ n, label }, i) => (
            <div key={n} className="flex items-center flex-1">
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{
                    backgroundColor: step >= n ? '#C4622D' : '#F7F7F7',
                    color: step >= n ? '#fff' : '#9A9A9A',
                    border: step >= n ? 'none' : '1.5px solid #EBEBEB',
                  }}
                >
                  {step > n ? (
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : n}
                </div>
                <span className="text-xs font-medium" style={{ color: step >= n ? '#111111' : '#9A9A9A' }}>{label}</span>
              </div>
              {i < 1 && (
                <div className="flex-1 h-px mx-3" style={{ backgroundColor: step > n ? '#C4622D' : '#EBEBEB' }} />
              )}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl p-8" style={{ border: '1px solid #EBEBEB', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
          {error && (
            <div className="rounded-xl p-4 mb-5" style={{ backgroundColor: '#FDF0EA', border: '1px solid #F0C9B2' }}>
              <p className="text-sm font-medium" style={{ color: '#C4622D' }}>{error}</p>
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleStep1} className="space-y-5">
              <div>
                <label className={labelCls} style={{ color: '#111111' }}>Full Name <span className="text-red-500">*</span></label>
                <input
                  type="text" required value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="Jane Doe"
                  className={inputCls} style={inputSt} onFocus={onFocus} onBlur={onBlur}
                />
              </div>
              <div>
                <label className={labelCls} style={{ color: '#111111' }}>Email <span className="text-red-500">*</span></label>
                <input
                  type="email" required value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className={inputCls} style={inputSt} onFocus={onFocus} onBlur={onBlur}
                />
              </div>
              <div>
                <label className={labelCls} style={{ color: '#111111' }}>Phone <span className="text-red-500">*</span></label>
                <input
                  type="tel" required value={phone}
                  onChange={e => setPhone(e.target.value.replace(/[^\d\s\-\(\)\+]/g, ''))}
                  placeholder="+1 (555) 123-4567"
                  className={inputCls} style={inputSt} onFocus={onFocus} onBlur={onBlur}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls} style={{ color: '#111111' }}>City <span className="text-red-500">*</span></label>
                  <input
                    type="text" required value={city}
                    onChange={e => setCity(e.target.value)}
                    placeholder="New York"
                    className={inputCls} style={inputSt} onFocus={onFocus} onBlur={onBlur}
                  />
                </div>
                <div>
                  <label className={labelCls} style={{ color: '#111111' }}>State <span className="text-red-500">*</span></label>
                  <select
                    required value={state}
                    onChange={e => setState(e.target.value)}
                    className={inputCls} style={inputSt} onFocus={onFocus} onBlur={onBlur}
                  >
                    <option value="">Select</option>
                    {US_STATES.map(s => (
                      <option key={s.value} value={s.value}>{s.value} — {s.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full flex justify-center items-center gap-2 px-4 py-3.5 text-sm font-semibold rounded-full text-white transition"
                  style={{ backgroundColor: '#C4622D' }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#A84F22'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = '#C4622D'}
                >
                  Continue
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className={labelCls} style={{ color: '#111111' }}>
                  Dress Photos <span className="text-red-500">*</span>
                </label>
                <div className="mb-4 rounded-xl p-4 space-y-2" style={{ backgroundColor: '#F7F7F7', border: '1px solid #EBEBEB' }}>
                  <p className="text-xs font-semibold" style={{ color: '#111111' }}>What to include (2–5 photos):</p>
                  <ul className="text-xs space-y-1.5" style={{ color: '#6B6B6B' }}>
                    <li className="flex items-start gap-2">
                      <span style={{ color: '#C4622D' }}>•</span>
                      <span><span className="font-medium" style={{ color: '#111111' }}>Wearing the dress</span> — front and back. You can crop your face if you prefer.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span style={{ color: '#C4622D' }}>•</span>
                      <span><span className="font-medium" style={{ color: '#111111' }}>Close-up of the embroidery</span> or design details.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span style={{ color: '#C4622D' }}>•</span>
                      <span><span className="font-medium" style={{ color: '#111111' }}>Any flaws or defects</span> (stains, tears, fading) — be transparent, buyers appreciate honesty.</span>
                    </li>
                  </ul>
                  <p className="text-xs pt-1" style={{ color: '#9A9A9A' }}>Good lighting makes a big difference. Natural daylight works best.</p>
                </div>

                {photoPreviews.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {photoPreviews.map((src, i) => (
                      <div key={i} className="relative rounded-xl overflow-hidden" style={{ aspectRatio: '3/4', backgroundColor: '#F7F7F7' }}>
                        <Image src={src} alt={`Photo ${i + 1}`} fill className="object-cover" unoptimized />
                        <button
                          type="button"
                          onClick={() => removePhoto(i)}
                          className="absolute top-1 right-1 w-6 h-6 rounded-full flex items-center justify-center text-white"
                          style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                    {photos.length < 5 && (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="rounded-xl flex flex-col items-center justify-center gap-1 transition-colors hover:bg-[#F0E8E0]"
                        style={{ aspectRatio: '3/4', border: '1.5px dashed #D4D4D4', backgroundColor: '#F7F7F7' }}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#9A9A9A' }}>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span className="text-xs" style={{ color: '#9A9A9A' }}>Add</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full rounded-xl flex flex-col items-center justify-center gap-3 p-10 transition-colors hover:bg-[#F0E8E0]"
                    style={{ border: '1.5px dashed #D4D4D4', backgroundColor: '#F7F7F7' }}
                  >
                    <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#FDF0EA' }}>
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#C4622D' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold" style={{ color: '#111111' }}>Upload dress photos</p>
                      <p className="text-xs mt-1" style={{ color: '#9A9A9A' }}>JPG, PNG — up to 10MB each</p>
                    </div>
                  </button>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handlePhotoChange}
                />
                <p className="text-xs mt-2" style={{ color: '#9A9A9A' }}>
                  {photos.length}/5 photos added {photos.length < 2 && '(minimum 2)'}
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 px-4 py-3.5 text-sm font-semibold rounded-full transition hover:bg-[#F7F7F7]"
                  style={{ border: '1.5px solid #D4D4D4', color: '#6B6B6B' }}
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading || photos.length < 2}
                  className="flex-1 flex justify-center items-center gap-2 px-4 py-3.5 text-sm font-semibold rounded-full text-white disabled:opacity-50 disabled:cursor-not-allowed transition"
                  style={{ backgroundColor: '#C4622D' }}
                  onMouseEnter={e => { if (!loading) e.currentTarget.style.backgroundColor = '#A84F22' }}
                  onMouseLeave={e => { if (!loading) e.currentTarget.style.backgroundColor = '#C4622D' }}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Submitting...
                    </>
                  ) : 'Submit application'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
