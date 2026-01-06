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
  Button,
} from '@react-email/components'

interface ProductRejectedEmailProps {
  sellerName: string
  productTitle: string
  rejectionReason: string
  editUrl: string
}

export default function ProductRejectedEmail({
  sellerName = 'Seller',
  productTitle = 'Beautiful Traditional Habesha Dress',
  rejectionReason = 'Product does not meet quality guidelines',
  editUrl = '#',
}: ProductRejectedEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Action needed: Your product "{productTitle}" needs revision - MakHil</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Product Needs Revision</Heading>
          <Text style={text}>Hi {sellerName},</Text>
          <Text style={text}>
            Your product submission has been reviewed, but unfortunately it doesn't meet our current guidelines and cannot be published at this time.
          </Text>

          <Section style={productBox}>
            <Text style={productName}>{productTitle}</Text>
          </Section>

          <Section style={reasonBox}>
            <Heading as="h2" style={h2}>Reason for Rejection</Heading>
            <Text style={reasonText}>{rejectionReason}</Text>
          </Section>

          <Section style={actionBox}>
            <Text style={text}>
              Don't worry! You can edit your product to address these issues and resubmit for review.
            </Text>
            <Button href={editUrl} style={button}>
              Edit & Resubmit Product
            </Button>
          </Section>

          <Section style={tipsBox}>
            <Heading as="h2" style={h2}>Quality Guidelines</Heading>
            <Text style={text}>
              • Use clear, well-lit photos showing all angles<br/>
              • Provide accurate descriptions and measurements<br/>
              • Ensure images don't contain inappropriate content<br/>
              • Price items fairly and competitively
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

const productBox = {
  backgroundColor: '#fef2f2',
  border: '1px solid #fecaca',
  borderRadius: '8px',
  margin: '24px 20px',
  padding: '16px',
}

const productName = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#111',
  margin: '0',
  textAlign: 'center' as const,
}

const reasonBox = {
  backgroundColor: '#fef3c7',
  border: '2px solid #fbbf24',
  borderRadius: '8px',
  padding: '24px',
  margin: '24px 20px',
}

const reasonText = {
  color: '#92400e',
  fontSize: '15px',
  fontStyle: 'italic',
  margin: '0',
  lineHeight: '24px',
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
  margin: '16px 0',
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
