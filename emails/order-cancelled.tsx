import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'

interface OrderCancelledEmailProps {
  buyerName: string
  orderNumber: string
  productTitle: string
  refundAmount: string
  reason?: string
}

export default function OrderCancelledEmail({
  buyerName = 'Valued Customer',
  orderNumber = '#12345',
  productTitle = 'Beautiful Traditional Habesha Dress',
  refundAmount = '$150.00',
  reason,
}: OrderCancelledEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Order {orderNumber} has been cancelled - The Kemis House</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Order Cancelled</Heading>
          <Text style={text}>Hi {buyerName},</Text>
          <Text style={text}>
            Your order has been cancelled and a full refund has been initiated.
          </Text>

          <Section style={orderBox}>
            <Text style={orderNumber}>Order {orderNumber}</Text>
            <Text style={productName}>{productTitle}</Text>

            {reason && (
              <>
                <Text style={reasonLabel}>Cancellation Reason:</Text>
                <Text style={reasonText}>{reason}</Text>
              </>
            )}
          </Section>

          <Section style={refundBox}>
            <Heading as="h2" style={h2}>Refund Information</Heading>
            <Text style={refundText}>
              Refund Amount: <strong>{refundAmount}</strong>
            </Text>
            <Text style={text}>
              Your refund will be processed via Zelle to the account you used for payment. Please allow 1-2 business days for the refund to appear in your account.
            </Text>
          </Section>

          <Section style={infoBox}>
            <Text style={text}>
              If you have any questions about this cancellation or your refund, please don't hesitate to contact our support team.
            </Text>
          </Section>

          <Text style={footer}>
            Questions? Contact us at{' '}
            <Link href="mailto:support@thekemishouse.com" style={link}>
              support@thekemishouse.com
            </Link>
          </Text>

          <Text style={footer}>
            © 2025 The Kemis House. All rights reserved.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
}

const h1 = {
  color: '#dc2626',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0 20px',
}

const h2 = {
  color: '#333',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '16px 0 12px',
}

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '16px 0',
  padding: '0 20px',
}

const orderBox = {
  backgroundColor: '#fef2f2',
  border: '1px solid #fecaca',
  borderRadius: '8px',
  margin: '24px 20px',
  padding: '24px',
}

const orderNumber = {
  color: '#dc2626',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0 0 16px 0',
}

const productName = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#111',
  margin: '0 0 16px 0',
}

const reasonLabel = {
  color: '#6b7280',
  fontSize: '14px',
  fontWeight: '600',
  margin: '16px 0 4px 0',
}

const reasonText = {
  color: '#374151',
  fontSize: '14px',
  margin: '0',
  fontStyle: 'italic',
}

const refundBox = {
  backgroundColor: '#eff6ff',
  border: '1px solid #bfdbfe',
  borderRadius: '8px',
  padding: '24px',
  margin: '24px 20px',
}

const refundText = {
  color: '#1e40af',
  fontSize: '18px',
  margin: '16px 0',
  textAlign: 'center' as const,
}

const infoBox = {
  padding: '0 20px',
  margin: '24px 0',
}

const footer = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '16px',
  padding: '0 20px',
  textAlign: 'center' as const,
  margin: '16px 0',
}

const link = {
  color: '#4f46e5',
  textDecoration: 'underline',
}
