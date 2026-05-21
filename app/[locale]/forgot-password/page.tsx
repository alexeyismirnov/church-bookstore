'use client';

import { useState, useRef } from 'react';
import LocalizedLink from '../../components/LocalizedLink';
import { Mail, CheckCircle } from 'lucide-react';
import HCaptcha from '@hcaptcha/react-hcaptcha';
import { useTranslations } from '../../i18n/LanguageContext';

export default function ForgotPasswordPage() {
  const t = useTranslations('auth.forgotPassword');

  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [hcaptchaToken, setHcaptchaToken] = useState<string | null>(null);

  const captchaRef = useRef<HCaptcha>(null);
  const hcaptchaSiteKey = process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate hCaptcha token
    if (!hcaptchaToken) {
      setError(t('captchaRequired'));
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, hcaptcha_token: hcaptchaToken }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || t('failed'));
        // Reset hCaptcha on error
        captchaRef.current?.resetCaptcha();
        setHcaptchaToken(null);
        return;
      }

      setSuccess(true);
    } catch {
      setError(t('failed'));
      // Reset hCaptcha on error
      captchaRef.current?.resetCaptcha();
      setHcaptchaToken(null);
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

  // Success state
  if (success) {
    return (
      <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full mx-auto">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-dark mb-2">{t('successTitle')}</h1>
            <p className="text-gray-600 my-4">
              {t('successDescription')}
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-8 mt-6">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
              </div>
              <div className="flex justify-center mb-6">
                <Mail className="w-12 h-12 text-gray-400" />
              </div>
              <LocalizedLink
                href="/login"
                className="btn-burgundy w-full inline-block text-center"
              >
                {t('backToLogin')}
              </LocalizedLink>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Form state
  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full mx-auto">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-dark mb-2">{t('title')}</h1>
          <p className="text-gray-600 my-4">
            {t('description')}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-8 mt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('email')}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-burgundy focus:border-burgundy"
                  placeholder={t('emailPlaceholder')}
                  required
                  disabled={isSubmitting}
                />
              </div>
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

            {/* Submit Button */}
            <button
              type="submit"
              className="btn-burgundy w-full disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting || !hcaptchaToken}
            >
              {isSubmitting ? t('sending') : t('submit')}
            </button>
          </form>
        </div>

        {/* Back to login */}
        <p className="text-center text-gray-600 mt-6">
          <LocalizedLink href="/login" className="text-burgundy hover:underline font-medium">
            {t('backToLogin')}
          </LocalizedLink>
        </p>
      </div>
    </div>
  );
}
