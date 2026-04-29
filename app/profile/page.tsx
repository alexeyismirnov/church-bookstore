'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, UserProfile } from '../lib/AuthContext';
import { useTranslations } from '../i18n/LanguageContext';
import { User, Mail, Save, Loader2, Trash2, AlertTriangle, Lock, KeyRound, X, Eye, EyeOff } from 'lucide-react';

function getPasswordStrength(password: string) {
  const rules = {
    minLength: password.length >= 8,
    hasLetter: /[a-zA-Z]/.test(password),
    hasDigit: /[0-9]/.test(password),
    hasUppercase: /[a-z]/.test(password) && /[A-Z]/.test(password),
  };
  const score = Object.values(rules).filter(Boolean).length;
  return { rules, score };
}

export default function ProfilePage() {
  const router = useRouter();
  const t = useTranslations('profile');
  const { user, profile, isAuthenticated, isLoading, fetchProfile, updateProfile, logout, deleteAccount } = useAuth();
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    language: 'en',
    currency: 'USD',
    fos_enabled: false,
    fos_audio: 'Y',
    liturgy_audio: 'Y',
    newsletter: false,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Password change state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    old_password: '',
    new_password: '',
    new_password_confirm: '',
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const passwordStrength = useMemo(
    () => getPasswordStrength(passwordData.new_password),
    [passwordData.new_password]
  );
  const isPasswordStrongEnough = passwordStrength.score >= 3;

  const getStrengthColor = (score: number) => {
    if (score <= 1) return 'bg-red-500';
    if (score === 2) return 'bg-orange-400';
    return 'bg-green-500';
  };

  const getStrengthLabel = (score: number) => {
    if (score <= 1) return t('changePassword.passwordWeak');
    if (score === 2) return t('changePassword.passwordMedium');
    return t('changePassword.passwordStrong');
  };

  const getStrengthTextColor = (score: number) => {
    if (score <= 1) return 'text-red-500';
    if (score === 2) return 'text-orange-400';
    return 'text-green-500';
  };

  const isPasswordFormValid =
    passwordData.old_password.trim() !== '' &&
    passwordData.new_password.trim() !== '' &&
    passwordData.new_password_confirm.trim() !== '' &&
    passwordData.new_password === passwordData.new_password_confirm &&
    isPasswordStrongEnough &&
    passwordData.old_password !== passwordData.new_password;

  const closePasswordModal = useCallback(() => {
    setShowPasswordModal(false);
    setPasswordData({ old_password: '', new_password: '', new_password_confirm: '' });
    setPasswordSuccess(null);
    setPasswordError(null);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
  }, []);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSuccess(null);
    setPasswordError(null);

    if (passwordData.new_password !== passwordData.new_password_confirm) {
      setPasswordError(t('changePassword.passwordMismatch'));
      return;
    }

    if (passwordData.old_password === passwordData.new_password) {
      setPasswordError(t('changePassword.passwordsSame'));
      return;
    }

    if (!isPasswordStrongEnough) {
      setPasswordError(t('changePassword.passwordTooWeak'));
      return;
    }

    setIsChangingPassword(true);

    try {
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Token ${token}` } : {}),
      };

      const response = await fetch('/api/oscar/profile/change-password/', {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          old_password: passwordData.old_password,
          new_password: passwordData.new_password,
          new_password_confirm: passwordData.new_password_confirm,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setPasswordSuccess(t('changePassword.success'));
        setPasswordData({ old_password: '', new_password: '', new_password_confirm: '' });
        // Close modal after a short delay so the user sees the success message
        setTimeout(() => {
          closePasswordModal();
        }, 1500);
      } else {
        // Handle field-specific errors from Django
        if (typeof data === 'object') {
          const errorMessages = Object.entries(data)
            .map(([field, messages]) => {
              if (Array.isArray(messages)) {
                return `${field}: ${messages.join(' ')}`;
              }
              return `${field}: ${messages}`;
            })
            .join('\n');
          setPasswordError(errorMessages || t('changePassword.error'));
        } else {
          setPasswordError(data.detail || data.error || t('changePassword.error'));
        }
      }
    } catch {
      setPasswordError(t('changePassword.error'));
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Handle Escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showPasswordModal) {
        closePasswordModal();
      }
    };
    if (showPasswordModal) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [showPasswordModal, closePasswordModal]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  // Fetch profile on mount
  useEffect(() => {
    if (isAuthenticated && !profile) {
      fetchProfile();
    }
  }, [isAuthenticated, profile, fetchProfile]);

  // Update form when profile loads or user data is available
  useEffect(() => {
    if (profile) {
      setFormData({
        first_name: profile.first_name || user?.first_name || '',
        last_name: profile.last_name || user?.last_name || '',
        language: profile.language || 'en',
        currency: profile.currency || 'USD',
        fos_enabled: profile.fos_enabled || false,
        fos_audio: profile.fos_audio || 'Y',
        liturgy_audio: profile.liturgy_audio || 'Y',
        newsletter: profile.newsletter || false,
      });
    } else if (user) {
      // If no profile yet but user data is available from login, use that
      setFormData(prev => ({
        ...prev,
        first_name: user.first_name || '',
        last_name: user.last_name || '',
      }));
    }
  }, [profile, user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
    // Clear messages
    setSuccessMessage(null);
    setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    const success = await updateProfile(formData);
    
    if (success) {
      setSuccessMessage(t('success'));
    } else {
      setErrorMessage(t('error'));
    }
    
    setIsSaving(false);
  };

  const handleLogout = () => {
    logout();
    router.push('/');
    router.refresh();
  };

  if (isLoading && !profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-600">{t('loading')}</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-dark mb-2">{t('title')}</h1>
          <p className="text-gray-600">
            {t('description')}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-8">
          {/* Success/Error Messages */}
          {successMessage && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm mb-6">
              {successMessage}
            </div>
          )}
          {errorMessage && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-6">
              {errorMessage}
            </div>
          )}

          {/* User Email (read-only) */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">{t('email')}</p>
                <p className="font-medium text-dark">{profile?.email || user?.email}</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('firstName')}
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                    placeholder="John"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('lastName')}
                </label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder="Doe"
                />
              </div>
            </div>

            {/* Newsletter */}
            <div className="border-t pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-dark">{t('newsletter')}</p>
                  <p className="text-sm text-gray-500">{t('newsletterDescription')}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="newsletter"
                    checked={formData.newsletter}
                    onChange={handleChange}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex items-center gap-4 pt-4">
              <button
                type="submit"
                disabled={isSaving}
                className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Save className="w-5 h-5" />
                )}
                {isSaving ? t('saving') : t('saveChanges')}
              </button>
              <button
                type="button"
                onClick={() => setShowPasswordModal(true)}
                className="inline-flex items-center gap-2 px-6 py-3 font-medium text-primary border border-primary rounded-lg hover:bg-primary hover:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors"
              >
                <KeyRound className="w-5 h-5" />
                {t('changePassword.openButton')}
              </button>
            </div>
          </form>
        </div>

        {/* Danger Zone — Delete Account */}
        <div className="mt-8 border-2 border-red-300 rounded-2xl bg-red-50/50 p-8">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-6 h-6 text-red-600" />
            <h2 className="text-xl font-bold text-red-700">{t('deleteAccount.title')}</h2>
          </div>
          <p className="text-sm text-red-600 mb-6">
            {t('deleteAccount.warning')}
          </p>

          {deleteError && (
            <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
              {deleteError}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-red-700 mb-1">
                {t('deleteAccount.confirmPassword')}
              </label>
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => {
                  setDeletePassword(e.target.value);
                  setDeleteError(null);
                }}
                className="w-full px-4 py-3 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white"
                placeholder={t('deleteAccount.passwordPlaceholder')}
              />
            </div>
            <button
              type="button"
              disabled={isDeleting || !deletePassword}
              onClick={async () => {
                const confirmed = window.confirm(
                  t('deleteAccount.confirmDialog')
                );
                if (!confirmed) return;

                setIsDeleting(true);
                setDeleteError(null);

                const result = await deleteAccount(deletePassword);

                if (!result.success) {
                  setDeleteError(result.error || t('deleteAccount.error'));
                  setIsDeleting(false);
                }
              }}
              className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isDeleting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Trash2 className="w-5 h-5" />
              )}
              {isDeleting ? t('deleteAccount.deleting') : t('deleteAccount.button')}
            </button>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              closePasswordModal();
            }
          }}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <div className="flex items-center gap-3">
                <KeyRound className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-bold text-dark">{t('changePassword.title')}</h2>
              </div>
              <button
                type="button"
                onClick={closePasswordModal}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {passwordSuccess && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm mb-6">
                  {passwordSuccess}
                </div>
              )}
              {passwordError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-6 whitespace-pre-line">
                  {passwordError}
                </div>
              )}

              <form onSubmit={handlePasswordChange} className="space-y-4">
                {/* Current Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('changePassword.currentPassword')}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="password"
                      value={passwordData.old_password}
                      onChange={(e) => {
                        setPasswordData({ ...passwordData, old_password: e.target.value });
                        setPasswordSuccess(null);
                        setPasswordError(null);
                      }}
                      className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                      placeholder={t('changePassword.currentPasswordPlaceholder')}
                    />
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('changePassword.newPassword')}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={passwordData.new_password}
                      onChange={(e) => {
                        setPasswordData({ ...passwordData, new_password: e.target.value });
                        setPasswordSuccess(null);
                        setPasswordError(null);
                      }}
                      className="w-full pl-10 pr-10 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                      placeholder={t('changePassword.newPasswordPlaceholder')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                      aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                    >
                      {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>

                  {/* Password Strength Meter */}
                  {passwordData.new_password && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-500">{t('changePassword.passwordStrength')}</span>
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
                          <span>{t('changePassword.passwordMinLength')}</span>
                        </div>
                        <div className={`flex items-center gap-1.5 text-xs ${passwordStrength.rules.hasLetter ? 'text-green-600' : 'text-gray-400'}`}>
                          <span>{passwordStrength.rules.hasLetter ? '✓' : '✗'}</span>
                          <span>{t('changePassword.passwordHasLetter')}</span>
                        </div>
                        <div className={`flex items-center gap-1.5 text-xs ${passwordStrength.rules.hasDigit ? 'text-green-600' : 'text-gray-400'}`}>
                          <span>{passwordStrength.rules.hasDigit ? '✓' : '✗'}</span>
                          <span>{t('changePassword.passwordHasDigit')}</span>
                        </div>
                        <div className={`flex items-center gap-1.5 text-xs ${passwordStrength.rules.hasUppercase ? 'text-green-600' : 'text-gray-400'}`}>
                          <span>{passwordStrength.rules.hasUppercase ? '✓' : '✗'}</span>
                          <span>{t('changePassword.passwordHasUppercase')}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm New Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('changePassword.confirmNewPassword')}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={passwordData.new_password_confirm}
                      onChange={(e) => {
                        setPasswordData({ ...passwordData, new_password_confirm: e.target.value });
                        setPasswordSuccess(null);
                        setPasswordError(null);
                      }}
                      className="w-full pl-10 pr-10 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                      placeholder={t('changePassword.confirmPasswordPlaceholder')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {passwordData.new_password_confirm && passwordData.new_password !== passwordData.new_password_confirm && (
                    <p className="mt-1 text-xs text-red-500">{t('changePassword.passwordMismatch')}</p>
                  )}
                </div>

                {/* Modal Footer / Buttons */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={closePasswordModal}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-colors"
                  >
                    {t('changePassword.cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={isChangingPassword || !isPasswordFormValid}
                    className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isChangingPassword ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <KeyRound className="w-5 h-5" />
                    )}
                    {isChangingPassword ? t('changePassword.changing') : t('changePassword.button')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
