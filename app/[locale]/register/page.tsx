'use client';

import { useState, useMemo, useRef } from 'react';
import LocalizedLink from '../../components/LocalizedLink';
import { useLocalizedRouter } from '../../i18n/useLocalizedRouter';
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react';
import HCaptcha from '@hcaptcha/react-hcaptcha';
import { useAuth } from '../../lib/AuthContext';
import { useTranslations } from '../../i18n/LanguageContext';
import { getPasswordStrength, getStrengthColor, getStrengthTextColor } from '../../lib/password';

export default function RegisterPage() {
  const router = useLocalizedRouter();
  const t = useTranslations('auth.register');
  const { register, isLoading } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [hcaptchaToken, setHcaptchaToken] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const captchaRef = useRef<HCaptcha>(null);
  const hcaptchaSiteKey = process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY;

  const passwordStrength = useMemo(
    () => getPasswordStrength(formData.password),
    [formData.password]
  );

  const isPasswordStrongEnough = passwordStrength.score >= 3;

  const isFormValid =
    formData.firstName.trim() !== '' &&
    formData.lastName.trim() !== '' &&
    formData.email.trim() !== '' &&
    formData.password.trim() !== '' &&
    formData.confirmPassword.trim() !== '' &&
    formData.password === formData.confirmPassword &&
    isPasswordStrongEnough &&
    hcaptchaToken !== null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    // Validate all fields are filled
    if (
      !formData.firstName.trim() ||
      !formData.lastName.trim() ||
      !formData.email.trim() ||
      !formData.password.trim() ||
      !formData.confirmPassword.trim()
    ) {
      setLocalError(t('failed'));
      return;
    }

    // Validate password strength
    if (!isPasswordStrongEnough) {
      setLocalError(t('passwordTooWeak'));
      return;
    }

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setLocalError(t('passwordMismatch'));
      return;
    }

    // Validate hCaptcha token
    if (!hcaptchaToken) {
      setLocalError(t('captchaRequired'));
      return;
    }

    setIsSubmitting(true);

    const result = await register({
      email: formData.email,
      first_name: formData.firstName,
      last_name: formData.lastName,
      password1: formData.password,
      password2: formData.confirmPassword,
      hcaptcha_token: hcaptchaToken,
    });

    setIsSubmitting(false);

    if (result.success) {
      router.push('/');
      router.refresh();
    } else {
      setLocalError(result.error || t('failed'));
      // Reset hCaptcha on error
      captchaRef.current?.resetCaptcha();
      setHcaptchaToken(null);
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

  const loading = isLoading || isSubmitting;

  const getStrengthLabel = (score: number) => {
    if (score <= 1) return t('passwordWeak');
    if (score === 2) return t('passwordMedium');
    return t('passwordStrong');
  };

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
            {localError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {localError}
              </div>
            )}

            {/* Name */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('firstName')}
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-burgundy focus:border-burgundy"
                    placeholder="John"
                    required
                    disabled={loading}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('lastName')}
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-burgundy focus:border-burgundy"
                  placeholder="Doe"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('email')}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-burgundy focus:border-burgundy"
                  placeholder="you@example.com"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('password')}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-burgundy focus:border-burgundy"
                  placeholder="••••••••"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>

              {/* Password Strength Meter */}
              {formData.password && (
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-500">{t('passwordStrength')}</span>
                    <span className={`text-xs font-medium ${getStrengthTextColor(passwordStrength.score)}`}>
                      {getStrengthLabel(passwordStrength.score)}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${getStrengthColor(passwordStrength.score)}`}
                      style={{ width: `${passwordStrength.score * 25}%` }}
                    />
                  </div>
                  <div className="mt-1.5 space-y-0.5">
                    <div className={`flex items-center gap-1.5 text-xs ${passwordStrength.rules.minLength ? 'text-green-600' : 'text-gray-400'}`}>
                      <span>{passwordStrength.rules.minLength ? '✓' : '✗'}</span>
                      <span>{t('passwordMinLength')}</span>
                    </div>
                    <div className={`flex items-center gap-1.5 text-xs ${passwordStrength.rules.hasLetter ? 'text-green-600' : 'text-gray-400'}`}>
                      <span>{passwordStrength.rules.hasLetter ? '✓' : '✗'}</span>
                      <span>{t('passwordHasLetter')}</span>
                    </div>
                    <div className={`flex items-center gap-1.5 text-xs ${passwordStrength.rules.hasDigit ? 'text-green-600' : 'text-gray-400'}`}>
                      <span>{passwordStrength.rules.hasDigit ? '✓' : '✗'}</span>
                      <span>{t('passwordHasDigit')}</span>
                    </div>
                    <div className={`flex items-center gap-1.5 text-xs ${passwordStrength.rules.hasUppercase ? 'text-green-600' : 'text-gray-400'}`}>
                      <span>{passwordStrength.rules.hasUppercase ? '✓' : '✗'}</span>
                      <span>{t('passwordHasUppercase')}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('confirmPassword')}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-burgundy focus:border-burgundy"
                  placeholder="••••••••"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  disabled={loading}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
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
              disabled={loading || !isFormValid}
            >
              {loading ? t('registering') : t('submit')}
            </button>
          </form>
        </div>

        {/* Login Link */}
        <p className="text-center text-gray-600 mt-6">
          {t('hasAccount')}{' '}
          <LocalizedLink href="/login" className="text-burgundy hover:underline font-medium">
            {t('login')}
          </LocalizedLink>
        </p>
      </div>
    </div>
  );
}
