'use client';

import { ExternalLink } from 'lucide-react';
import { useTranslations } from '../i18n/LanguageContext';

const resources = [
  {
    url: 'https://iconostas.shop',
    title: 'Iconostas.shop',
    image: '/images/iconostas.jpg',
    descriptionKey: 'iconostasDescription' as const,
  },
  {
    url: 'https://agios.bio',
    title: 'Agios.bio',
    image: '/images/agios.jpg',
    descriptionKey: 'agiosDescription' as const,
  },
  {
    url: 'https://orthodoxy.hk',
    title: 'Orthodoxy.hk',
    image: '/images/orthodoxy.jpg',
    descriptionKey: 'orthodoxyDescription' as const,
  },
];

export default function ResourcesPage() {
  const t = useTranslations('resources');

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-burgundy to-burgundy-dark py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 text-parchment font-display">
            {t('title')}
          </h1>
          <p className="text-xl text-parchment/70 max-w-3xl mx-auto">
            {t('subtitle')}
          </p>
        </div>
      </section>

      {/* Resources Grid */}
      <section className="py-16 md:py-24 bg-parchment">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {resources.map((resource) => (
              <a
                key={resource.url}
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-parchment-light rounded-xl shadow-sm border border-parchment-dark/30 overflow-hidden hover:shadow-md transition-shadow group"
              >
                {/* Thumbnail */}
                <div className="aspect-video overflow-hidden">
                  <img
                    src={resource.image}
                    alt={resource.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>

                {/* Content */}
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <h3 className="text-lg font-semibold text-burgundy font-display">
                      {resource.title}
                    </h3>
                    <ExternalLink className="w-4 h-4 text-burgundy/60 flex-shrink-0" />
                  </div>
                  <p className="text-sm text-ink-light leading-relaxed">
                    {t(resource.descriptionKey)}
                  </p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
