import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Image from 'next/image'

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { id } = await params

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const { data: order } = await supabase
    .from('orders')
    .select(`
      *,
      buyer:profiles!buyer_id(full_name, email),
      seller:profiles!seller_id(full_name, email),
      order_items(*, product:products(*))
    `)
    .eq('id', id)
    .single()

  if (!order) {
    redirect('/')
  }

  // Check if user is authorized to view this order
  if (order.buyer_id !== user.id && order.seller_id !== user.id) {
    redirect('/')
  }

  const isBuyer = order.buyer_id === user.id
  const isSeller = order.seller_id === user.id

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Success Message for Buyers */}
        {isBuyer && order.status === 'pending_payment' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
            <h2 className="text-2xl font-bold text-green-900 mb-2">Order Placed Successfully!</h2>
            <p className="text-green-700">
              We're verifying your payment. You'll receive an email notification once your payment is confirmed and the seller ships your order.
            </p>
          </div>
        )}

        {/* Order Header */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Order #{order.id.slice(0, 8)}</h1>
              <p className="text-sm text-gray-500 mt-1">
                Placed on {new Date(order.created_at).toLocaleDateString()}
              </p>
            </div>
            <div className="text-right">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                order.status === 'pending_payment' ? 'bg-yellow-100 text-yellow-800' :
                order.status === 'payment_verified' ? 'bg-blue-100 text-blue-800' :
                order.status === 'shipped' ? 'bg-purple-100 text-purple-800' :
                order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {order.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </span>
            </div>
          </div>

          {/* Tracking Info */}
          {order.tracking_number && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm font-medium text-blue-900">Tracking Number:</p>
              <p className="text-lg font-mono text-blue-700">{order.tracking_number}</p>
            </div>
          )}
        </div>

        {/* Order Items */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Order Items</h2>
          <ul className="divide-y divide-gray-200">
            {order.order_items?.map((item: any) => (
              <li key={item.id} className="py-4 flex items-center">
                <div className="flex-shrink-0 w-20 h-20 bg-gray-200 rounded-md overflow-hidden">
                  {item.product_image ? (
                    <Image
                      src={item.product_image}
                      alt={item.product_title}
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                      No image
                    </div>
                  )}
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-base font-medium text-gray-900">{item.product_title}</p>
                  <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                </div>
                <p className="text-base font-medium text-gray-900">${item.product_price}</p>
              </li>
            ))}
          </ul>

          <div className="mt-6 border-t pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-medium text-gray-900">${order.subtotal}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Shipping</span>
              <span className="font-medium text-gray-900">
                {order.shipping_cost === 0 ? (
                  <span className="text-green-600">FREE</span>
                ) : (
                  `$${order.shipping_cost}`
                )}
              </span>
            </div>
            <div className="border-t pt-2 flex justify-between text-base font-medium">
              <span className="text-gray-900">Total</span>
              <span className="text-gray-900">${order.total}</span>
            </div>
          </div>
        </div>

        {/* Shipping Address */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Shipping Address</h2>
          <address className="text-sm text-gray-600 not-italic">
            {order.shipping_address_line1}<br />
            {order.shipping_address_line2 && <>{order.shipping_address_line2}<br /></>}
            {order.shipping_city}, {order.shipping_state} {order.shipping_zip}<br />
            {order.shipping_country}
          </address>
        </div>

        {/* Payment Information */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Payment Information</h2>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Payment Method</span>
              <span className="font-medium text-gray-900 uppercase">{order.payment_method}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Payment Status</span>
              <span className={`font-medium ${
                order.payment_status === 'verified' ? 'text-green-600' :
                order.payment_status === 'pending' ? 'text-yellow-600' :
                'text-red-600'
              }`}>
                {order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
              </span>
            </div>
            {order.payment_screenshot_url && (
              <div className="mt-4">
                <p className="text-sm text-gray-600 mb-2">Payment Screenshot:</p>
                <Image
                  src={order.payment_screenshot_url}
                  alt="Payment screenshot"
                  width={300}
                  height={200}
                  className="rounded border"
                />
              </div>
            )}
          </div>
        </div>

        {/* Seller Info */}
        {isBuyer && (
          <div className="bg-white shadow rounded-lg p-6 mt-6">
            <h2 className="text-lg font-medium text-gray-900 mb-2">Seller Information</h2>
            <p className="text-sm text-gray-600">{order.seller?.full_name || 'Anonymous Seller'}</p>
          </div>
        )}
      </div>
    </div>
  )
}
