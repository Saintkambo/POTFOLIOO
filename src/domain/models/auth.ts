export interface UserProfile {
  id: string;
  username: string;
  email?: string;
  phone?: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  pinEnabled: boolean;
  provider: 'local' | 'google' | 'supabase' | 'phone' | string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthSession {
  token: string;
  user: UserProfile;
  expiresAt?: string;
}

export interface PinLockState {
  enabled: boolean;
  isLocked: boolean;
  failedAttempts: number;
  lockedUntil?: number; // epoch ms
}
