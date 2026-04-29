'use client';

import { useState, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Lock, CheckCircle, AlertTriangle } from 'lucide-react';
import { useTranslations } from '../i18n/LanguageContext';
import { getPasswordStrength, getStrengthColor, getStrengthTextColor, isPasswordStrongEnough } from '../lib/password';

function ResetPasswordForm() {
  const t = useTranslations('auth.resetPassword');
  const searchParams = useSearchParams();

  const uid = searchParams.get('uid');
  const token = searchParams.get('token');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const passwordStrength = useMemo(
    () => getPasswordStrength(formData.newPassword),
    [formData.newPassword]
  );

  const isFormValid =
    formData.newPassword.trim() !== '' &&
    formData.confirmPassword.trim() !== '' &&
    formData.newPassword === formData.confirmPassword &&
    isPasswordStrongEnough(formData.newPassword);

  const getStrengthLabel = (score: number): string => {
    if (score <= 1) return t('passwordWeak');
    if (score === 2) return t('passwordMedium');
    return t('passwordStrong');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate passwords match
    if (formData.newPassword !== formData.confirmPassword) {
      setError(t('passwordMismatch'));
      return;
    }

    // Validate password strength
    if (!isPasswordStrongEnough(formData.newPassword)) {
      setError(t('passwordTooWeak'));
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/oscar/password-reset/confirm/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid,
          token,
          new_password1: formData.newPassword,
          new_password2: formData.confirmPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || t('failed'));
        return;
      }

      setSuccess(true);
    } catch {
      setError(t('failed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Invalid link state — uid or token missing from URL
  if (!uid || !token) {
    return (
      <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full mx-auto">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-dark mb-2">{t('invalidLinkTitle')}</h1>
            <p className="text-gray-600 my-4">
              {t('invalidLinkDescription')}
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-8 mt-6">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-8 h-8 text-yellow-500" />
                </div>
              </div>
              <Link
                href="/forgot-password"
                className="btn-primary w-full inline-block text-center"
              >
                {t('requestNewLink')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
              <Link
                href="/login"
                className="btn-primary w-full inline-block text-center"
              >
                {t('signIn')}
              </Link>
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

            {/* New Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('newPassword')}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.newPassword}
                  onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                  className="w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder={t('newPasswordPlaceholder')}
                  required
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  disabled={isSubmitting}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>

              {/* Password Strength Indicator */}
              {formData.newPassword && (
                <div className="mt-2">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${getStrengthColor(passwordStrength.score)}`}
                        style={{ width: `${(passwordStrength.score / 4) * 100}%` }}
                      />
                    </div>
                    <span className={`text-xs font-medium ${getStrengthTextColor(passwordStrength.score)}`}>
                      {getStrengthLabel(passwordStrength.score)}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <p className={`text-xs ${passwordStrength.rules.minLength ? 'text-green-600' : 'text-gray-400'}`}>
                      {passwordStrength.rules.minLength ? '✓' : '○'} {t('passwordMinLength')}
                    </p>
                    <p className={`text-xs ${passwordStrength.rules.hasLetter ? 'text-green-600' : 'text-gray-400'}`}>
                      {passwordStrength.rules.hasLetter ? '✓' : '○'} {t('passwordHasLetter')}
                    </p>
                    <p className={`text-xs ${passwordStrength.rules.hasDigit ? 'text-green-600' : 'text-gray-400'}`}>
                      {passwordStrength.rules.hasDigit ? '✓' : '○'} {t('passwordHasDigit')}
                    </p>
                    <p className={`text-xs ${passwordStrength.rules.hasUppercase ? 'text-green-600' : 'text-gray-400'}`}>
                      {passwordStrength.rules.hasUppercase ? '✓' : '○'} {t('passwordHasUppercase')}
                    </p>
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
                  className="w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder={t('confirmPasswordPlaceholder')}
                  required
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  disabled={isSubmitting}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {/* Password match indicator */}
              {formData.confirmPassword && formData.newPassword !== formData.confirmPassword && (
                <p className="mt-1 text-xs text-red-500">{t('passwordMismatch')}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting || !isFormValid}
            >
              {isSubmitting ? t('resetting') : t('submit')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
