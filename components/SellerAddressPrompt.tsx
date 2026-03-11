'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface SellerAddressPromptProps {
  sellerId: string
  hasOrders: boolean
  onAddressAdded?: () => void
}

export default function SellerAddressPrompt({ sellerId, hasOrders, onAddressAdded }: SellerAddressPromptProps) {
  const [isOpen, setIsOpen] = useState(hasOrders)
  const [addressLine1, setAddressLine1] = useState('')
  const [addressLine2, setAddressLine2] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [zipCode, setZipCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        address_line1: addressLine1,
        address_line2: addressLine2 || null,
        city: city,
        state: state,
        zip_code: zipCode,
        country: 'USA',
      })
      .eq('id', sellerId)

    if (updateError) {
      setError(updateError.message)
      setLoading(false)
      return
    }

    setIsOpen(false)
    router.refresh()
    onAddressAdded?.()
  }

  if (!isOpen) return null

  const inputSt = { border: '1.5px solid #EBEBEB', background: '#F7F7F7', color: '#111111' }
  const onFocus = (e: React.FocusEvent<HTMLInputElement>) => { e.currentTarget.style.borderColor = '#C4622D'; e.currentTarget.style.background = '#fff' }
  const onBlur = (e: React.FocusEvent<HTMLInputElement>) => { e.currentTarget.style.borderColor = '#EBEBEB'; e.currentTarget.style.background = '#F7F7F7' }

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 z-50" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-7" style={{ border: '1px solid #EBEBEB' }}>
        <div className="mb-5">
          <h3 className="text-lg font-bold" style={{ color: '#111111' }}>Complete Your Shipping Address</h3>
          <p className="mt-1.5 text-sm" style={{ color: '#6B6B6B' }}>
            You have pending orders! Please provide your complete shipping address so buyers know where to return items if needed.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-xl p-4" style={{ background: '#FFF0F0', border: '1px solid #FFCCCC' }}>
              <p className="text-sm" style={{ color: '#CC3333' }}>{error}</p>
            </div>
          )}

          <div>
            <label htmlFor="address-line1" className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: '#6B6B6B' }}>
              Street Address <span style={{ color: '#C4622D' }}>*</span>
            </label>
            <input
              id="address-line1"
              type="text"
              required
              className="block w-full px-4 py-2.5 rounded-lg text-sm outline-none transition-all"
              style={inputSt}
              onFocus={onFocus}
              onBlur={onBlur}
              placeholder="123 Main St"
              value={addressLine1}
              onChange={(e) => setAddressLine1(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="address-line2" className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: '#6B6B6B' }}>
              Apartment, suite, etc. <span className="normal-case font-normal" style={{ color: '#9A9A9A' }}>(optional)</span>
            </label>
            <input
              id="address-line2"
              type="text"
              className="block w-full px-4 py-2.5 rounded-lg text-sm outline-none transition-all"
              style={inputSt}
              onFocus={onFocus}
              onBlur={onBlur}
              placeholder="Apt 4B"
              value={addressLine2}
              onChange={(e) => setAddressLine2(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="city" className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: '#6B6B6B' }}>
                City <span style={{ color: '#C4622D' }}>*</span>
              </label>
              <input
                id="city"
                type="text"
                required
                className="block w-full px-4 py-2.5 rounded-lg text-sm outline-none transition-all"
                style={inputSt}
                onFocus={onFocus}
                onBlur={onBlur}
                placeholder="New York"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="state" className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: '#6B6B6B' }}>
                State <span style={{ color: '#C4622D' }}>*</span>
              </label>
              <input
                id="state"
                type="text"
                required
                maxLength={2}
                className="block w-full px-4 py-2.5 rounded-lg text-sm outline-none transition-all uppercase"
                style={inputSt}
                onFocus={onFocus}
                onBlur={onBlur}
                placeholder="NY"
                value={state}
                onChange={(e) => setState(e.target.value.toUpperCase())}
              />
            </div>
          </div>

          <div>
            <label htmlFor="zip-code" className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: '#6B6B6B' }}>
              ZIP Code <span style={{ color: '#C4622D' }}>*</span>
            </label>
            <input
              id="zip-code"
              type="text"
              required
              maxLength={5}
              pattern="[0-9]{5}"
              className="block w-full px-4 py-2.5 rounded-lg text-sm outline-none transition-all"
              style={inputSt}
              onFocus={onFocus}
              onBlur={onBlur}
              placeholder="10001"
              value={zipCode}
              onChange={(e) => setZipCode(e.target.value.replace(/\D/g, '').slice(0, 5))}
            />
          </div>

          <div className="flex justify-end mt-6">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-full text-sm font-semibold text-white disabled:opacity-60 transition-all"
              style={{ backgroundColor: '#C4622D' }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.backgroundColor = '#A84F22' }}
              onMouseLeave={e => { if (!loading) e.currentTarget.style.backgroundColor = '#C4622D' }}
            >
              {loading ? 'Saving...' : 'Save Address'}
            </button>
          </div>
        </form>

        <p className="mt-4 text-xs" style={{ color: '#9A9A9A' }}>
          This address will be used as the return address on shipping labels.
        </p>
      </div>
    </div>
  )
}
