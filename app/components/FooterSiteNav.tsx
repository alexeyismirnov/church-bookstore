'use client';

import LocalizedLink from './LocalizedLink';
import { useTranslations } from '../i18n/LanguageContext';

export default function FooterSiteNav() {
  const t = useTranslations('nav');

  const links = [
    { href: '/' as const, label: t('home') },
    { href: '/catalog' as const, label: t('catalog') },
    { href: '/resources' as const, label: t('resources') },
    { href: '/contact' as const, label: t('contact') },
    { href: '/faithofsaints' as const, label: t('faithofsaints') },
  ];

  return (
    <nav aria-label="Site" className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
      {links.map((link) => (
        <LocalizedLink
          key={link.href}
          href={link.href}
          className="text-parchment/80 hover:text-gold transition-colors"
        >
          {link.label}
        </LocalizedLink>
      ))}
    </nav>
  );
}
