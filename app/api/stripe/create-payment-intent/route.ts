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
    stripe = new Stripe(secretKey);
  }
  return stripe;
}

type ShippingMeta = {
  first_name?: string;
  last_name?: string;
  line1?: string;
  line2?: string;
  line4?: string;
  state?: string;
  postcode?: string;
  country?: string;
  phone_number?: string;
  notes?: string;
};

type CreatePaymentIntentBody = {
  amount: number;
  currency?: string;
  userId?: number | string;
  basketId?: number | string;
  shippingMethodCode?: string;
  locale?: string;
  shippingAddress?: ShippingMeta | null;
};

function trimMeta(value: unknown, max = 500): string | undefined {
  if (value == null) return undefined;
  const str = String(value).trim();
  if (!str) return undefined;
  return str.length > max ? str.slice(0, max) : str;
}

function buildMetadata(body: CreatePaymentIntentBody): Record<string, string> {
  const metadata: Record<string, string> = {
    order_source: 'church_bookstore',
  };

  const userId = trimMeta(body.userId);
  const basketId = trimMeta(body.basketId);
  if (userId) metadata.user_id = userId;
  if (basketId) metadata.basket_id = basketId;

  metadata.shipping_method_code = trimMeta(body.shippingMethodCode) || 'free-shipping';
  const locale = trimMeta(body.locale);
  if (locale) metadata.locale = locale;
  const currency = trimMeta(body.currency);
  if (currency) metadata.currency = currency.toLowerCase();

  const ship = body.shippingAddress;
  if (ship) {
    const fields: Array<[string, unknown]> = [
      ['ship_first_name', ship.first_name],
      ['ship_last_name', ship.last_name],
      ['ship_line1', ship.line1],
      ['ship_line2', ship.line2],
      ['ship_line4', ship.line4],
      ['ship_state', ship.state],
      ['ship_postcode', ship.postcode],
      ['ship_country', ship.country],
      ['ship_phone', ship.phone_number],
      ['ship_notes', ship.notes],
    ];
    for (const [key, value] of fields) {
      const trimmed = trimMeta(value);
      if (trimmed) metadata[key] = trimmed;
    }
  }

  return metadata;
}

export async function POST(request: NextRequest) {
  try {
    const stripeClient = getStripe();
    const body = (await request.json()) as CreatePaymentIntentBody;
    const { amount, currency = 'usd' } = body;

    if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    if (!body.userId || !body.basketId) {
      return NextResponse.json(
        { error: 'userId and basketId are required' },
        { status: 400 }
      );
    }

    const paymentIntent = await stripeClient.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      // Enable automatic payment methods (cards, wallets, etc.)
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: buildMetadata(body),
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
