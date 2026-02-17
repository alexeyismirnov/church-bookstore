// app/components/Providers.tsx
// Client-side providers wrapper

'use client';

import { ReactNode } from 'react';
import { StripeProvider } from '../providers/StripeProvider';
import { LanguageProvider } from '../i18n/LanguageContext';
import { CurrencyProvider } from '../i18n/CurrencyContext';

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <CurrencyProvider>
      <LanguageProvider>
        <StripeProvider>
          {children}
        </StripeProvider>
      </LanguageProvider>
    </CurrencyProvider>
  );
}
