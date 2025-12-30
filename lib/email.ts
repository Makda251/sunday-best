import { Resend } from 'resend'
import OrderPlacedEmail from '@/emails/order-placed'
import PaymentVerifiedEmail from '@/emails/payment-verified'
import OrderShippedEmail from '@/emails/order-shipped'
import OrderCancelledEmail from '@/emails/order-cancelled'
import ProductApprovedEmail from '@/emails/product-approved'
import ProductRejectedEmail from '@/emails/product-rejected'
import AdminOrderNotification from '@/emails/admin-order-notification'
import React from 'react'

const resend = new Resend(process.env.RESEND_API_KEY)

// Email sender configuration
// TODO: After verifying thekemishouse.com domain in Resend, change to:
// const FROM_EMAIL = 'The Kemis House <noreply@thekemishouse.com>'
// For now, using Resend's onboarding email (may go to spam)
const FROM_EMAIL = 'The Kemis House <onboarding@resend.dev>'

// Utility function to send emails
async function sendEmail(to: string, subject: string, react: React.ReactElement) {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      react,
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
  return sendEmail(
    params.to,
    `Order Confirmation ${params.orderNumber} - The Kemis House`,
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
    `Payment Verified ${params.orderNumber} - The Kemis House`,
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
    `Your Order Has Shipped ${params.orderNumber} - The Kemis House`,
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
    `Order Cancelled ${params.orderNumber} - The Kemis House`,
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
    `Product Approved: "${params.productTitle}" - The Kemis House`,
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
    `Product Needs Revision: "${params.productTitle}" - The Kemis House`,
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
