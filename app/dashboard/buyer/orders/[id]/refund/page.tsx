'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

type OrderDetails = {
  id: string
  order_number: string
  status: string
  refund_requested: boolean
  total: number
  product: {
    title: string
    images: string[]
  }
}

export default function RefundRequestPage({ params }: { params: { id: string } }) {
  const [order, setOrder] = useState<OrderDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [reason, setReason] = useState('')
  const [description, setDescription] = useState('')
  const [zelleName, setZelleName] = useState('')
  const [zelleEmail, setZelleEmail] = useState('')
  const [zellePhone, setZellePhone] = useState('')

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const fetchOrder = async () => {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth/login')
        return
      }

      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          status,
          refund_requested,
          total,
          product:products(title, images)
        `)
        .eq('id', params.id)
        .eq('buyer_id', user.id)
        .single()

      if (error || !data) {
        console.error('Error fetching order:', error)
        router.push('/dashboard/buyer/orders')
        return
      }

      // Check if order is eligible for refund
      if (data.status !== 'delivered') {
        alert('Refunds can only be requested for delivered orders')
        router.push(`/dashboard/buyer/orders/${params.id}`)
        return
      }

      if (data.refund_requested) {
        alert('A refund has already been requested for this order')
        router.push(`/dashboard/buyer/orders/${params.id}`)
        return
      }

      setOrder(data as unknown as OrderDetails)
      setLoading(false)
    }

    fetchOrder()
  }, [params.id, router, supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      if (!reason) {
        throw new Error('Please select a reason for the refund')
      }

      if (!description || description.trim().length < 20) {
        throw new Error('Please provide a detailed description (at least 20 characters)')
      }

      if (!zelleName || !zelleEmail && !zellePhone) {
        throw new Error('Please provide your Zelle name and at least one contact method (email or phone)')
      }

      const { error: updateError } = await supabase
        .from('orders')
        .update({
          refund_requested: true,
          refund_request_reason: reason,
          refund_request_description: description.trim(),
          refund_requested_at: new Date().toISOString(),
          refund_buyer_zelle_name: zelleName.trim(),
          refund_buyer_zelle_email: zelleEmail.trim() || null,
          refund_buyer_zelle_phone: zellePhone.trim() || null,
        })
        .eq('id', params.id)

      if (updateError) {
        throw updateError
      }

      // TODO: Send email notification to admin about refund request

      alert('Refund request submitted successfully! Our admin team will review it shortly.')
      router.push(`/dashboard/buyer/orders/${params.id}`)
    } catch (err: any) {
      console.error('Error submitting refund request:', err)
      setError(err.message || 'Failed to submit refund request')
      setSubmitting(false)
    }
  }

  if (loading || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link href={`/dashboard/buyer/orders/${params.id}`} className="text-indigo-600 hover:text-indigo-700 font-medium text-sm mb-6 inline-block">
          ← Back to Order
        </Link>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Request Refund</h1>
          <p className="text-sm text-gray-600 mb-4">Order {order.order_number}</p>

          {/* Order Info */}
          <div className="flex gap-4 p-4 bg-gray-50 rounded-lg">
            {order.product.images?.[0] && (
              <Image
                src={order.product.images[0]}
                alt={order.product.title}
                width={60}
                height={60}
                className="rounded object-cover"
              />
            )}
            <div>
              <p className="font-medium text-gray-900">{order.product.title}</p>
              <p className="text-sm text-gray-600 mt-1">Refund Amount: ${order.total.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Refund Policy */}
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-6 mb-6">
          <div className="flex gap-3">
            <svg className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <h3 className="font-semibold text-yellow-900 mb-2">Refund Policy</h3>
              <p className="text-sm text-yellow-800">
                Refunds are only granted for the following reasons:
              </p>
              <ul className="list-disc list-inside text-sm text-yellow-800 mt-2 space-y-1">
                <li><strong>Item Destroyed:</strong> The item arrived damaged or destroyed during shipping</li>
                <li><strong>Severe Misrepresentation:</strong> The item varies significantly from the description (color, size, condition, etc.)</li>
              </ul>
              <p className="text-sm text-yellow-800 mt-3">
                Please provide detailed photos and description to support your claim. All refund requests are reviewed by our admin team.
              </p>
            </div>
          </div>
        </div>

        {/* Refund Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Reason */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Reason for Refund <span className="text-red-500">*</span>
            </label>
            <div className="space-y-3">
              <label className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition ${
                reason === 'item_destroyed' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-gray-400'
              }`}>
                <input
                  type="radio"
                  name="reason"
                  value="item_destroyed"
                  checked={reason === 'item_destroyed'}
                  onChange={(e) => setReason(e.target.value)}
                  className="mt-1"
                  required
                />
                <div className="ml-3">
                  <p className="font-medium text-gray-900">Item Destroyed</p>
                  <p className="text-sm text-gray-600">The dress arrived damaged or destroyed during shipping</p>
                </div>
              </label>

              <label className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition ${
                reason === 'severe_misrepresentation' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-gray-400'
              }`}>
                <input
                  type="radio"
                  name="reason"
                  value="severe_misrepresentation"
                  checked={reason === 'severe_misrepresentation'}
                  onChange={(e) => setReason(e.target.value)}
                  className="mt-1"
                  required
                />
                <div className="ml-3">
                  <p className="font-medium text-gray-900">Severe Misrepresentation</p>
                  <p className="text-sm text-gray-600">The item is significantly different from the description</p>
                </div>
              </label>
            </div>
          </div>

          {/* Description */}
          <div className="mb-6">
            <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-2">
              Detailed Description <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-gray-500 mb-2">
              Please provide a detailed explanation of the issue. Include photos if possible by email.
            </p>
            <textarea
              id="description"
              rows={6}
              required
              minLength={20}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Describe the issue in detail... (minimum 20 characters)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <p className="text-xs text-gray-500 mt-1">{description.length} characters</p>
          </div>

          {/* Zelle Information for Refund */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-3">Refund Payment Information</h3>
            <p className="text-sm text-blue-800 mb-4">
              If your refund is approved, we'll send the money back to you via Zelle. Please provide your Zelle information below.
            </p>

            <div className="space-y-4">
              <div>
                <label htmlFor="zelleName" className="block text-sm font-semibold text-gray-700 mb-2">
                  Name on Zelle Account <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="zelleName"
                  required
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Full name as it appears on Zelle"
                  value={zelleName}
                  onChange={(e) => setZelleName(e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="zelleEmail" className="block text-sm font-semibold text-gray-700 mb-2">
                  Zelle Email or Phone <span className="text-xs text-gray-500">(at least one required)</span>
                </label>
                <input
                  type="email"
                  id="zelleEmail"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-3"
                  placeholder="email@example.com"
                  value={zelleEmail}
                  onChange={(e) => setZelleEmail(e.target.value)}
                />
                <input
                  type="tel"
                  id="zellePhone"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="+1 (555) 123-4567"
                  value={zellePhone}
                  onChange={(e) => setZellePhone(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit Refund Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
