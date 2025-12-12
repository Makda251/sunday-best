import { Resend } from 'resend'
import { render } from '@react-email/render'
import OrderPlacedEmail from '@/emails/order-placed'
import PaymentVerifiedEmail from '@/emails/payment-verified'
import OrderShippedEmail from '@/emails/order-shipped'
import OrderCancelledEmail from '@/emails/order-cancelled'
import ProductApprovedEmail from '@/emails/product-approved'
import ProductRejectedEmail from '@/emails/product-rejected'

const resend = new Resend(process.env.RESEND_API_KEY)

// Email sender configuration
const FROM_EMAIL = 'The Kemis House <noreply@thekemishouse.com>'

// Utility function to send emails
async function sendEmail(to: string, subject: string, html: string) {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    })

    if (error) {
      console.error('Error sending email:', error)
      return { success: false, error }
    }

    console.log('Email sent successfully:', data)
    return { success: true, data }
  } catch (error) {
    console.error('Error sending email:', error)
    return { success: false, error }
  }
}

// Order notification functions
export async function sendOrderPlacedEmail(params: {
  to: string
  buyerName: string
  orderNumber: string
  orderTotal: string
  productTitle: string
  productImage?: string
  productPrice: string
  shippingCost: string
  shippingAddress: string
}) {
  const html = render(OrderPlacedEmail(params))
  return sendEmail(
    params.to,
    `Order Confirmation ${params.orderNumber} - The Kemis House`,
    html
  )
}

export async function sendPaymentVerifiedEmail(params: {
  to: string
  buyerName: string
  orderNumber: string
  productTitle: string
  productImage?: string
  estimatedDelivery?: string
}) {
  const html = render(PaymentVerifiedEmail(params))
  return sendEmail(
    params.to,
    `Payment Verified ${params.orderNumber} - The Kemis House`,
    html
  )
}

export async function sendOrderShippedEmail(params: {
  to: string
  buyerName: string
  orderNumber: string
  productTitle: string
  productImage?: string
  trackingNumber: string
  trackingUrl?: string
  estimatedDelivery?: string
}) {
  const html = render(OrderShippedEmail(params))
  return sendEmail(
    params.to,
    `Your Order Has Shipped ${params.orderNumber} - The Kemis House`,
    html
  )
}

export async function sendOrderCancelledEmail(params: {
  to: string
  buyerName: string
  orderNumber: string
  productTitle: string
  refundAmount: string
  reason?: string
}) {
  const html = render(OrderCancelledEmail(params))
  return sendEmail(
    params.to,
    `Order Cancelled ${params.orderNumber} - The Kemis House`,
    html
  )
}

// Product review notification functions
export async function sendProductApprovedEmail(params: {
  to: string
  sellerName: string
  productTitle: string
  productImage?: string
  productUrl: string
}) {
  const html = render(ProductApprovedEmail(params))
  return sendEmail(
    params.to,
    `Product Approved: "${params.productTitle}" - The Kemis House`,
    html
  )
}

export async function sendProductRejectedEmail(params: {
  to: string
  sellerName: string
  productTitle: string
  rejectionReason: string
  editUrl: string
}) {
  const html = render(ProductRejectedEmail(params))
  return sendEmail(
    params.to,
    `Product Needs Revision: "${params.productTitle}" - The Kemis House`,
    html
  )
}
