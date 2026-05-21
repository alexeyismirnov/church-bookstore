'use client';

import { useCallback } from 'react';
import { useLanguage } from './LanguageContext';
import { localizedPath, type PathWithoutLocale } from './routing';

export function useLocalizedPath() {
  const { locale } = useLanguage();

  return useCallback(
    (path: PathWithoutLocale) => localizedPath(locale, path),
    [locale]
  );
}
