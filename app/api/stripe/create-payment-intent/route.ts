import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

// Use Node.js runtime for Stripe API compatibility
export const runtime = 'nodejs';

// Lazy-loaded Stripe client - initialized only when needed
let stripe: Stripe | null = null;

function getStripe(): Stripe {
  if (!stripe) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY is not set');
    }
    stripe = new Stripe(secretKey, {
      apiVersion: '2026-01-28.clover',
    });
  }
  return stripe;
}

export async function POST(request: NextRequest) {
  try {
    const stripeClient = getStripe();
    const { amount, currency = 'usd' } = await request.json();

    const paymentIntent = await stripeClient.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      // Enable automatic payment methods (cards, wallets, etc.)
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        order_source: 'church_bookstore',
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error('Stripe error:', error);

    // Check if it's a configuration error
    if (error instanceof Error && error.message === 'STRIPE_SECRET_KEY is not set') {
      return NextResponse.json(
        { error: 'Payment service is not configured properly' },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    );
  }
}
