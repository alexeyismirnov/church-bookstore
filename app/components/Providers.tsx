// app/components/Providers.tsx
// Client-side providers wrapper

'use client';

import { ReactNode } from 'react';
import { StripeProvider } from '../providers/StripeProvider';
import { LanguageProvider, type Locale } from '../i18n/LanguageContext';
import { CurrencyProvider } from '../i18n/CurrencyContext';
import { type Currency } from '../i18n/settings';
import { AuthProvider } from '../lib/AuthContext';

interface ProvidersProps {
  children: ReactNode;
  // Server-read cookie values, passed from layout.tsx so the first render
  // already uses the correct locale and currency — no flash of defaults.
  initialLocale?: Locale;
  initialCurrency?: Currency;
}

export default function Providers({ children, initialLocale, initialCurrency }: ProvidersProps) {
  return (
    <AuthProvider>
      <CurrencyProvider initialCurrency={initialCurrency}>
        <LanguageProvider initialLocale={initialLocale}>
          <StripeProvider>
            {children}
          </StripeProvider>
        </LanguageProvider>
      </CurrencyProvider>
    </AuthProvider>
  );
}
