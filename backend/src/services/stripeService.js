require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

class StripeService {
  constructor() {
    this.plans = {
      basic: {
        price: 599, // $5.99 in cents
        credits: 10,
        name: 'Basic Plan',
        description: 'Perfect for getting started and testing the waters'
      },
      blogger: {
        price: 5000, // $50.00 in cents
        credits: 50,
        name: 'Blogger Plan', 
        description: 'Ideal for serious bloggers building an authority site'
      },
      pro: {
        price: 10000, // $100.00 in cents
        credits: 240,
        name: 'Pro / Agency Plan',
        description: 'For professionals managing multiple sites or high-volume content'
      }
    };
  }

  // Create Stripe checkout session
  async createCheckoutSession(plan, customerEmail, successUrl, cancelUrl) {
    if (!this.plans[plan]) {
      throw new Error(`Invalid plan: ${plan}`);
    }

    const planConfig = this.plans[plan];

    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: planConfig.name,
                description: `${planConfig.description} - ${planConfig.credits} keyword credits`,
              },
              unit_amount: planConfig.price,
            },
            quantity: 1,
          },
        ],
        mode: 'payment', // One-time payment, not subscription
        customer_email: customerEmail,
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          plan: plan,
          credits: planConfig.credits.toString(),
          service: 'keyword-alchemist'
        }
      });

      return session;
    } catch (error) {
      console.error('Stripe checkout session creation error:', error);
      throw error;
    }
  }

  // Process webhook events
  async processWebhookEvent(body, signature, endpointSecret, database, keyGenerator) {
    let event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, endpointSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      throw new Error(`Webhook signature verification failed: ${err.message}`);
    }

    console.log(`[Stripe] Processing webhook event: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed':
        return await this.handleCheckoutCompleted(event.data.object, database, keyGenerator);
      
      case 'payment_intent.succeeded':
        return await this.handlePaymentSucceeded(event.data.object, database);
      
      case 'payment_intent.payment_failed':
        return await this.handlePaymentFailed(event.data.object, database);
      
      default:
        console.log(`[Stripe] Unhandled event type: ${event.type}`);
        return { received: true, message: `Unhandled event type: ${event.type}` };
    }
  }

  // Handle successful checkout completion
  async handleCheckoutCompleted(session, database, keyGenerator) {
    try {
      console.log('[Stripe] Processing checkout completion:', {
        sessionId: session.id,
        customerEmail: session.customer_email,
        amountTotal: session.amount_total,
        metadata: session.metadata
      });

      const plan = session.metadata?.plan;
      const credits = parseInt(session.metadata?.credits);
      const customerEmail = session.customer_email;

      if (!plan || !credits) {
        throw new Error('Missing plan or credits in session metadata');
      }

      // Generate unique access key
      const accessKey = await keyGenerator.generateUniqueKey(database);
      
      // Create access key in database
      await database.createAccessKey(accessKey, plan, credits, customerEmail);
      
      // Log the successful purchase
      await database.logPayment({
        sessionId: session.id,
        accessKey: accessKey,
        plan: plan,
        credits: credits,
        amountPaid: session.amount_total,
        customerEmail: customerEmail,
        stripeCustomerId: session.customer,
        paymentStatus: 'completed'
      });

      console.log(`[Stripe] Successfully created access key ${accessKey} for ${customerEmail} - ${plan} plan (${credits} credits)`);

      return {
        success: true,
        accessKey: accessKey,
        plan: plan,
        credits: credits,
        customerEmail: customerEmail,
        message: 'Access key created successfully'
      };

    } catch (error) {
      console.error('[Stripe] Error processing checkout completion:', error);
      
      // Log the failed purchase attempt
      try {
        await database.logPayment({
          sessionId: session.id,
          plan: session.metadata?.plan,
          credits: parseInt(session.metadata?.credits) || 0,
          amountPaid: session.amount_total,
          customerEmail: session.customer_email,
          stripeCustomerId: session.customer,
          paymentStatus: 'failed',
          errorMessage: error.message
        });
      } catch (logError) {
        console.error('[Stripe] Failed to log payment error:', logError);
      }
      
      throw error;
    }
  }

  // Handle successful payment intent
  async handlePaymentSucceeded(paymentIntent, database) {
    console.log('[Stripe] Payment succeeded:', {
      id: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: paymentIntent.status
    });

    return {
      success: true,
      message: 'Payment processed successfully'
    };
  }

  // Handle failed payment intent
  async handlePaymentFailed(paymentIntent, database) {
    console.error('[Stripe] Payment failed:', {
      id: paymentIntent.id,
      amount: paymentIntent.amount,
      lastError: paymentIntent.last_payment_error
    });

    return {
      success: false,
      message: 'Payment processing failed'
    };
  }

  // Get plan configuration
  getPlan(planName) {
    return this.plans[planName] || null;
  }

  // Get all available plans
  getAllPlans() {
    return this.plans;
  }

  // Retrieve checkout session details
  async retrieveSession(sessionId) {
    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      return session;
    } catch (error) {
      console.error('Error retrieving checkout session:', error);
      throw error;
    }
  }
}

module.exports = new StripeService();
