# Stripe Payment Integration Setup Guide

## Overview
This guide will help you set up Stripe payment processing for Keyword Alchemist. The integration handles:
- One-time payments for credit packages
- Automatic API key generation after successful payment
- Webhook processing for payment completion
- Payment analytics and tracking

## Step 1: Create a Stripe Account
1. Go to [stripe.com](https://stripe.com) and create an account
2. Complete the account setup and business verification
3. Go to your Stripe Dashboard

## Step 2: Get Your API Keys
1. In the Stripe Dashboard, go to **Developers** → **API keys**
2. Copy your **Secret key** (starts with `sk_test_` for test mode)
3. Copy your **Publishable key** (starts with `pk_test_` for test mode)

## Step 3: Set Up Webhook Endpoint
1. In the Stripe Dashboard, go to **Developers** → **Webhooks**
2. Click **"Add endpoint"**
3. Set the endpoint URL to: `https://yourdomain.com/api/stripe/webhook`
   - For local development: `http://localhost:3002/api/stripe/webhook`
   - For production: Your actual domain
4. Select the following events to listen for:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. Click **"Add endpoint"**
6. Copy the **Signing secret** (starts with `whsec_`)

## Step 4: Configure Environment Variables
1. Copy the `.env.example` file to `.env` in your backend directory
2. Fill in your Stripe configuration:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_actual_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_actual_webhook_secret_here
```

## Step 5: Test the Integration
1. Start your backend server:
   ```bash
   cd backend
   npm start
   ```

2. Start your frontend:
   ```bash
   npm start
   ```

3. Go to the Pricing page and try purchasing a plan
4. Use Stripe's test card numbers:
   - **Success**: 4242 4242 4242 4242
   - **Decline**: 4000 0000 0000 0002
   - Use any future expiry date and any 3-digit CVC

## Step 6: Verify Webhook Processing
1. After a test purchase, check your server logs for webhook processing
2. Check your database for the new access key
3. Verify the payment was logged in the `payment_logs` table

## Step 7: Go Live (Production)
1. In your Stripe Dashboard, toggle to **Live mode**
2. Get your live API keys (start with `sk_live_` and `pk_live_`)
3. Update your webhook endpoint URL to your production domain
4. Update your environment variables with live keys
5. Complete Stripe's activation requirements

## Pricing Structure
The current pricing is configured as:

- **Basic**: $5.99 → 10 credits
- **Blogger**: $50 → 50 credits
- **Pro**: $100 → 240 credits

You can modify these in `/backend/src/services/stripeService.js`

## Webhook Security
The webhook endpoint verifies Stripe signatures to ensure requests are authentic. The signing secret is used for this verification, so keep it secure.

## Troubleshooting

### Common Issues:

1. **Webhook signature verification failed**
   - Check that your `STRIPE_WEBHOOK_SECRET` is correct
   - Ensure the webhook endpoint URL is correct
   - Verify the webhook is receiving the correct events

2. **Payment succeeded but no access key created**
   - Check server logs for webhook processing errors
   - Verify database connectivity
   - Check that the payment metadata includes plan information

3. **Checkout session creation fails**
   - Verify your `STRIPE_SECRET_KEY` is correct and has proper permissions
   - Check that your plan configuration is valid

### Debug Mode:
Enable detailed logging by setting `NODE_ENV=development` in your environment.

## Support
If you encounter issues:
1. Check the server logs for detailed error messages
2. Review the Stripe Dashboard for webhook delivery status
3. Test with Stripe's webhook testing tool
4. Ensure your server is accessible from the internet for webhooks

## Security Notes
- Never expose your secret keys in client-side code
- Use HTTPS in production
- Keep your webhook signing secret secure
- Regularly rotate your API keys
- Monitor your Stripe Dashboard for unusual activity
