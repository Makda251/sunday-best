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

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Complete Your Shipping Address</h3>
          <p className="mt-2 text-sm text-gray-600">
            You have pending orders! Please provide your complete shipping address so buyers know where to return items if needed.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div>
            <label htmlFor="address-line1" className="block text-sm font-medium text-gray-700">
              Street Address <span className="text-red-600">*</span>
            </label>
            <input
              id="address-line1"
              type="text"
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="123 Main St"
              value={addressLine1}
              onChange={(e) => setAddressLine1(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="address-line2" className="block text-sm font-medium text-gray-700">
              Apartment, suite, etc. <span className="text-gray-400 text-xs">(optional)</span>
            </label>
            <input
              id="address-line2"
              type="text"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Apt 4B"
              value={addressLine2}
              onChange={(e) => setAddressLine2(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                City <span className="text-red-600">*</span>
              </label>
              <input
                id="city"
                type="text"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="New York"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="state" className="block text-sm font-medium text-gray-700">
                State <span className="text-red-600">*</span>
              </label>
              <input
                id="state"
                type="text"
                required
                maxLength={2}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm uppercase"
                placeholder="NY"
                value={state}
                onChange={(e) => setState(e.target.value.toUpperCase())}
              />
            </div>
          </div>

          <div>
            <label htmlFor="zip-code" className="block text-sm font-medium text-gray-700">
              ZIP Code <span className="text-red-600">*</span>
            </label>
            <input
              id="zip-code"
              type="text"
              required
              maxLength={5}
              pattern="[0-9]{5}"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="10001"
              value={zipCode}
              onChange={(e) => setZipCode(e.target.value.replace(/\D/g, '').slice(0, 5))}
            />
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex justify-center px-4 py-2 border border-transparent text-sm font-semibold rounded-lg text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition shadow-md hover:shadow-lg"
            >
              {loading ? 'Saving...' : 'Save Address'}
            </button>
          </div>
        </form>

        <p className="mt-4 text-xs text-gray-500">
          This address will be used as the return address on shipping labels.
        </p>
      </div>
    </div>
  )
}
