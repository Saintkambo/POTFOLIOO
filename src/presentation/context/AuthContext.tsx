import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserProfile, AuthSession, PinLockState } from '../../domain/models/auth';
import { clientAuthService } from '../../infrastructure/auth/auth-service';
import { supabase, isSupabaseConfigured } from '../../infrastructure/supabase/supabase-client';

interface AuthContextType {
  currentUser: UserProfile | null;
  isAuthenticated: boolean;
  isAppLocked: boolean;
  isDemoMode: boolean;
  pinState: PinLockState;
  authSession: AuthSession | null;
  isAuthLoading: boolean;
  authError: string | null;
  clearAuthError: () => void;

  // Demo mode
  enterDemoMode: () => void;
  exitDemoMode: () => void;

  // Modern Username & Password Auth
  signUp: (params: { username: string; password: string; email?: string; fullName?: string }) => Promise<{ requiresVerification: boolean; user?: UserProfile; token?: string }>;
  signIn: (identifier: string, password: string) => Promise<void>;

  // Modern Supabase & Unified Auth
  signUpWithEmail: (params: { fullName: string; email: string; password: string }) => Promise<{ requiresVerification: boolean; email: string; user?: UserProfile; token?: string }>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  verifyEmailOtp: (email: string, token: string) => Promise<void>;
  skipVerificationAndEnter: (user: UserProfile, token: string) => Promise<void>;
  resendVerificationEmail: (email: string) => Promise<{ success: boolean; message: string }>;
  signInWithGoogle: () => Promise<void>;
  signInWithPhoneOtp: (phone: string) => Promise<{ success: boolean; message: string }>;
  verifyPhoneOtp: (phone: string, token: string) => Promise<void>;
  resetPasswordForEmail: (email: string) => Promise<{ success: boolean; message: string }>;
  updateUserPassword: (password: string) => Promise<void>;

  // Legacy & Compatibility Methods
  login: (identifier: string, password: string) => Promise<void>;
  register: (params: {
    username: string;
    contact: string;
    contactType: 'email' | 'phone';
    password: string;
    verificationCode?: string;
  }) => Promise<{ previewCode?: string }>;
  loginWithGoogle: () => Promise<void>;
  requestPasswordRecovery: (contact: string) => Promise<{ success: boolean; message: string; previewCode?: string }>;
  verifyPasswordRecovery: (params: {
    contact: string;
    code: string;
    newPassword: string;
  }) => Promise<{ success: boolean; message: string }>;
  logout: () => void | Promise<void>;

  // Device App-Lock PIN
  verifyPin: (pin: string) => Promise<{ success: boolean; remainingAttempts?: number; lockedForSeconds?: number }>;
  setPin: (pin: string) => Promise<void>;
  removePin: () => Promise<void>;
  unlockWithPassword: (password: string) => Promise<boolean>;
  syncCloudData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [authSession, setAuthSession] = useState<AuthSession | null>(null);
  const [isAppLocked, setIsAppLocked] = useState<boolean>(false);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(() => {
    return localStorage.getItem('potfolioo_demo_mode') === 'true';
  });
  const [pinState, setPinState] = useState<PinLockState>({
    enabled: false,
    isLocked: false,
    failedAttempts: 0,
  });
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const clearAuthError = useCallback(() => setAuthError(null), []);

  const enterDemoMode = useCallback(() => {
    setIsDemoMode(true);
    localStorage.setItem('potfolioo_demo_mode', 'true');
  }, []);

  const exitDemoMode = useCallback(() => {
    setIsDemoMode(false);
    localStorage.removeItem('potfolioo_demo_mode');
  }, []);

