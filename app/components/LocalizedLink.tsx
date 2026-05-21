'use client';

import Link from 'next/link';
import type { ComponentProps } from 'react';
import { useLocalizedPath } from '../i18n/useLocalizedPath';
import type { PathWithoutLocale } from '../i18n/routing';

type LocalizedLinkProps = Omit<ComponentProps<typeof Link>, 'href'> & {
  href: PathWithoutLocale;
};

export default function LocalizedLink({ href, ...props }: LocalizedLinkProps) {
  const localizedHref = useLocalizedPath();
  return <Link href={localizedHref(href)} {...props} />;
}
