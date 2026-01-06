# Email Notifications Setup Guide

This marketplace uses [Resend](https://resend.com/) for sending transactional emails.

## Setup Instructions

### 1. Create a Resend Account

1. Go to [https://resend.com/signup](https://resend.com/signup)
2. Sign up with your email or GitHub account
3. Verify your email address

### 2. Get Your API Key

1. Once logged in, go to [API Keys](https://resend.com/api-keys)
2. Click "Create API Key"
3. Give it a name (e.g., "Habesha Marketplace Production")
4. Set permissions to "Sending access"
5. Click "Create"
6. **Copy the API key** (you won't be able to see it again!)

### 3. Add API Key to Environment Variables

1. Open `.env.local` file in the project root
2. Replace the placeholder `RESEND_API_KEY` value with your actual API key:
   ```
   RESEND_API_KEY=re_your_actual_api_key_here
   ```
3. Save the file

### 4. Configure Your Domain (Production Only)

For production, you'll want to send emails from your own domain:

1. In Resend dashboard, go to [Domains](https://resend.com/domains)
2. Click "Add Domain"
3. Enter your domain (e.g., `makhil.com`)
4. Add the provided DNS records to your domain registrar:
   - SPF record
   - DKIM record
   - DMARC record (optional but recommended)
5. Wait for verification (usually 15 minutes to 48 hours)
6. Once verified, update the `FROM_EMAIL` in `lib/email.ts`:
   ```typescript
   const FROM_EMAIL = 'MakHil <noreply@makhil.com>'
   ```

### 5. Test Email Sending

For testing during development, you can use your personal email:

1. In Resend dashboard, your email is automatically verified
2. Send test emails to your own email address
3. Check spam folder if emails don't appear in inbox

## Email Templates

All email templates are located in the `emails/` directory:

- `order-placed.tsx` - Sent when buyer places an order
- `payment-verified.tsx` - Sent when admin verifies payment
- `order-shipped.tsx` - Sent when seller ships the order
- `order-cancelled.tsx` - Sent when order is cancelled/refunded
- `product-approved.tsx` - Sent when admin approves a product
- `product-rejected.tsx` - Sent when admin rejects a product

## Resend Free Tier Limits

- **3,000 emails/month**
- **100 emails/day**
- 1 domain verification
- Email logs for 30 days

Perfect for getting started! Upgrade to paid plan when you need more volume.

## Pricing (when you grow)

- **Free**: 3,000 emails/month
- **$20/month**: 50,000 emails/month
- **$80/month**: 100,000 emails/month

## Testing Emails Locally

Resend works in development! Emails sent from `localhost` will be delivered to your verified email addresses.

## Troubleshooting

### Emails not sending?
1. Check console logs for errors
2. Verify API key is correct in `.env.local`
3. Make sure `.env.local` is not committed to git
4. Check Resend dashboard for failed emails

### Emails going to spam?
1. Wait for domain verification to complete
2. Add SPF, DKIM, and DMARC records
3. Send test emails and mark as "Not Spam"
4. Avoid spam trigger words in email content

### API key not working?
1. Make sure you copied the entire key
2. Check for extra spaces or line breaks
3. Regenerate key if needed
4. Restart your development server after changing `.env.local`

## Support

- Resend Docs: https://resend.com/docs
- Resend Discord: https://resend.com/discord
- Email support: support@resend.com
