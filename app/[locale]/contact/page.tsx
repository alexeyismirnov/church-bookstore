'use client';

import { useState, useRef } from 'react';
import { Mail, Globe, MapPin, Send } from 'lucide-react';
import HCaptcha from '@hcaptcha/react-hcaptcha';
import { useTranslations } from '../../i18n/LanguageContext';

export default function ContactPage() {
  const t = useTranslations('contact');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });
  const [hcaptchaToken, setHcaptchaToken] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const captchaRef = useRef<HCaptcha>(null);
  const hcaptchaSiteKey = process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!hcaptchaToken) {
      setLocalError(t('captchaRequired'));
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          message: formData.message,
          hcaptchaToken,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setLocalError(data.error || t('errorMessage'));
        return;
      }

      // Success
      alert(t('success'));
      setFormData({ name: '', email: '', message: '' });
      captchaRef.current?.resetCaptcha();
      setHcaptchaToken(null);
    } catch (error) {
      setLocalError(t('errorMessage'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCaptchaVerify = (token: string) => {
    setHcaptchaToken(token);
  };

  const handleCaptchaExpire = () => {
    setHcaptchaToken(null);
  };

  const handleCaptchaError = () => {
    setHcaptchaToken(null);
  };

  const contactInfo = [
    {
      icon: Globe,
      title: t('social'),
      links: [
        { name: 'Facebook', url: 'https://www.facebook.com/churchbooks', icon: 'facebook' as const },
        { name: 'Telegram', url: 'https://t.me/hongkongchurch', icon: 'telegram' as const },
      ],
    },
    {
      icon: Mail,
      title: t('email'),
      details: ['bookshop@orthodoxbookshop.asia'],
    },
    {
      icon: MapPin,
      title: t('address'),
      details: ['12/F, Lee Fung Commercial Building,', '32-36 Des Voeux Rd W, Sheung Wan,', 'Hong Kong'],
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-burgundy to-burgundy-dark py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 text-parchment font-display">{t('title')}</h1>
          <p className="text-xl text-parchment/70 max-w-3xl mx-auto">{t('subtitle')}</p>
        </div>
      </section>

      {/* Contact Info Cards */}
      <section className="py-16 md:py-24 bg-parchment">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {contactInfo.map((info) => (
              <div key={info.title} className="bg-parchment-light rounded-xl p-6 shadow-sm text-center border border-parchment-dark/30">
                <div className="w-14 h-14 bg-burgundy/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <info.icon className="w-7 h-7 text-burgundy" />
                </div>
                <h3 className="text-lg font-semibold text-ink mb-2">{info.title}</h3>
                {info.links
                  ? <div className="flex items-center justify-center gap-4 mt-1">
                      {info.links.map((link, index) => (
                        <a key={index} href={link.url} target="_blank" rel="noopener noreferrer" aria-label={link.name} className="text-ink-light hover:text-burgundy transition-colors">
                          {link.icon === 'facebook'
                            ? <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                            : link.icon === 'telegram'
                            ? <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
                            : null
                          }
                        </a>
                      ))}
                    </div>
                  : info.details.map((detail, index) => (
                      detail.includes('@') ? (
                        <a key={index} href={`mailto:${detail}`} className="text-ink-light text-sm hover:text-burgundy transition-colors">{detail}</a>
                      ) : (
                        <p key={index} className="text-ink-light text-sm">{detail}</p>
                      )
                    ))
                }
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form & Map */}
      <section className="py-16 md:py-24 bg-parchment-dark/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12">
            {/* Form */}
            <div>
              <h2 className="section-title">{t('submit')}</h2>
              <p className="text-ink-light mb-8">
                {t('formDescription')}
              </p>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Error Message */}
                {localError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {localError}
                  </div>
                )}

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-ink-light mb-1">
                      {t('name')}
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 border border-parchment-dark/50 rounded-lg focus:ring-2 focus:ring-burgundy focus:border-burgundy"
                      placeholder={t('namePlaceholder')}
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ink-light mb-1">
                      {t('email')}
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 border border-parchment-dark/50 rounded-lg focus:ring-2 focus:ring-burgundy focus:border-burgundy"
                      placeholder={t('emailPlaceholder')}
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink-light mb-1">
                    {t('message')}
                  </label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-4 py-3 border border-parchment-dark/50 rounded-lg focus:ring-2 focus:ring-burgundy focus:border-burgundy h-32 resize-none"
                    placeholder={t('messagePlaceholder')}
                    required
                    disabled={isSubmitting}
                  />
                </div>

                {/* hCaptcha */}
                <div className="flex justify-center">
                  {hcaptchaSiteKey ? (
                    <HCaptcha
                      sitekey={hcaptchaSiteKey}
                      onVerify={handleCaptchaVerify}
                      onExpire={handleCaptchaExpire}
                      onError={handleCaptchaError}
                      ref={captchaRef}
                    />
                  ) : (
                    <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg text-sm text-center">
                      {t('captchaNotConfigured')}
                    </div>
                  )}
                </div>

                <div className="flex justify-center">
                  <button type="submit" className="btn-primary inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed" disabled={isSubmitting || !hcaptchaToken || !formData.name.trim() || !formData.email.trim() || !formData.message.trim()}>
                    <Send className="w-4 h-4" />
                    {isSubmitting ? t('submitting') : t('submit')}
                  </button>
                </div>
              </form>
            </div>

            {/* FAQ */}
            <div>
              <div className="bg-parchment-light border border-parchment-dark/30 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-ink mb-4">{t('faq.title')}</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-ink">{t('faq.shippingQuestion')}</h4>
                    <p className="text-sm text-ink-light">
                      {t('faq.shippingAnswer')}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-ink">{t('faq.specificBookQuestion')}</h4>
                    <p className="text-sm text-ink-light">
                      {t('faq.specificBookAnswer')}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-ink">{t('faq.physicalStoreQuestion')}</h4>
                    <p className="text-sm text-ink-light">
                      {t('faq.physicalStoreAnswer')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>


    </div>
  );
}
