'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

// Types for user and profile
export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
}

export interface UserProfile {
  email: string;
  first_name: string;
  last_name: string;
  language: string;
  currency: string;
  fos_enabled: boolean;
  fos_audio: string;
  liturgy_audio: string;
  newsletter: boolean;
}

// Callback types for syncing with contexts
type SyncLanguageCallback = (language: string) => void;
type SyncCurrencyCallback = (currency: string) => void;

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string, rememberMe?: boolean) => Promise<boolean>;
  logout: () => void;
  fetchProfile: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<boolean>;
  syncProfileToContexts: (setLanguage: SyncLanguageCallback, setCurrency: SyncCurrencyCallback) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';
const REMEMBER_ME_KEY = 'remember_me';
// Caches the authenticated user's profile language and currency so the server
// can read them on the next request (via layout.tsx) and render with the correct
// settings from the start — avoiding a visible flash of default values.
export const PROFILE_LOCALE_KEY = 'profile_locale';
export const PROFILE_CURRENCY_KEY = 'profile_currency';

// Helper to get the appropriate storage based on rememberMe setting
const getStorage = (rememberMe: boolean): Storage => {
  return rememberMe ? localStorage : sessionStorage;
};

// Helper to get token from storage
const getStoredToken = (): string | null => {
  // Check rememberMe preference first
  const rememberMe = localStorage.getItem(REMEMBER_ME_KEY) === 'true';
  
  // If rememberMe is true, use localStorage
  if (rememberMe) {
    return localStorage.getItem(TOKEN_KEY);
  }
  
  // Otherwise, use sessionStorage only (no fallback to localStorage)
  return sessionStorage.getItem(TOKEN_KEY);
};

// Persist profile language and currency to both cookies (read server-side by
// layout.tsx for SSR) and localStorage (client-side fallback).
// Centralised here so any future change (e.g. adding Secure flag, changing
// max-age) only needs to be made in one place.
function cacheProfilePreferences(language?: string, currency?: string): void {
  try {
    const maxAge = 60 * 60 * 24 * 365; // 1 year
    if (language) {
      document.cookie = `${PROFILE_LOCALE_KEY}=${language}; max-age=${maxAge}; path=/; SameSite=Lax`;
      document.cookie = `locale=${language}; max-age=${maxAge}; path=/; SameSite=Lax`;
      localStorage.setItem(PROFILE_LOCALE_KEY, language);
      localStorage.setItem('locale', language);
    }
    if (currency) {
      document.cookie = `${PROFILE_CURRENCY_KEY}=${currency}; max-age=${maxAge}; path=/; SameSite=Lax`;
      document.cookie = `currency=${currency}; max-age=${maxAge}; path=/; SameSite=Lax`;
      localStorage.setItem(PROFILE_CURRENCY_KEY, currency);
      localStorage.setItem('currency', currency);
    }
  } catch {
    // Storage not available (e.g. Safari private browsing), ignore
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get API base URL
  const getApiBase = () => {
    if (typeof window === 'undefined') return '/api/oscar';
    return '/api/oscar';
  };

  // Get auth headers with token
  const getAuthHeaders = (): HeadersInit => {
    const token = getStoredToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Token ${token}`;
    }
    return headers;
  };

  // Initialize auth state on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = getStoredToken();
      const savedUser = localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY);
      const rememberMe = localStorage.getItem(REMEMBER_ME_KEY) === 'true';
      
      if (token && savedUser) {
        try {
          const userData = JSON.parse(savedUser);
          setUser(userData);
          // Try to fetch profile in background
          await fetchProfile();
        } catch {
          // Invalid stored data, clear auth
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(USER_KEY);
          sessionStorage.removeItem(TOKEN_KEY);
          sessionStorage.removeItem(USER_KEY);
          localStorage.removeItem(REMEMBER_ME_KEY);
        }
      } else if (!rememberMe && token) {
        // If rememberMe was false but we have a token in sessionStorage, 
        // it means the session has ended - this is expected behavior
      }
      setIsLoading(false);
    };
    
    initAuth();
  }, []);

  // Login function
  const login = async (username: string, password: string, rememberMe: boolean = false): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${getApiBase()}/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Login failed');
      }

      const data = await response.json();
      
      // Determine which storage to use based on rememberMe
      const storage = getStorage(rememberMe);
      
      // Store token and user in the appropriate storage
      storage.setItem(TOKEN_KEY, data.token);
      storage.setItem(USER_KEY, JSON.stringify(data.user));
      
      // Store rememberMe preference in localStorage (for persistence check)
      localStorage.setItem(REMEMBER_ME_KEY, rememberMe.toString());
      
      setUser(data.user);
      
      // Fetch profile after successful login and sync with contexts
      await fetchProfile();
      
      setIsLoading(false);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      setIsLoading(false);
      return false;
    }
  };

  // Logout function
  const logout = () => {
    // Clear from both storages to ensure complete logout
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
    localStorage.removeItem(REMEMBER_ME_KEY);
    // Clear the cached profile locale and currency so the next page load doesn't
    // use stale profile settings after the user has logged out.
    localStorage.removeItem(PROFILE_LOCALE_KEY);
    localStorage.removeItem(PROFILE_CURRENCY_KEY);
    try {
      // Expire the profile cookies so the server stops using them
      document.cookie = `${PROFILE_LOCALE_KEY}=; max-age=0; path=/; SameSite=Lax`;
      document.cookie = `${PROFILE_CURRENCY_KEY}=; max-age=0; path=/; SameSite=Lax`;
    } catch {
      // ignore
    }
    setUser(null);
    setProfile(null);
  };

  // Fetch profile
  const fetchProfile = async (): Promise<void> => {
    try {
      const response = await fetch(`${getApiBase()}/profile/`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Token expired or invalid
          logout();
          return;
        }
        throw new Error('Failed to fetch profile');
      }

      const data = await response.json();
      setProfile(data);
      // Cache language and currency so the server renders correctly on next load.
      cacheProfilePreferences(data.language, data.currency);
    } catch (err) {
      console.error('Failed to fetch profile:', err);
    }
  };

  // Update profile
  const updateProfile = async (data: Partial<UserProfile>): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${getApiBase()}/profile/`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(JSON.stringify(errorData) || 'Failed to update profile');
      }

      const updatedProfile = await response.json();
      setProfile(updatedProfile);
      // Cache updated language and currency so the server renders correctly on next load.
      cacheProfilePreferences(updatedProfile.language, updatedProfile.currency);
      
      // Also update user data if names changed
      if (data.first_name || data.last_name) {
        const updatedUser = {
          ...user!,
          first_name: data.first_name || user?.first_name || '',
          last_name: data.last_name || user?.last_name || '',
        };
        setUser(updatedUser);
        localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
      }
      
      setIsLoading(false);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
      setIsLoading(false);
      return false;
    }
  };

  // Sync profile language/currency to contexts (exposed for manual syncing if needed)
  const syncProfileToContexts = useCallback((setLanguage: SyncLanguageCallback, setCurrency: SyncCurrencyCallback) => {
    if (profile) {
      if (profile.language) {
        setLanguage(profile.language);
      }
      if (profile.currency) {
        setCurrency(profile.currency);
      }
    }
  }, [profile]);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isAuthenticated: !!user,
        isLoading,
        error,
        login,
        logout,
        fetchProfile,
        updateProfile,
        syncProfileToContexts,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
