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

interface AdminOrderNotificationProps {
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
}

export default function AdminOrderNotification({
  orderNumber = '#12345',
  orderTotal = '$150.00',
  buyerName = 'John Doe',
  buyerEmail = 'buyer@example.com',
  productTitle = 'Beautiful Traditional Habesha Dress',
  productImage,
  productPrice = '$140.00',
  shippingCost = '$10.00',
  shippingAddress = '123 Main St, City, State 12345',
  paymentScreenshotUrl = 'https://example.com/screenshot.jpg',
  buyerZelleEmail,
  buyerZellePhone,
  orderUrl = 'https://thekemishouse.com/dashboard/admin/orders/123',
}: AdminOrderNotificationProps) {
  return (
    <Html>
      <Head />
      <Preview>New order {orderNumber} requires payment verification</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>🔔 New Order Received</Heading>
          <Text style={urgentText}>
            A new order has been placed and requires payment verification.
          </Text>

          <Section style={orderBox}>
            <Text style={orderNumber}>Order {orderNumber}</Text>
            <Text style={totalAmount}>{orderTotal}</Text>

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
          </Section>

          <Section style={infoBox}>
            <Heading as="h2" style={h2}>Buyer Information</Heading>
            <Text style={infoText}>
              <strong>Name:</strong> {buyerName}<br/>
              <strong>Email:</strong> {buyerEmail}<br/>
              {buyerZelleEmail && <><strong>Zelle Email:</strong> {buyerZelleEmail}<br/></>}
              {buyerZellePhone && <><strong>Zelle Phone:</strong> {buyerZellePhone}<br/></>}
            </Text>
            <Text style={addressLabel}>Shipping Address:</Text>
            <Text style={address}>{shippingAddress}</Text>
          </Section>

          <Section style={infoBox}>
            <Heading as="h2" style={h2}>Payment Screenshot</Heading>
            <Text style={infoText}>
              Review the Zelle payment screenshot below:
            </Text>
            <Img
              src={paymentScreenshotUrl}
              alt="Payment Screenshot"
              style={screenshotImg}
            />
          </Section>

          <Section style={actionBox}>
            <Button href={orderUrl} style={button}>
              Verify Payment in Admin Dashboard
            </Button>
          </Section>

          <Text style={footer}>
            This is an automated notification. Please verify the payment and update the order status.
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

const urgentText = {
  color: '#dc2626',
  fontSize: '16px',
  fontWeight: '600',
  lineHeight: '24px',
  margin: '0 0 24px 0',
  padding: '0 20px',
}

const infoText = {
  color: '#333',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '12px 0',
}

const orderBox = {
  backgroundColor: '#fef3c7',
  border: '2px solid #f59e0b',
  borderRadius: '8px',
  margin: '24px 20px',
  padding: '24px',
}

const infoBox = {
  backgroundColor: '#f9fafb',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  margin: '24px 20px',
  padding: '24px',
}

const actionBox = {
  margin: '32px 20px',
  textAlign: 'center' as const,
}

const orderNumber = {
  color: '#4f46e5',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0 0 8px 0',
}

const totalAmount = {
  color: '#059669',
  fontSize: '28px',
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

const screenshotImg = {
  borderRadius: '8px',
  border: '2px solid #e5e7eb',
  width: '100%',
  maxWidth: '500px',
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
  borderTop: '1px solid #d1d5db',
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

const button = {
  backgroundColor: '#4f46e5',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 32px',
}

const footer = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '16px',
  padding: '8px 20px',
  textAlign: 'center' as const,
}
