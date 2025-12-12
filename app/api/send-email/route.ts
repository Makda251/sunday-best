import { NextRequest, NextResponse } from 'next/server'
import { sendOrderPlacedEmail, sendPaymentVerifiedEmail, sendOrderShippedEmail, sendOrderCancelledEmail, sendProductApprovedEmail, sendProductRejectedEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, params } = body

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
