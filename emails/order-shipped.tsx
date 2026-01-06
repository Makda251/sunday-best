import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
  Button,
} from '@react-email/components'

interface OrderShippedEmailProps {
  buyerName: string
  orderNumber: string
  productTitle: string
  productImage?: string
  trackingNumber: string
  trackingUrl?: string
  estimatedDelivery: string
}

export default function OrderShippedEmail({
  buyerName = 'Valued Customer',
  orderNumber = '#12345',
  productTitle = 'Beautiful Traditional Habesha Dress',
  productImage,
  trackingNumber = '1234567890',
  trackingUrl,
  estimatedDelivery = '5-7 business days',
}: OrderShippedEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your order {orderNumber} has shipped! - MakHil</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Your Order Has Shipped! 📦</Heading>
          <Text style={text}>Hi {buyerName},</Text>
          <Text style={text}>
            Exciting news! Your order has been shipped and is on its way to you.
          </Text>

          <Section style={orderBox}>
            <Text style={orderNumber}>Order {orderNumber}</Text>

            {productImage && (
              <Img
                src={productImage}
                alt={productTitle}
                style={productImg}
              />
            )}

            <Text style={productName}>{productTitle}</Text>
          </Section>

          <Section style={trackingBox}>
            <Heading as="h2" style={h2}>Tracking Information</Heading>
            <Text style={trackingLabel}>Tracking Number:</Text>
            <Text style={trackingNumberText}>{trackingNumber}</Text>

            {trackingUrl && (
              <Button href={trackingUrl} style={button}>
                Track Your Package
              </Button>
            )}

            <Text style={deliveryText}>
              Estimated Delivery: <strong>{estimatedDelivery}</strong>
            </Text>
          </Section>

          <Section style={infoBox}>
            <Heading as="h2" style={h2}>Delivery Tips</Heading>
            <Text style={text}>
              • Make sure someone is available to receive the package<br/>
              • Check your tracking link for real-time updates<br/>
              • Contact the carrier if you have delivery questions
            </Text>
          </Section>

          <Text style={footer}>
            Questions? Contact us at{' '}
            <Link href="mailto:support@makhil.com" style={link}>
              support@makhil.com
            </Link>
          </Text>

          <Text style={footer}>
            © 2025 MakHil. All rights reserved.
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
  color: '#059669',
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
  backgroundColor: '#f9fafb',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  margin: '24px 20px',
  padding: '24px',
}

const orderNumber = {
  color: '#4f46e5',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0 0 16px 0',
}

const productImg = {
  borderRadius: '8px',
  width: '100%',
  maxWidth: '400px',
  margin: '16px auto',
  display: 'block',
}

const productName = {
  fontSize: '18px',
  fontWeight: '600',
  color: '#111',
  margin: '16px 0',
  textAlign: 'center' as const,
}

const trackingBox = {
  backgroundColor: '#dbeafe',
  border: '2px solid #3b82f6',
  borderRadius: '8px',
  padding: '24px',
  margin: '24px 20px',
  textAlign: 'center' as const,
}

const trackingLabel = {
  color: '#1e40af',
  fontSize: '14px',
  fontWeight: '600',
  margin: '0 0 8px 0',
}

const trackingNumberText = {
  color: '#1e3a8a',
  fontSize: '20px',
  fontWeight: 'bold',
  letterSpacing: '1px',
  margin: '0 0 16px 0',
  fontFamily: 'monospace',
}

const button = {
  backgroundColor: '#4f46e5',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
  margin: '16px 0',
}

const deliveryText = {
  color: '#374151',
  fontSize: '14px',
  margin: '16px 0 0 0',
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
}

const link = {
  color: '#4f46e5',
  textDecoration: 'underline',
}