  // Initialize session and device app-lock on startup
  useEffect(() => {
    async function initAuth() {
      try {
        setIsAuthLoading(true);

        // Check local storage session first
        const stored = clientAuthService.getStoredSession();
        if (stored && stored.user) {
          setCurrentUser(stored.user);
          setAuthSession(stored);

          const pin = clientAuthService.getPinLockState();
          setPinState(pin);
          if (pin.enabled) {
            setIsAppLocked(true);
          }
        }

        // If Supabase is configured, sync with active Supabase session
        if (isSupabaseConfigured && supabase) {
          const { data } = await supabase.auth.getSession();
          if (data.session?.user) {
            const sbUser = data.session.user;
            const profile: UserProfile = {
              id: sbUser.id,
              username: sbUser.user_metadata?.full_name || sbUser.user_metadata?.username || sbUser.email?.split('@')[0] || 'User',
              email: sbUser.email,
              phone: sbUser.phone,
              emailVerified: Boolean(sbUser.email_confirmed_at),
              phoneVerified: Boolean(sbUser.phone_confirmed_at),
              pinEnabled: false,
              provider: sbUser.app_metadata?.provider || 'supabase',
              createdAt: sbUser.created_at,
              updatedAt: sbUser.updated_at || sbUser.created_at,
            };
            const session: AuthSession = {
              token: data.session.access_token,
              user: profile,
            };
            setCurrentUser(profile);
            setAuthSession(session);
            clientAuthService.saveSession(session);
          }
        }
      } catch (e) {
        console.warn('Failed to restore auth session:', e);
      } finally {
        setIsAuthLoading(false);
      }
    }

    initAuth();

    // Listen to Supabase auth state changes (OAuth callbacks, confirmation, password reset)
    if (isSupabaseConfigured && supabase) {
      const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
          const sbUser = session.user;
          const profile: UserProfile = {
            id: sbUser.id,
            username: sbUser.user_metadata?.full_name || sbUser.user_metadata?.username || sbUser.email?.split('@')[0] || 'User',
            email: sbUser.email,
            phone: sbUser.phone,
            emailVerified: Boolean(sbUser.email_confirmed_at),
            phoneVerified: Boolean(sbUser.phone_confirmed_at),
            pinEnabled: false,
            provider: sbUser.app_metadata?.provider || 'supabase',
            createdAt: sbUser.created_at,
            updatedAt: sbUser.updated_at || sbUser.created_at,
          };
          const newSession: AuthSession = {
            token: session.access_token,
            user: profile,
          };
          setCurrentUser(profile);
          setAuthSession(newSession);
          clientAuthService.saveSession(newSession);
        } else if (event === 'SIGNED_OUT') {
          setCurrentUser(null);
          setAuthSession(null);
          // Safely cleared; never call signOut inside SIGNED_OUT handler to avoid infinite loop
        }
      });

