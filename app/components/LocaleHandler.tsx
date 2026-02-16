// app/components/LocaleHandler.tsx
// Handles dynamic HTML lang attribute based on current locale

'use client';

import { useEffect, useState } from 'react';
import { useLanguage, type Locale } from '../i18n/LanguageContext';

export default function LocaleHandler() {
  const { locale, isLoading } = useLanguage();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Update html lang attribute when locale changes
  useEffect(() => {
    if (mounted && !isLoading) {
      document.documentElement.lang = locale;
      // Also set dir for RTL languages if needed (e.g., Arabic, Hebrew)
      document.documentElement.dir = 'ltr'; // All current languages are LTR
    }
  }, [locale, mounted, isLoading]);

  return null;
}
