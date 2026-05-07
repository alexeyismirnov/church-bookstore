// app/components/Hero.tsx
// Hero component with translations

'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useTranslations } from '../i18n/LanguageContext';
import { Book } from '../types';

interface HeroProps {
  book?: Book | null;
}

export default function Hero({ book }: HeroProps) {
  const t = useTranslations('homepage.hero');

  return (
    <section className="relative bg-gradient-to-br from-parchment to-parchment-dark overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="grid gap-8 md:gap-0 items-center md:grid-cols-[3fr_2fr]">
          {/* Content */}
          <div className="space-y-6">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-display text-ink leading-tight">
              {t('title')}
              <span className="block text-burgundy">{t('bookstore')}</span>
            </h1>
            <p className="text-lg text-ink-light max-w-lg">
              {t('subtitle')}
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/catalog"
                className="btn-burgundy inline-flex items-center gap-2"
              >
                {t('cta')}
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
            
            {/* Stats */}
            <div className="flex gap-8 pt-6 border-t border-parchment-dark/30">
              <div>
                <p className="text-3xl font-bold text-gold">100+</p>
                <p className="text-sm text-ink-muted">{t('statBooks')}</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-gold">500+</p>
                <p className="text-sm text-ink-muted">{t('statOrders')}</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-gold">1500+</p>
                <p className="text-sm text-ink-muted">{t('statReaders')}</p>
              </div>
            </div>
            <p className="text-base text-ink-muted pt-4">
              {t('since').split('{{year}}').map((part, i, arr) => (
                <span key={i}>
                  {part}
                  {i < arr.length - 1 && (
                    <span className="font-semibold text-gold">2014</span>
                  )}
                </span>
              ))}
            </p>
          </div>

          {/* Image */}
          <div className="relative hidden md:block h-[600px] -mr-4 sm:-mr-6 lg:-mr-8">
            {book && (
              <>
                <div className="relative z-10 h-full flex items-center justify-end">
                  <Link href={`/product/${book.id}`} className="flex h-full">
                    <img
                      src={book.coverImage}
                      alt={book.title}
                      className="block h-full w-auto rounded-2xl shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-500"
                    />
                  </Link>
                </div>
                {/* Decorative Elements */}
                <div className="absolute top-10 right-10 w-32 h-32 bg-burgundy/10 rounded-full blur-3xl" />
                <div className="absolute bottom-10 left-10 w-40 h-40 bg-gold/10 rounded-full blur-3xl" />
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
