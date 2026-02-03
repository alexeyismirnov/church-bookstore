'use client';

import { useState } from 'react';
import {
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { ShippingAddress } from './ShippingForm';

interface CheckoutFormProps {
  orderTotal: number;
  shippingAddress: ShippingAddress;
  onSuccess: (paymentIntentId: string) => void;
  onBack: () => void;
}

export function CheckoutForm({
  orderTotal,
  shippingAddress,
  onSuccess,
  onBack,
}: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setError(null);

    // Confirm payment with Stripe
    const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/checkout/confirmation`,
        payment_method_data: {
          billing_details: {
            name: `${shippingAddress.first_name} ${shippingAddress.last_name}`,
            address: {
              line1: shippingAddress.line1,
              line2: shippingAddress.line2 || '',
              city: shippingAddress.city,
              state: shippingAddress.state,
              postal_code: shippingAddress.postcode,
              country: shippingAddress.country,
            },
          },
        },
      },
      redirect: 'if_required',
    });

    if (stripeError) {
      setError(stripeError.message || 'Payment failed. Please try again.');
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
      <h2 className="text-xl font-semibold mb-6 text-dark">Payment Details</h2>

      {/* Shipping Summary */}
      <div className="mb-6 p-4 bg-background rounded-lg">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm text-gray-500">Shipping to:</p>
            <p className="font-medium text-dark">
              {shippingAddress.first_name} {shippingAddress.last_name}
            </p>
            <p className="text-sm text-gray-600">
              {shippingAddress.line1}
              {shippingAddress.line2 && `, ${shippingAddress.line2}`}
            </p>
            <p className="text-sm text-gray-600">
              {shippingAddress.city}, {shippingAddress.state} {shippingAddress.postcode}
            </p>
          </div>
          <button
            type="button"
            onClick={onBack}
            className="text-sm text-primary hover:text-primary-dark hover:underline"
          >
            Edit
          </button>
        </div>
      </div>

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
        className="w-full btn-primary py-4 px-6 text-lg
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
            Processing...
          </>
        ) : (
          `Pay $${orderTotal.toFixed(2)}`
        )}
      </button>

      {/* Security Note */}
      <p className="mt-4 text-center text-xs text-gray-500">
        🔒 Payments are secure and encrypted
      </p>
    </form>
  );
}
