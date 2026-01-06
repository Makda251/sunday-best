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
} from '@react-email/components'

interface PaymentVerifiedEmailProps {
  buyerName: string
  orderNumber: string
  productTitle: string
  productImage?: string
  estimatedDelivery: string
}

export default function PaymentVerifiedEmail({
  buyerName = 'Valued Customer',
  orderNumber = '#12345',
  productTitle = 'Beautiful Traditional Habesha Dress',
  productImage,
  estimatedDelivery = '5-7 business days',
}: PaymentVerifiedEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Payment verified for order {orderNumber} - MakHil</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Payment Verified! 🎉</Heading>
          <Text style={text}>Hi {buyerName},</Text>
          <Text style={text}>
            Great news! Your payment has been verified by our admin team. The seller has been notified and will ship your order soon.
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

          <Section style={infoBox}>
            <Heading as="h2" style={h2}>What happens next?</Heading>
            <Text style={text}>
              • The seller will prepare and ship your dress<br/>
              • You'll receive a shipping confirmation email with tracking number<br/>
              • Estimated delivery: {estimatedDelivery}
            </Text>
          </Section>

          <Section style={trackBox}>
            <Text style={text}>
              You can track your order status anytime in your{' '}
              <Link href={`${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/buyer/orders`} style={link}>
                order dashboard
              </Link>
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

const infoBox = {
  padding: '0 20px',
  margin: '24px 0',
}

const trackBox = {
  backgroundColor: '#eff6ff',
  border: '1px solid #bfdbfe',
  borderRadius: '8px',
  padding: '16px',
  margin: '24px 20px',
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
