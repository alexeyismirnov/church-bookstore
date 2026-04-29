// app/lib/password.ts
// Shared password strength utility used by register, reset-password, and profile pages

export interface PasswordRules {
  minLength: boolean;
  hasLetter: boolean;
  hasDigit: boolean;
  hasUppercase: boolean;
}

export interface PasswordStrength {
  rules: PasswordRules;
  score: number; // 0-4
}

export function getPasswordStrength(password: string): PasswordStrength {
  const rules: PasswordRules = {
    minLength: password.length >= 8,
    hasLetter: /[a-zA-Z]/.test(password),
    hasDigit: /[0-9]/.test(password),
    hasUppercase: /[a-z]/.test(password) && /[A-Z]/.test(password),
  };
  const score = Object.values(rules).filter(Boolean).length;
  return { rules, score };
}

export function isPasswordStrongEnough(password: string): boolean {
  return getPasswordStrength(password).score >= 3;
}

export function getStrengthColor(score: number): string {
  if (score <= 1) return 'bg-red-500';
  if (score === 2) return 'bg-orange-400';
  return 'bg-green-500';
}

export function getStrengthTextColor(score: number): string {
  if (score <= 1) return 'text-red-500';
  if (score === 2) return 'text-orange-400';
  return 'text-green-500';
}
