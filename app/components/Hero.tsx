// app/components/Hero.tsx
// Hero component with translations

'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useTranslations } from '../i18n/LanguageContext';

export default function Hero() {
  const t = useTranslations('homepage.hero');

  return (
    <section className="relative bg-gradient-to-br from-background to-background-alt overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          {/* Content */}
          <div className="space-y-6">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-dark leading-tight">
              {t('title')}
              <span className="block text-primary">Bookstore</span>
            </h1>
            <p className="text-lg text-gray-600 max-w-lg">
              {t('subtitle')}
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/catalog"
                className="btn-primary inline-flex items-center gap-2"
              >
                {t('cta')}
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/about"
                className="btn-secondary inline-flex items-center gap-2"
              >
                Learn More
              </Link>
            </div>
            
            {/* Stats */}
            <div className="flex gap-8 pt-6 border-t border-gray-200">
              <div>
                <p className="text-3xl font-bold text-primary">500+</p>
                <p className="text-sm text-gray-500">Books Available</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-primary">50+</p>
                <p className="text-sm text-gray-500">Categories</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-primary">10k+</p>
                <p className="text-sm text-gray-500">Happy Readers</p>
              </div>
            </div>
          </div>

          {/* Image */}
          <div className="relative hidden md:block">
            <div className="relative z-10">
              <img
                src="/images/products/2013/09/9789881889508.jpg"
                alt="Orthodox Books"
                className="w-full max-w-md mx-auto rounded-2xl shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-500"
              />
            </div>
            {/* Decorative Elements */}
            <div className="absolute top-10 right-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
            <div className="absolute bottom-10 left-10 w-40 h-40 bg-accent-orange/10 rounded-full blur-3xl" />
          </div>
        </div>
      </div>
    </section>
  );
}
