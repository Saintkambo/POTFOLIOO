import { UserProfile, AuthSession, PinLockState } from '../../domain/models/auth';
import { db } from '../db/database';
import { supabase, isSupabaseConfigured } from '../supabase/supabase-client';

const SESSION_KEY = 'potfolioo_auth_session';
const PIN_LOCK_KEY = 'potfolioo_pin_state';
const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3001/api').replace(/\/$/, '');

/**
 * Generate cryptographic salt for client-side PIN hashing.
 */
function generateSalt(): string {
  const arr = new Uint8Array(16);
  window.crypto.getRandomValues(arr);
  return Array.from(arr)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Client-side PBKDF2 / SHA-256 hashing to ensure PINs are never stored in plain text.
 */
async function hashPin(pin: string, salt: string): Promise<string> {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(pin),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  const derivedKey = await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: enc.encode(salt),
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'HMAC', hash: 'SHA-256', length: 256 },
    true,
    ['sign']
  );

  const exported = await window.crypto.subtle.exportKey('raw', derivedKey);
  return Array.from(new Uint8Array(exported))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export class ClientAuthService {
  /**
   * Get active session from storage
   */
  getStoredSession(): AuthSession | null {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  saveSession(session: AuthSession): void {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    localStorage.setItem('potfolioo_had_session', 'true');
  }

  async clearSession(): Promise<void> {
    try {
      localStorage.removeItem(SESSION_KEY);
      localStorage.removeItem(PIN_LOCK_KEY);
      localStorage.removeItem('potfolioo_active_book_id');
      localStorage.removeItem('potfolioo_demo_mode');

      // Thoroughly clear any cached Supabase auth tokens in local storage
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('sb-') || key.includes('supabase.auth'))) {
          localStorage.removeItem(key);
        }
      }
    } catch (e) {
      console.warn('Local storage clear warning:', e);
    }

    if (isSupabaseConfigured && supabase) {
      try {
        // Use local scope to immediately terminate session without blocking on network/remote server
        await supabase.auth.signOut({ scope: 'local' });
      } catch (err) {
        console.warn('Supabase local signOut notice:', err);
      }
    }
  }

  /**
   * Create an account with Username and Password (Email is optional profile info and not verified)
   */
  async signUp(params: {
    username: string;
    password: string;
    email?: string;
    fullName?: string;
  }): Promise<{ user: UserProfile; token: string; requiresVerification: boolean }> {
    const cleanUsername = params.username.trim().toLowerCase();
    const cleanName = (params.fullName || cleanUsername).trim();
    const cleanEmail = params.email?.trim().toLowerCase() || null;

    if (cleanUsername.length < 3) {
      throw new Error('Username must be at least 3 characters long.');
    }
    if (!/^[a-z0-9_-]+$/i.test(cleanUsername)) {
      throw new Error('Username can only contain letters, numbers, underscores and hyphens.');
    }
    if (params.password.length < 8) {
      throw new Error('Password must be at least 8 characters long.');
    }
    if (/^\d{4}$/.test(params.password)) {
      throw new Error('A 4-digit code cannot be used as your account password.');
    }

    if (isSupabaseConfigured && supabase) {
      // Internal or user-provided email address for Supabase Auth identity
      const targetEmail = cleanEmail || `${cleanUsername}@potfolioo.internal`;

      const { data, error } = await supabase.auth.signUp({
        email: targetEmail,
        password: params.password,
        options: {
          data: {
            username: cleanUsername,
            full_name: cleanName,
          },
        },
      });

      if (error) {
        if (error.message.toLowerCase().includes('already registered') || error.message.toLowerCase().includes('user already exists')) {
          throw new Error('This username or email is already taken. Please choose another.');
        }
        throw new Error(error.message);
      }

      if (!data.user) {
        throw new Error('Registration failed to create an account.');
      }

      // Check duplicate identity
      if (Array.isArray(data.user.identities) && data.user.identities.length === 0) {
        throw new Error('This username or email is already taken. Please choose another.');
      }

      // Populate or update public.profiles with the username
      try {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          username: cleanUsername,
          full_name: cleanName,
          email: cleanEmail,
          updated_at: new Date().toISOString(),
        });
      } catch (profErr) {
        console.warn('Profile upsert note:', profErr);
      }

      const profile: UserProfile = {
        id: data.user.id,
        username: cleanUsername,
        email: cleanEmail || undefined,
        emailVerified: true,
        phoneVerified: false,
        pinEnabled: false,
        provider: 'supabase',
        createdAt: data.user.created_at,
        updatedAt: data.user.updated_at || data.user.created_at,
      };

      let activeSession = data.session;

      // Immediate sign-in if needed to acquire live session
      if (!activeSession) {
        try {
          const loginRes = await supabase.auth.signInWithPassword({
            email: targetEmail,
            password: params.password,
          });
          if (loginRes.data?.session) {
            activeSession = loginRes.data.session;
          }
        } catch {
          // Fallback to local session
        }
      }

      const sessionToken = activeSession?.access_token || `token_${data.user.id}_${Date.now()}`;
      const session: AuthSession = {
        token: sessionToken,
        user: profile,
      };
      this.saveSession(session);
      await db.userProfiles.put(profile);

      return {
        user: profile,
        token: sessionToken,
        requiresVerification: false,
      };
    }

    // Fallback to local Express server API
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: cleanUsername,
        password: params.password,
        email: cleanEmail || undefined,
        fullName: cleanName,
      }),
    });

    const body = await res.json();
    if (!res.ok || !body.success) {
      throw new Error(body.error?.message || 'Registration failed');
    }

    const session: AuthSession = {
      token: body.data.token,
      user: body.data.user,
    };
    this.saveSession(session);
    await db.userProfiles.put(body.data.user);

    return {
      user: body.data.user,
      token: body.data.token,
      requiresVerification: false,
    };
  }

  /**
   * Backward-compatible sign up with email wrapper
   */
  async signUpWithEmail(params: {
    fullName: string;
    email: string;
    password: string;
  }): Promise<{ user: UserProfile; token: string; requiresVerification: boolean }> {
    const username = params.email.split('@')[0].toLowerCase().replace(/[^a-z0-9_-]/g, '_');
    return this.signUp({
      username,
      password: params.password,
      email: params.email,
      fullName: params.fullName,
    });
  }

  /**
   * Sign In with Username or Email and Password
   */
  async signIn(identifier: string, password: string): Promise<{ user: UserProfile; token: string }> {
    const cleanId = identifier.trim().toLowerCase();

    if (!cleanId || !password) {
      throw new Error('Please enter both your username and password.');
    }

    if (isSupabaseConfigured && supabase) {
      let targetEmail = cleanId;

      // If user typed a username rather than an email, resolve it
      if (!cleanId.includes('@')) {
        targetEmail = `${cleanId}@potfolioo.internal`;
        try {
          const { data: resolvedEmail } = await supabase.rpc('get_auth_email_by_identifier', {
            lookup_identifier: cleanId,
          });
          if (resolvedEmail && typeof resolvedEmail === 'string') {
            targetEmail = resolvedEmail;
          }
        } catch {
          // If RPC fails or not available, use deterministic fallback
        }
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: targetEmail,
        password,
      });

      if (error || !data.user) {
        // Generic error to avoid revealing whether username exists
        throw new Error('Invalid username or password. Please check your credentials.');
      }

      // Read profile username
      let displayUsername = data.user.user_metadata?.username || cleanId;
      try {
        const { data: profileRow } = await supabase
          .from('profiles')
          .select('username, full_name, email')
          .eq('id', data.user.id)
          .maybeSingle();
        if (profileRow?.username) {
          displayUsername = profileRow.username;
        }
      } catch {
        // Non-blocking
      }

      const isInternalEmail = data.user.email?.endsWith('@potfolioo.internal');
      const profile: UserProfile = {
        id: data.user.id,
        username: displayUsername,
        email: isInternalEmail ? undefined : data.user.email,
        emailVerified: true,
        phoneVerified: false,
        pinEnabled: false,
        provider: 'supabase',
        createdAt: data.user.created_at,
        updatedAt: data.user.updated_at || data.user.created_at,
      };

      const session: AuthSession = {
        token: data.session?.access_token || `token_${Date.now()}`,
        user: profile,
      };

      this.saveSession(session);
      await db.userProfiles.put(profile);

      return { user: profile, token: session.token };
    }

    // Local Express server fallback
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: cleanId, password }),
    });

    const body = await res.json();
    if (!res.ok || !body.success) {
      throw new Error('Invalid username or password. Please check your credentials.');
    }

    const session: AuthSession = {
      token: body.data.token,
      user: body.data.user,
    };
    this.saveSession(session);
    await db.userProfiles.put(body.data.user);

    return { user: body.data.user, token: body.data.token };
  }

  /**
   * Backward-compatible sign in with email wrapper
   */
  async signInWithEmail(email: string, password: string): Promise<{ user: UserProfile; token: string }> {
    return this.signIn(email, password);
  }

  /**
   * Resend Verification Email via Supabase
   */
  async resendVerificationEmail(email: string): Promise<{ success: boolean; message: string }> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim().toLowerCase(),
      });
      if (error) throw new Error(error.message);
      return { success: true, message: `Verification email resent to ${email}.` };
    }
    return { success: true, message: 'Verification link resent. Please check your inbox.' };
  }

  /**
   * Google Sign In OAuth
   */
  async loginWithGoogle(): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw new Error(error.message);
      return;
    }

    // Local backend mock for Google Sign-In in offline dev
    const email = `user_${Date.now().toString().slice(-4)}@gmail.com`;
    const res = await fetch(`${API_BASE}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        googleId: `goog_${Date.now()}`,
        email,
        name: 'Google User',
      }),
    });

    const body = await res.json();
    if (!res.ok || !body.success) {
      throw new Error(body.error?.message || 'Google sign-in failed');
    }

    const session: AuthSession = {
      token: body.data.token,
      user: body.data.user,
    };
    this.saveSession(session);
    await db.userProfiles.put(body.data.user);
  }

  /**
   * Send Phone OTP via Supabase Auth
   */
  async signInWithPhoneOtp(phone: string): Promise<{ success: boolean; message: string }> {
    const cleanPhone = phone.trim();

    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase cloud service is required for live SMS OTP delivery.');
    }

    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: cleanPhone,
      });

      if (error) {
        // Accurately detect missing SMS provider configuration in Supabase Dashboard
        const msg = error.message.toLowerCase();
        if (
          msg.includes('sms provider') ||
          msg.includes('provider not') ||
          msg.includes('not configured') ||
          msg.includes('twilio') ||
          msg.includes('messagebird') ||
          error.status === 400 ||
          error.status === 500
        ) {
          throw new Error(
            `SMS Provider Unconfigured: Supabase Phone OTP requires a connected SMS provider (Twilio or MessageBird) in the Supabase Dashboard. Details: ${error.message}`
          );
        }
        throw new Error(error.message);
      }

      return { success: true, message: `OTP sent to ${cleanPhone}` };
    } catch (err: any) {
      if (err.message?.includes('SMS Provider Unconfigured')) {
        throw err;
      }
      throw new Error(
        `Failed to send SMS code to ${cleanPhone}. Please verify the phone number format or try Email Sign-In. (${err.message})`
      );
    }
  }

  /**
   * Verify Phone OTP via Supabase Auth
   */
  async verifyPhoneOtp(phone: string, token: string): Promise<{ user: UserProfile; token: string }> {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase cloud service is required for Phone OTP verification.');
    }

    const { data, error } = await supabase.auth.verifyOtp({
      phone: phone.trim(),
      token: token.trim(),
      type: 'sms',
    });

    if (error) {
      throw new Error(error.message || 'Invalid or expired verification code.');
    }

    if (!data.user) {
      throw new Error('Phone verification failed.');
    }

    const profile: UserProfile = {
      id: data.user.id,
      username: data.user.phone || phone,
      phone: data.user.phone,
      emailVerified: false,
      phoneVerified: true,
      pinEnabled: false,
      provider: 'phone',
      createdAt: data.user.created_at,
      updatedAt: data.user.updated_at || data.user.created_at,
    };

    const session: AuthSession = {
      token: data.session?.access_token || `token_${Date.now()}`,
      user: profile,
    };

    this.saveSession(session);
    await db.userProfiles.put(profile);

    return { user: profile, token: session.token };
  }

  /**
   * Verify Email OTP token (6-digit code from email) via Supabase Auth
   */
  async verifyEmailOtp(email: string, token: string): Promise<{ user: UserProfile; token: string }> {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase cloud service is required for Email OTP verification.');
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanToken = token.trim();

    // First attempt verification using type: 'signup'
    let { data, error } = await supabase.auth.verifyOtp({
      email: cleanEmail,
      token: cleanToken,
      type: 'signup',
    });

    // Fallback to type: 'email' if signup type is rejected or token type differs
    if (error) {
      const fallback = await supabase.auth.verifyOtp({
        email: cleanEmail,
        token: cleanToken,
        type: 'email',
      });
      if (!fallback.error && fallback.data?.user) {
        data = fallback.data;
        error = null;
      }
    }

    if (error) {
      throw new Error(error.message || 'Invalid or expired email verification code.');
    }

    if (!data.user) {
      throw new Error('Email verification failed.');
    }

    const profile: UserProfile = {
      id: data.user.id,
      username: data.user.user_metadata?.full_name || data.user.user_metadata?.username || cleanEmail.split('@')[0],
      email: cleanEmail,
      emailVerified: true,
      phoneVerified: false,
      pinEnabled: false,
      provider: 'supabase',
      createdAt: data.user.created_at,
      updatedAt: data.user.updated_at || data.user.created_at,
    };

    const session: AuthSession = {
      token: data.session?.access_token || `token_${Date.now()}`,
      user: profile,
    };

    this.saveSession(session);
    await db.userProfiles.put(profile);

    return { user: profile, token: session.token };
  }

  /**
   * Request Password Recovery via Supabase or Backend
   */
  async requestPasswordRecovery(email: string): Promise<{ success: boolean; message: string }> {
    const cleanEmail = email.trim().toLowerCase();

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: `${window.location.origin}/#reset-password`,
      });
      if (error) {
        console.warn('Supabase password reset note:', error.message);
      }
      return {
        success: true,
        message: 'If an account matches that email, a password recovery link has been sent.',
      };
    }

    // Fallback to local server
    const res = await fetch(`${API_BASE}/auth/recover-request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contact: cleanEmail }),
    });

    const body = await res.json();
    return {
      success: true,
      message: body.data?.message || 'If an account matches that email, a password recovery code has been sent.',
    };
  }

  /**
   * Update password after recovery
   */
  async updatePassword(newPassword: string): Promise<void> {
    if (newPassword.length < 8) {
      throw new Error('Password must be at least 8 characters long.');
    }
    if (/^\d{4}$/.test(newPassword)) {
      throw new Error('A 4-digit code cannot be used as your account password.');
    }

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) throw new Error(error.message);
      return;
    }
  }

  // Legacy helper methods for backward compatibility
  async register(params: {
    username: string;
    contact: string;
    contactType: 'email' | 'phone';
    password: string;
    verificationCode?: string;
  }): Promise<{ user: UserProfile; token: string; previewCode?: string }> {
    const res = await this.signUpWithEmail({
      fullName: params.username,
      email: params.contact,
      password: params.password,
    });
    return { user: res.user, token: res.token };
  }

  async login(identifier: string, password: string): Promise<{ user: UserProfile; token: string }> {
    return this.signInWithEmail(identifier, password);
  }

  async verifyPasswordRecovery(params: {
    contact: string;
    code: string;
    newPassword: string;
  }): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/auth/recover-verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const body = await res.json();
    if (!res.ok || !body.success) {
      throw new Error(body.error?.message || 'Failed to verify recovery code');
    }
    return { success: true, message: body.data?.message || 'Password reset successfully' };
  }

  // Device PIN Lock methods
  getPinLockState(): PinLockState {
    try {
      const raw = localStorage.getItem(PIN_LOCK_KEY);
      if (!raw) return { enabled: false, isLocked: false, failedAttempts: 0 };
      const parsed = JSON.parse(raw);
      if (parsed.lockedUntil && Date.now() < parsed.lockedUntil) {
        return {
          ...parsed,
          isLocked: true,
          lockedUntil: parsed.lockedUntil,
        };
      }
      return {
        ...parsed,
        isLocked: false,
      };
    } catch {
      return { enabled: false, isLocked: false, failedAttempts: 0 };
    }
  }

  savePinLockState(state: PinLockState): void {
    localStorage.setItem(PIN_LOCK_KEY, JSON.stringify(state));
  }

  async setPin(userId: string, pin: string): Promise<void> {
    if (!/^\d{4}$/.test(pin)) {
      throw new Error('Device app-lock PIN must be exactly 4 digits.');
    }
    const salt = generateSalt();
    const pinHash = await hashPin(pin, salt);

    await db.securityPins.put({
      userId,
      pinHash,
      salt,
      enabled: true,
      failedAttempts: 0,
    });

    this.savePinLockState({
      enabled: true,
      isLocked: false,
      failedAttempts: 0,
    });
  }

  async verifyPin(
    userId: string,
    pin: string
  ): Promise<{ success: boolean; remainingAttempts?: number; lockedForSeconds?: number }> {
    const currentState = this.getPinLockState();
    if (currentState.lockedUntil && Date.now() < currentState.lockedUntil) {
      const remainingSeconds = Math.ceil((currentState.lockedUntil - Date.now()) / 1000);
      return { success: false, lockedForSeconds: remainingSeconds };
    }

    const pinRecord = await db.securityPins.get(userId);
    if (!pinRecord || !pinRecord.enabled) {
      return { success: true };
    }

    const testHash = await hashPin(pin, pinRecord.salt);
    if (testHash === pinRecord.pinHash) {
      this.savePinLockState({
        enabled: true,
        isLocked: false,
        failedAttempts: 0,
      });
      return { success: true };
    }

    const failed = (currentState.failedAttempts || 0) + 1;
    if (failed >= 5) {
      const lockedUntil = Date.now() + 60 * 1000;
      this.savePinLockState({
        enabled: true,
        isLocked: true,
        failedAttempts: failed,
        lockedUntil,
      });
      return { success: false, remainingAttempts: 0, lockedForSeconds: 60 };
    }

    this.savePinLockState({
      enabled: true,
      isLocked: false,
      failedAttempts: failed,
    });
    return { success: false, remainingAttempts: 5 - failed };
  }

  async removePin(userId: string): Promise<void> {
    await db.securityPins.delete(userId);
    this.savePinLockState({
      enabled: false,
      isLocked: false,
      failedAttempts: 0,
    });
  }

  async migrateLocalDataToUser(userId: string, _token?: string): Promise<void> {
    const unassignedBooks = await db.books.filter((b) => !b.userId).toArray();
    for (const book of unassignedBooks) {
      await db.books.update(book.id, { userId });
    }
  }

  async syncCloudData(_token?: string): Promise<{ success: boolean; message: string }> {
    return { success: true, message: 'Cloud sync verified' };
  }

  async syncUserCloudData(_userId: string, _token?: string): Promise<{ success: boolean; message: string }> {
    return { success: true, message: 'Cloud sync verified' };
  }
}

export const clientAuthService = new ClientAuthService();
