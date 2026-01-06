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

interface OrderPlacedEmailProps {
  buyerName: string
  orderNumber: string
  orderTotal: string
  productTitle: string
  productImage?: string
  productPrice: string
  shippingCost: string
  shippingAddress: string
}

export default function OrderPlacedEmail({
  buyerName = 'Valued Customer',
  orderNumber = '#12345',
  orderTotal = '$150.00',
  productTitle = 'Beautiful Traditional Habesha Dress',
  productImage,
  productPrice = '$140.00',
  shippingCost = '$10.00',
  shippingAddress = '123 Main St, City, State 12345',
}: OrderPlacedEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your order {orderNumber} has been placed - MakHil</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Order Confirmation</Heading>
          <Text style={text}>Hi {buyerName},</Text>
          <Text style={text}>
            Thank you for your order! We've received your order and are waiting for payment verification from our admin team.
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

            <table style={priceTable}>
              <tr>
                <td style={priceLabel}>Product Price:</td>
                <td style={priceValue}>{productPrice}</td>
              </tr>
              <tr>
                <td style={priceLabel}>Shipping:</td>
                <td style={priceValue}>{shippingCost}</td>
              </tr>
              <tr style={totalRow}>
                <td style={priceLabel}><strong>Total:</strong></td>
                <td style={priceValue}><strong>{orderTotal}</strong></td>
              </tr>
            </table>

            <Text style={addressLabel}>Shipping Address:</Text>
            <Text style={address}>{shippingAddress}</Text>
          </Section>

          <Section style={nextSteps}>
            <Heading as="h2" style={h2}>Next Steps</Heading>
            <Text style={text}>
              1. Our admin team will verify your payment screenshot<br/>
              2. Once verified, the seller will be notified to ship your order<br/>
              3. You'll receive a shipping confirmation with tracking number<br/>
              4. Your dress will arrive within 5-7 business days
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
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0 20px',
}

const h2 = {
  color: '#333',
  fontSize: '20px',
  fontWeight: 'bold',
  margin: '20px 0 12px',
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
}

const priceTable = {
  width: '100%',
  margin: '16px 0',
}

const priceLabel = {
  color: '#6b7280',
  fontSize: '14px',
  padding: '4px 0',
}

const priceValue = {
  color: '#111',
  fontSize: '14px',
  textAlign: 'right' as const,
  padding: '4px 0',
}

const totalRow = {
  borderTop: '1px solid #e5e7eb',
  paddingTop: '8px',
}

const addressLabel = {
  color: '#6b7280',
  fontSize: '14px',
  fontWeight: '600',
  margin: '16px 0 4px 0',
}

const address = {
  color: '#111',
  fontSize: '14px',
  margin: '0',
  whiteSpace: 'pre-line' as const,
}

const nextSteps = {
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
