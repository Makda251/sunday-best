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

interface ProductApprovedEmailProps {
  sellerName: string
  productTitle: string
  productImage?: string
  productUrl: string
}

export default function ProductApprovedEmail({
  sellerName = 'Seller',
  productTitle = 'Beautiful Traditional Habesha Dress',
  productImage,
  productUrl = '#',
}: ProductApprovedEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your product "{productTitle}" has been approved! - The Kemis House</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Product Approved! 🎉</Heading>
          <Text style={text}>Hi {sellerName},</Text>
          <Text style={text}>
            Great news! Your product has been reviewed and approved by our admin team. It's now live on the marketplace and visible to buyers!
          </Text>

          <Section style={productBox}>
            {productImage && (
              <Img
                src={productImage}
                alt={productTitle}
                style={productImg}
              />
            )}
            <Text style={productName}>{productTitle}</Text>
          </Section>

          <Section style={actionBox}>
            <Button href={productUrl} style={button}>
              View Your Product
            </Button>
          </Section>

          <Section style={tipsBox}>
            <Heading as="h2" style={h2}>Tips for Success</Heading>
            <Text style={text}>
              • Share your product link on social media<br/>
              • Respond quickly when you receive an order<br/>
              • Ship items promptly after payment verification<br/>
              • Maintain high-quality product photos and descriptions
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

const productBox = {
  backgroundColor: '#f0fdf4',
  border: '2px solid #86efac',
  borderRadius: '8px',
  margin: '24px 20px',
  padding: '24px',
}

const productImg = {
  borderRadius: '8px',
  width: '100%',
  maxWidth: '400px',
  margin: '0 auto 16px',
  display: 'block',
}

const productName = {
  fontSize: '18px',
  fontWeight: '600',
  color: '#111',
  margin: '0',
  textAlign: 'center' as const,
}

const actionBox = {
  padding: '0 20px',
  margin: '24px 0',
  textAlign: 'center' as const,
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
}

const tipsBox = {
  backgroundColor: '#eff6ff',
  border: '1px solid #bfdbfe',
  borderRadius: '8px',
  padding: '24px',
  margin: '24px 20px',
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
