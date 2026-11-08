import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

export const runtime = 'nodejs';

let stripe: Stripe | null = null;

function getStripe(): Stripe {
  if (!stripe) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY is not set');
    }
    stripe = new Stripe(secretKey);
  }
  return stripe;
}

function getOscarApiBase(): string {
  return (process.env.OSCAR_API_URL || 'https://django.orthodoxbookshop.asia/api').replace(
    /\/$/,
    ''
  );
}

async function fulfillPaymentIntent(paymentIntent: Stripe.PaymentIntent): Promise<void> {
  const metadata = paymentIntent.metadata || {};
  if (metadata.order_source !== 'church_bookstore') {
    console.log(
      '[stripe webhook] Ignoring payment intent without church_bookstore order_source:',
      paymentIntent.id
    );
    return;
  }

  const userId = metadata.user_id;
  const basketId = metadata.basket_id;
  if (!userId || !basketId) {
    throw new Error(
      `PaymentIntent ${paymentIntent.id} missing user_id or basket_id metadata`
    );
  }

  const fulfillmentSecret = process.env.OSCAR_FULFILLMENT_SECRET;
  if (!fulfillmentSecret) {
    throw new Error('OSCAR_FULFILLMENT_SECRET is not set');
  }

  const response = await fetch(`${getOscarApiBase()}/checkout/fulfill-payment/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Fulfillment-Secret': fulfillmentSecret,
      ...(metadata.locale ? { 'Accept-Language': metadata.locale } : {}),
    },
    body: JSON.stringify({
      payment_intent_id: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      user_id: userId,
      basket_id: basketId,
      shipping_method_code: metadata.shipping_method_code || 'free-shipping',
      locale: metadata.locale || 'en',
      ship_first_name: metadata.ship_first_name || '',
      ship_last_name: metadata.ship_last_name || '',
      ship_line1: metadata.ship_line1 || '',
      ship_line2: metadata.ship_line2 || '',
      ship_line4: metadata.ship_line4 || '',
      ship_state: metadata.ship_state || '',
      ship_postcode: metadata.ship_postcode || '',
      ship_country: metadata.ship_country || '',
      ship_phone: metadata.ship_phone || '',
      ship_notes: metadata.ship_notes || '',
    }),
  });

  if (response.ok) {
    return;
  }

  const bodyText = await response.text();
  throw new Error(
    `Django fulfill-payment failed (${response.status}) for ${paymentIntent.id}: ${bodyText}`
  );
}

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('[stripe webhook] STRIPE_WEBHOOK_SECRET is not set');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 });
  }

  const signature = request.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const stripeClient = getStripe();
    const rawBody = await request.text();
    event = stripeClient.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error('[stripe webhook] Signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      await fulfillPaymentIntent(paymentIntent);
    }
    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('[stripe webhook] Fulfillment error:', err);
    // Non-2xx so Stripe retries
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Fulfillment failed' },
      { status: 500 }
    );
  }
}
