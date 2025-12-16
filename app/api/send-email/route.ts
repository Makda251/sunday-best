import { NextRequest, NextResponse } from 'next/server'
import { sendOrderPlacedEmail, sendPaymentVerifiedEmail, sendOrderShippedEmail, sendOrderCancelledEmail, sendProductApprovedEmail, sendProductRejectedEmail, sendAdminOrderNotification } from '@/lib/email'

export async function POST(request: NextRequest) {
  console.log('[Email API] Received email request')

  try {
    const body = await request.json()
    const { type, params } = body

    console.log('[Email API] Type:', type)
    console.log('[Email API] Recipient:', params.to)

    let result

    switch (type) {
      case 'order-placed':
        result = await sendOrderPlacedEmail(params)
        break
      case 'payment-verified':
        result = await sendPaymentVerifiedEmail(params)
        break
      case 'order-shipped':
        result = await sendOrderShippedEmail(params)
        break
      case 'order-cancelled':
        result = await sendOrderCancelledEmail(params)
        break
      case 'product-approved':
        result = await sendProductApprovedEmail(params)
        break
      case 'product-rejected':
        result = await sendProductRejectedEmail(params)
        break
      case 'admin-order-notification':
        result = await sendAdminOrderNotification(params)
        break
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid email type' },
          { status: 400 }
        )
    }

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Email API error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
