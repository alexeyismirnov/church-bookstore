'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useMemo } from 'react';
import { useLocalizedPath } from './useLocalizedPath';
import type { PathWithoutLocale } from './routing';

export function useLocalizedRouter() {
  const router = useRouter();
  const localizedPath = useLocalizedPath();

  const toHref = useCallback(
    (path: PathWithoutLocale, query?: string) => {
      const base = localizedPath(path);
      if (!query) return base;
      return query.startsWith('?') ? `${base}${query}` : `${base}?${query}`;
    },
    [localizedPath]
  );

  const push = useCallback(
    (path: PathWithoutLocale, query?: string) => router.push(toHref(path, query)),
    [router, toHref]
  );

  const replace = useCallback(
    (path: PathWithoutLocale, query?: string) => router.replace(toHref(path, query)),
    [router, toHref]
  );

  return useMemo(
    () => ({ push, replace, refresh: () => router.refresh() }),
    [push, replace, router]
  );
}
