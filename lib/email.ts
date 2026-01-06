import { Resend } from 'resend'
import OrderPlacedEmail from '@/emails/order-placed'
import PaymentVerifiedEmail from '@/emails/payment-verified'
import OrderShippedEmail from '@/emails/order-shipped'
import OrderCancelledEmail from '@/emails/order-cancelled'
import ProductApprovedEmail from '@/emails/product-approved'
import ProductRejectedEmail from '@/emails/product-rejected'
import AdminOrderNotification from '@/emails/admin-order-notification'
import React from 'react'

// Initialize Resend with API key (use dummy key during build if not set)
const resend = new Resend(process.env.RESEND_API_KEY || 're_placeholder_key_for_build')

// Email sender configuration
// TODO: After verifying makhil.com domain in Resend, change to:
// const FROM_EMAIL = 'MakHil <noreply@makhil.com>'
// For now, using Resend's onboarding email (may go to spam)
const FROM_EMAIL = 'MakHil <onboarding@resend.dev>'

// Utility function to send emails
async function sendEmail(to: string, subject: string, react: React.ReactElement) {
  // Check if API key is set (not the placeholder)
  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 're_placeholder_key_for_build') {
    const errorMsg = 'RESEND_API_KEY environment variable is not set. Please configure it to send emails.'
    console.error(errorMsg)
    return {
      success: false,
      error: {
        message: errorMsg,
        name: 'MissingAPIKeyError'
      }
    }
  }

  try {
    console.log('[Email] Attempting to send email to:', to)
    console.log('[Email] Subject:', subject)
    console.log('[Email] From:', FROM_EMAIL)

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      react,
    })

    if (error) {
      console.error('[Email] Resend API error:', error)
      return { success: false, error }
    }

    console.log('[Email] Email sent successfully! ID:', data?.id)
    return { success: true, data }
  } catch (error: any) {
    console.error('[Email] Unexpected error sending email:', error)
    console.error('[Email] Error message:', error?.message)
    console.error('[Email] Error stack:', error?.stack)
    return { success: false, error: { message: error?.message || 'Unknown error', name: error?.name || 'Error' } }
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
  return sendEmail(
    params.to,
    `Order Confirmation ${params.orderNumber} - MakHil`,
    OrderPlacedEmail(params)
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
  return sendEmail(
    params.to,
    `Payment Verified ${params.orderNumber} - MakHil`,
    PaymentVerifiedEmail(params)
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
  return sendEmail(
    params.to,
    `Your Order Has Shipped ${params.orderNumber} - MakHil`,
    OrderShippedEmail(params)
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
  return sendEmail(
    params.to,
    `Order Cancelled ${params.orderNumber} - MakHil`,
    OrderCancelledEmail(params)
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
  return sendEmail(
    params.to,
    `Product Approved: "${params.productTitle}" - MakHil`,
    ProductApprovedEmail(params)
  )
}

export async function sendProductRejectedEmail(params: {
  to: string
  sellerName: string
  productTitle: string
  rejectionReason: string
  editUrl: string
}) {
  return sendEmail(
    params.to,
    `Product Needs Revision: "${params.productTitle}" - MakHil`,
    ProductRejectedEmail(params)
  )
}

// Admin notification functions
export async function sendAdminOrderNotification(params: {
  to: string
  orderNumber: string
  orderTotal: string
  buyerName: string
  buyerEmail: string
  productTitle: string
  productImage?: string
  productPrice: string
  shippingCost: string
  shippingAddress: string
  paymentScreenshotUrl: string
  buyerZelleName?: string
  buyerZelleEmail?: string
  buyerZellePhone?: string
  orderUrl: string
}) {
  return sendEmail(
    params.to,
    `New Order ${params.orderNumber} - Payment Verification Required`,
    AdminOrderNotification(params)
  )
}
