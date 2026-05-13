'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Package, Truck } from 'lucide-react';
import { useTranslations } from '../../i18n/LanguageContext';

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const t = useTranslations();
  const tCheckout = useTranslations('checkout');
  const [mounted, setMounted] = useState(false);
  const paymentIntentId = searchParams.get('payment_intent');
  const redirectStatus = searchParams.get('redirect_status');

  useEffect(() => {
    setMounted(true);
    
    // If payment failed, redirect back to checkout with error
    if (redirectStatus === 'failed') {
      router.replace('/checkout');
    }
  }, [redirectStatus, router]);

  // Show loading while checking payment status or redirecting
  if (!mounted || redirectStatus === 'failed') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-burgundy" />
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
            {tCheckout('confirmation.title')}
          </h1>
          
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            {tCheckout('confirmation.thankYou')}
          </p>

          {/* Order Status Steps */}
          <div className="grid grid-cols-3 gap-4 mb-10 max-w-lg mx-auto">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-burgundy/10 rounded-full flex items-center justify-center mb-2">
                <CheckCircle className="w-6 h-6 text-burgundy" />
              </div>
              <span className="text-xs text-gray-600">{tCheckout('confirmation.orderPlaced')}</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                <Package className="w-6 h-6 text-gray-400" />
              </div>
              <span className="text-xs text-gray-500">{tCheckout('confirmation.processing')}</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                <Truck className="w-6 h-6 text-gray-400" />
              </div>
              <span className="text-xs text-gray-500">{tCheckout('confirmation.shipped')}</span>
            </div>
          </div>

          {/* What happens next */}
          <div className="text-left bg-background rounded-lg p-6 mb-8 max-w-lg mx-auto">
            <h2 className="font-semibold text-dark mb-4">{tCheckout('confirmation.whatNext')}</h2>
            <ul className="space-y-3 text-sm text-gray-600">
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 bg-burgundy rounded-full mt-1.5 flex-shrink-0" />
                <span>{tCheckout('confirmation.step1')}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 bg-burgundy rounded-full mt-1.5 flex-shrink-0" />
                <span>{tCheckout('confirmation.step2')}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 bg-burgundy rounded-full mt-1.5 flex-shrink-0" />
                <span>
                  {tCheckout('confirmation.step3Before')}
                  <Link href="/bookshelf" className="text-burgundy underline font-medium">
                    {tCheckout('confirmation.step3Link')}
                  </Link>
                  {tCheckout('confirmation.step3After')}
                </span>
              </li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex justify-center">
            <Link href="/catalog" className="btn-burgundy inline-flex items-center justify-center">
              {t('common.continueShopping')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ConfirmationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-burgundy" />
      </div>
    }>
      <ConfirmationContent />
    </Suspense>
  );
}
