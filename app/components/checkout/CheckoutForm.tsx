'use client';

import { useState } from 'react';
import {
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { ShippingAddress } from './ShippingForm';
import countries from '@/app/lib/countries.json';
import { useCurrency } from '@/app/i18n/CurrencyContext';
import { useTranslations } from '../../i18n/LanguageContext';

interface CheckoutFormProps {
  orderTotal: number;
  shippingAddress: ShippingAddress | null;
  isShippingRequired: boolean;
  onSuccess: (paymentIntentId: string) => void;
  onBack?: () => void;
}

export function CheckoutForm({
  orderTotal,
  shippingAddress,
  isShippingRequired,
  onSuccess,
  onBack,
}: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { symbol } = useCurrency();
  const t = useTranslations();
  const tCheckout = useTranslations('checkout');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setError(null);

    // Build confirm params - include billing details from shipping address if available
    const confirmParams: any = {
      // Return to checkout page - it will handle redirect_status and forward to confirmation on success
      return_url: `${window.location.origin}/checkout`,
    };

    // Only include billing details from shipping address if shipping is required and address exists
    if (isShippingRequired && shippingAddress) {
      confirmParams.payment_method_data = {
        billing_details: {
          name: `${shippingAddress.first_name} ${shippingAddress.last_name}`,
          address: {
            line1: shippingAddress.line1,
            line2: shippingAddress.line2 || '',
            city: shippingAddress.line4 || '',
            state: shippingAddress.state,
            postal_code: shippingAddress.postcode,
            country: shippingAddress.country,
          },
        },
      };
    }

    // Confirm payment with Stripe
    const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams,
      redirect: 'if_required',
    });

    if (stripeError) {
      setError(stripeError.message || tCheckout('payment.failedGeneric'));
      setIsProcessing(false);
      return;
    }

    // Payment succeeded
    if (paymentIntent && paymentIntent.status === 'succeeded') {
      onSuccess(paymentIntent.id);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2 className="text-xl font-semibold mb-6 text-dark">{tCheckout('payment.details')}</h2>

      {/* Shipping Summary - Only show if shipping is required and address exists */}
      {isShippingRequired && shippingAddress && (
        <div className="mb-6 p-4 bg-background rounded-lg">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500">{tCheckout('payment.shippingTo')}</p>
              <p className="font-medium text-dark">
                {shippingAddress.first_name} {shippingAddress.last_name}
              </p>
              <p className="text-sm text-gray-600">
                {shippingAddress.line1}
                {shippingAddress.line2 && `, ${shippingAddress.line2}`}
              </p>
              <p className="text-sm text-gray-600">
                {shippingAddress.line4}, {shippingAddress.state} {shippingAddress.postcode}
              </p>
              <p className="text-sm text-gray-600">
                {countries.find(c => c.code === shippingAddress.country)?.name || shippingAddress.country}
              </p>
            </div>
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="text-sm text-burgundy hover:text-burgundy-dark hover:underline"
              >
                {t('common.edit')}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Stripe Payment Element */}
      <div className="mb-6">
        <PaymentElement
          options={{
            layout: 'tabs',
          }}
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full btn-burgundy py-4 px-6 text-lg
                   disabled:opacity-50 disabled:cursor-not-allowed
                   flex items-center justify-center"
      >
        {isProcessing ? (
          <>
            <svg
              className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            {tCheckout('payment.processing')}
          </>
        ) : (
          tCheckout('payment.pay', { amount: `${symbol}${orderTotal.toFixed(2)}` })
        )}
      </button>

      {/* Security Note */}
      <p className="mt-4 text-center text-xs text-gray-500">
        {tCheckout('payment.secureNote')}
      </p>
    </form>
  );
}
