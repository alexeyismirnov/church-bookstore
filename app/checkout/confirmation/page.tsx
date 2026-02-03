'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Package, Truck, Home } from 'lucide-react';

export default function ConfirmationPage() {
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);
  const paymentIntentId = searchParams.get('payment_intent');

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white rounded-xl shadow-sm p-8 md:p-12 text-center">
          {/* Success Icon */}
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-dark mb-4">
            Order Confirmed!
          </h1>
          
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            Thank you for your purchase. We've received your order and will send you a confirmation email shortly.
          </p>

          {paymentIntentId && (
            <div className="bg-gray-50 rounded-lg p-4 mb-8 max-w-sm mx-auto">
              <p className="text-sm text-gray-500 mb-1">Payment Reference</p>
              <p className="font-mono text-sm text-dark">{paymentIntentId}</p>
            </div>
          )}

          {/* Order Status Steps */}
          <div className="grid grid-cols-3 gap-4 mb-10 max-w-lg mx-auto">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-2">
                <CheckCircle className="w-6 h-6 text-primary" />
              </div>
              <span className="text-xs text-gray-600">Order Placed</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                <Package className="w-6 h-6 text-gray-400" />
              </div>
              <span className="text-xs text-gray-500">Processing</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                <Truck className="w-6 h-6 text-gray-400" />
              </div>
              <span className="text-xs text-gray-500">Shipped</span>
            </div>
          </div>

          {/* What happens next */}
          <div className="text-left bg-background rounded-lg p-6 mb-8 max-w-lg mx-auto">
            <h2 className="font-semibold text-dark mb-4">What happens next?</h2>
            <ul className="space-y-3 text-sm text-gray-600">
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 bg-primary rounded-full mt-1.5 flex-shrink-0" />
                <span>We'll send you an email confirmation with your order details</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 bg-primary rounded-full mt-1.5 flex-shrink-0" />
                <span>Your order will be processed within 1-2 business days</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 bg-primary rounded-full mt-1.5 flex-shrink-0" />
                <span>You'll receive tracking information once your order ships</span>
              </li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/" className="btn-primary inline-flex items-center justify-center gap-2">
              <Home className="w-4 h-4" />
              Back to Home
            </Link>
            <Link href="/catalog" className="btn-secondary inline-flex items-center justify-center">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