      return () => {
        authListener.subscription.unsubscribe();
      };
    }
  }, []);

  // Primary Username & Password Sign Up
  const signUp = async (params: { username: string; password: string; email?: string; fullName?: string }) => {
    setAuthError(null);
    try {
      const res = await clientAuthService.signUp(params);
      const session: AuthSession = { user: res.user, token: res.token };
      setCurrentUser(res.user);
      setAuthSession(session);
      setIsAppLocked(false);
      return {
        requiresVerification: false,
        user: res.user,
        token: res.token,
      };
    } catch (err: any) {
      setAuthError(err.message || 'Registration failed');
      throw err;
    }
  };

  // Primary Username / Email Sign In
  const signIn = async (identifier: string, password: string) => {
    setAuthError(null);
    try {
      const { user, token } = await clientAuthService.signIn(identifier, password);
      const session: AuthSession = { user, token };
      setCurrentUser(user);
      setAuthSession(session);

      const pin = clientAuthService.getPinLockState();
      setPinState(pin);
      if (pin.enabled) {
        setIsAppLocked(true);
      } else {
        setIsAppLocked(false);
      }
    } catch (err: any) {
      setAuthError(err.message || 'Sign in failed');
      throw err;
    }
  };

  // Backward compatible Sign Up with Email
  const signUpWithEmail = async (params: { fullName: string; email: string; password: string }) => {
    const cleanUsername = params.email.split('@')[0].toLowerCase().replace(/[^a-z0-9_-]/g, '_');
    const res = await signUp({
      username: cleanUsername,
      password: params.password,
      email: params.email,
      fullName: params.fullName,
    });
    return {
      requiresVerification: false,
      email: params.email,
      user: res.user,
      token: res.token,
    };
  };

  // Instant bypass verification (for dev, testing, or deferred email validation)
  const skipVerificationAndEnter = async (user: UserProfile, token: string) => {
    setAuthError(null);
    try {
      const session: AuthSession = { user, token };
      clientAuthService.saveSession(session);
      setCurrentUser(user);
      setAuthSession(session);
      setIsAppLocked(false);
    } catch (err: any) {
      setAuthError(err.message || 'Failed to initialize session');
      throw err;
    }
  };

  // Backward compatible Sign In with Email
  const signInWithEmail = async (email: string, password: string) => {
    return signIn(email, password);
  };

  const resendVerificationEmail = async (email: string) => {
    return clientAuthService.resendVerificationEmail(email);
  };

  const verifyEmailOtp = async (email: string, token: string) => {
    setAuthError(null);
    try {
      const { user, token: sessionToken } = await clientAuthService.verifyEmailOtp(email, token);
      const session: AuthSession = { user, token: sessionToken };
      setCurrentUser(user);
      setAuthSession(session);
      setIsAppLocked(false);
    } catch (err: any) {
      setAuthError(err.message || 'Email OTP verification failed');
      throw err;
    }
  };

  const signInWithGoogle = async () => {
    setAuthError(null);
    try {
      await clientAuthService.loginWithGoogle();
    } catch (err: any) {
      setAuthError(err.message || 'Google authentication failed');
      throw err;
    }
  };

  const signInWithPhoneOtp = async (phone: string) => {
    setAuthError(null);
    return clientAuthService.signInWithPhoneOtp(phone);
  };

  const verifyPhoneOtp = async (phone: string, token: string) => {
    setAuthError(null);
    try {
      const { user, token: sessionToken } = await clientAuthService.verifyPhoneOtp(phone, token);
      const session: AuthSession = { user, token: sessionToken };
      setCurrentUser(user);
      setAuthSession(session);
      setIsAppLocked(false);
    } catch (err: any) {
      setAuthError(err.message || 'Phone OTP verification failed');
      throw err;
    }
  };

  const resetPasswordForEmail = async (email: string) => {
    setAuthError(null);
    return clientAuthService.requestPasswordRecovery(email);
  };

  const updateUserPassword = async (password: string) => {
    setAuthError(null);
    return clientAuthService.updatePassword(password);
  };

  // Legacy mappings
  const login = async (identifier: string, password: string) => {
    return signInWithEmail(identifier, password);
  };

  const register = async (params: {
    username: string;
    contact: string;
    contactType: 'email' | 'phone';
    password: string;
    verificationCode?: string;
  }) => {
    await signUpWithEmail({
      fullName: params.username,
      email: params.contact,
      password: params.password,
    });
    return { previewCode: undefined };
  };

  const loginWithGoogle = async () => {
    return signInWithGoogle();
  };

  const requestPasswordRecovery = async (contact: string) => {
    const res = await resetPasswordForEmail(contact);
    return { success: res.success, message: res.message };
  };

  const verifyPasswordRecovery = async (params: {
    contact: string;
    code: string;
    newPassword: string;
  }) => {
    return clientAuthService.verifyPasswordRecovery(params);
  };

  const logout = async () => {
    try {
      localStorage.setItem('potfolioo_auth_view', 'signin');
      localStorage.removeItem('potfolioo_active_book_id');
      localStorage.removeItem('potfolioo_demo_mode');

      await clientAuthService.clearSession();

      setCurrentUser(null);
      setAuthSession(null);
      setIsAppLocked(false);
      setIsDemoMode(false);
    } catch (e) {
      console.warn('Logout exception caught:', e);
      setCurrentUser(null);
      setAuthSession(null);
      setIsAppLocked(false);
    }
  };

  const verifyPin = async (pin: string) => {
    if (!currentUser) return { success: false };
    const res = await clientAuthService.verifyPin(currentUser.id, pin);
    if (res.success) {
      setIsAppLocked(false);
    }
    return res;
  };

  const setPin = async (pin: string) => {
    if (!currentUser) return;
    await clientAuthService.setPin(currentUser.id, pin);
    setPinState({ enabled: true, isLocked: false, failedAttempts: 0 });
    setIsAppLocked(false);
  };

  const removePin = async () => {
    if (!currentUser) return;
    await clientAuthService.removePin(currentUser.id);
    setPinState({ enabled: false, isLocked: false, failedAttempts: 0 });
    setIsAppLocked(false);
  };

  const unlockWithPassword = async (password: string): Promise<boolean> => {
    if (!currentUser) return false;
    try {
      await signInWithEmail(currentUser.email || currentUser.username, password);
      setIsAppLocked(false);
      return true;
    } catch {
      return false;
    }
  };

  const syncCloudData = async () => {
    if (authSession?.token) {
      await clientAuthService.syncCloudData(authSession.token);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: Boolean(currentUser),
        isAppLocked,
        isDemoMode,
        pinState,
        authSession,
        isAuthLoading,
        authError,
        clearAuthError,
        enterDemoMode,
        exitDemoMode,
        signUp,
        signIn,
        signUpWithEmail,
        signInWithEmail,
        resendVerificationEmail,
        verifyEmailOtp,
        skipVerificationAndEnter,
        signInWithGoogle,
        signInWithPhoneOtp,
        verifyPhoneOtp,
        resetPasswordForEmail,
        updateUserPassword,
        login,
        register,
        loginWithGoogle,
        requestPasswordRecovery,
        verifyPasswordRecovery,
        logout,
        verifyPin,
        setPin,
        removePin,
        unlockWithPassword,
        syncCloudData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
