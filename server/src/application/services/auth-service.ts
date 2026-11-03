import crypto from 'node:crypto';
import { getDb } from '../../infrastructure/db/connection.js';
import { hashSecret, verifySecret, generateNumericCode, generateToken } from '../../infrastructure/security/hash.js';
import { ValidationError, UnauthorizedError } from '../../domain/errors.js';

export interface UserRow {
  id: string;
  username: string;
  email: string | null;
  phone: string | null;
  password_hash: string;
  salt: string;
  pin_hash: string | null;
  pin_salt: string | null;
  pin_enabled: number;
  email_verified: number;
  phone_verified: number;
  provider: string;
  verification_code: string | null;
  verification_expires_at: string | null;
  recovery_code: string | null;
  recovery_expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserProfileDTO {
  id: string;
  username: string;
  email?: string;
  phone?: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  pinEnabled: boolean;
  provider: string;
  createdAt: string;
  updatedAt: string;
}

export class AuthService {
  private checkRateLimit(key: string, maxAttempts = 5, windowMs = 15 * 60 * 1000): void {
    const db = getDb();
    const now = new Date();

    const existing = db.prepare('SELECT attempts, reset_at FROM rate_limits WHERE key = ?').get(key) as
      | { attempts: number; reset_at: string }
      | undefined;

    if (!existing) {
      const resetAt = new Date(now.getTime() + windowMs).toISOString();
      db.prepare('INSERT INTO rate_limits (key, attempts, reset_at) VALUES (?, 1, ?)').run(key, resetAt);
      return;
    }

    if (new Date(existing.reset_at) < now) {
      // Window expired, reset counter
      const resetAt = new Date(now.getTime() + windowMs).toISOString();
      db.prepare('UPDATE rate_limits SET attempts = 1, reset_at = ? WHERE key = ?').run(resetAt, key);
      return;
    }

    if (existing.attempts >= maxAttempts) {
      const waitMinutes = Math.ceil((new Date(existing.reset_at).getTime() - now.getTime()) / 60000);
      throw new ValidationError('rate_limit', `Too many attempts. Please try again in ${waitMinutes} minute(s).`);
    }

    db.prepare('UPDATE rate_limits SET attempts = attempts + 1 WHERE key = ?').run(key);
  }

  private resetRateLimit(key: string): void {
    const db = getDb();
    db.prepare('DELETE FROM rate_limits WHERE key = ?').run(key);
  }

  private validateSecurePassword(password: string): void {
    if (!password || typeof password !== 'string') {
      throw new ValidationError('password', 'Password is required.');
    }
    // Reject 4-digit PIN used as sole cloud account password
    if (/^\d{4}$/.test(password)) {
      throw new ValidationError(
        'password',
        'A four-digit code cannot be used as your account password. Please choose a secure password with at least 8 characters.'
      );
    }
    if (password.length < 8) {
      throw new ValidationError('password', 'Password must be at least 8 characters long.');
    }
  }

  private toDTO(row: UserRow): UserProfileDTO {
    return {
      id: row.id,
      username: row.username,
      email: row.email || undefined,
      phone: row.phone || undefined,
      emailVerified: Boolean(row.email_verified),
      phoneVerified: Boolean(row.phone_verified),
      pinEnabled: Boolean(row.pin_enabled),
      provider: row.provider,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async register(params: {
    username: string;
    contact: string;
    contactType: 'email' | 'phone';
    password: string;
    verificationCode?: string;
  }): Promise<{ user: UserProfileDTO; token: string; verificationCode?: string }> {
    const db = getDb();
    const cleanUsername = params.username.trim().toLowerCase();
    const cleanContact = params.contact.trim();

    if (cleanUsername.length < 3) {
      throw new ValidationError('username', 'Username must be at least 3 characters long.');
    }
    if (!/^[a-z0-9_-]+$/i.test(cleanUsername)) {
      throw new ValidationError('username', 'Username can only contain letters, numbers, underscores and hyphens.');
    }

    this.validateSecurePassword(params.password);

    // Validate email / phone format
    const isEmail = params.contactType === 'email';
    if (isEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanContact)) {
      throw new ValidationError('contact', 'Please provide a valid email address.');
    }
    if (!isEmail && !/^\+?[0-9]{7,15}$/.test(cleanContact.replace(/[\s-]/g, ''))) {
      throw new ValidationError('contact', 'Please provide a valid phone number with digits.');
    }

    // Check if username already exists
    const existingUser = db.prepare('SELECT id FROM users WHERE username = ?').get(cleanUsername);
    if (existingUser) {
      throw new ValidationError('username', 'This username is already taken. Please choose another.');
    }

    // Check if contact already exists
    const existingContact = isEmail
      ? db.prepare('SELECT id FROM users WHERE email = ?').get(cleanContact.toLowerCase())
      : db.prepare('SELECT id FROM users WHERE phone = ?').get(cleanContact);
    if (existingContact) {
      throw new ValidationError('contact', `This ${params.contactType} is already associated with an account.`);
    }

    const { hash, salt } = hashSecret(params.password);
    const userId = crypto.randomUUID();
    const now = new Date().toISOString();
    const verificationCode = generateNumericCode(6);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    db.prepare(`
      INSERT INTO users (
        id, username, email, phone, password_hash, salt,
        pin_enabled, email_verified, phone_verified, provider,
        verification_code, verification_expires_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, 'local', ?, ?, ?, ?)
    `).run(
      userId,
      cleanUsername,
      isEmail ? cleanContact.toLowerCase() : null,
      !isEmail ? cleanContact : null,
      hash,
      salt,
      isEmail ? 1 : 0, // Auto-verified upon code entry/registration
      !isEmail ? 1 : 0,
      verificationCode,
      expiresAt,
      now,
      now
    );

    const token = generateToken();
    const sessionExpires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    db.prepare('INSERT INTO auth_sessions (id, user_id, token, expires_at, created_at) VALUES (?, ?, ?, ?, ?)').run(
      crypto.randomUUID(),
      userId,
      token,
      sessionExpires,
      now
    );

    const userRow = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as unknown as UserRow;

    return {
      user: this.toDTO(userRow),
      token,
      verificationCode,
    };
  }

  async login(
    identifier: string,
    password: string,
    clientIp = 'default'
  ): Promise<{ user: UserProfileDTO; token: string }> {
    const db = getDb();
    const cleanId = identifier.trim().toLowerCase();
    const rateLimitKey = `login:${cleanId || clientIp}`;

    this.checkRateLimit(rateLimitKey, 5, 15 * 60 * 1000);

    const userRow = db.prepare(`
      SELECT * FROM users 
      WHERE username = ? OR email = ? OR phone = ?
    `).get(cleanId, cleanId, cleanId) as unknown as UserRow | undefined;

    if (!userRow) {
      throw new UnauthorizedError('Invalid username, email, phone, or password.');
    }

    const isValid = verifySecret(password, userRow.password_hash, userRow.salt);
    if (!isValid) {
      throw new UnauthorizedError('Invalid username, email, phone, or password.');
    }

    // Reset rate limit on successful credentials
    this.resetRateLimit(rateLimitKey);

    const token = generateToken();
    const now = new Date().toISOString();
    const sessionExpires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    db.prepare('INSERT INTO auth_sessions (id, user_id, token, expires_at, created_at) VALUES (?, ?, ?, ?, ?)').run(
      crypto.randomUUID(),
      userRow.id,
      token,
      sessionExpires,
      now
    );

    return {
      user: this.toDTO(userRow),
      token,
    };
  }

  /**
   * Request password recovery.
   * CRITICAL: Does NOT reveal whether an account exists.
   */
  async requestPasswordRecovery(
    contact: string,
    clientIp = 'default'
  ): Promise<{ success: boolean; message: string; previewCode?: string }> {
    const db = getDb();
    const cleanContact = contact.trim().toLowerCase();
    const rateLimitKey = `recovery:${cleanContact || clientIp}`;

    this.checkRateLimit(rateLimitKey, 5, 15 * 60 * 1000);

    const userRow = db.prepare(`
      SELECT * FROM users 
      WHERE email = ? OR phone = ? OR username = ?
    `).get(cleanContact, contact.trim(), cleanContact) as unknown as UserRow | undefined;

    let previewCode: string | undefined;

    if (userRow) {
      const recoveryCode = generateNumericCode(6);
      previewCode = recoveryCode;
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 mins expiry

      db.prepare(`
        UPDATE users 
        SET recovery_code = ?, recovery_expires_at = ?, updated_at = ? 
        WHERE id = ?
      `).run(recoveryCode, expiresAt, new Date().toISOString(), userRow.id);
    }

    return {
      success: true,
      message: 'If an account matches that email or phone, a recovery code has been sent.',
      previewCode: process.env.NODE_ENV !== 'production' ? previewCode : undefined,
    };
  }

  async verifyPasswordRecovery(params: {
    contact: string;
    code: string;
    newPassword: string;
  }): Promise<{ success: boolean; message: string }> {
    const db = getDb();
    const cleanContact = params.contact.trim().toLowerCase();
    const cleanCode = params.code.trim();

    this.validateSecurePassword(params.newPassword);

    const userRow = db.prepare(`
      SELECT * FROM users 
      WHERE (email = ? OR phone = ? OR username = ?) AND recovery_code = ?
    `).get(cleanContact, params.contact.trim(), cleanContact, cleanCode) as unknown as UserRow | undefined;

    if (!userRow || !userRow.recovery_expires_at) {
      throw new ValidationError('code', 'Invalid or expired recovery code.');
    }

    if (new Date(userRow.recovery_expires_at) < new Date()) {
      throw new ValidationError('code', 'Recovery code has expired. Please request a new one.');
    }

    const { hash, salt } = hashSecret(params.newPassword);
    db.prepare(`
      UPDATE users 
      SET password_hash = ?, salt = ?, recovery_code = NULL, recovery_expires_at = NULL, updated_at = ?
      WHERE id = ?
    `).run(hash, salt, new Date().toISOString(), userRow.id);

    // Reset rate limiting lockout for recovered user
    this.resetRateLimit(`login:${cleanContact.toLowerCase()}`);
    this.resetRateLimit(`login:${userRow.username.toLowerCase()}`);
    if (userRow.email) this.resetRateLimit(`login:${userRow.email.toLowerCase()}`);
    if (userRow.phone) this.resetRateLimit(`login:${userRow.phone.toLowerCase()}`);

    return {
      success: true,
      message: 'Password reset successfully. You can now log in with your new password.',
    };
  }

  async setPin(userId: string, pin: string): Promise<UserProfileDTO> {
    const db = getDb();
    const cleanPin = pin.trim();

    if (!/^\d{4}$/.test(cleanPin)) {
      throw new ValidationError('pin', 'Device app-lock PIN must be exactly 4 numeric digits.');
    }

    const { hash, salt } = hashSecret(cleanPin);
    const now = new Date().toISOString();

    db.prepare(`
      UPDATE users 
      SET pin_hash = ?, pin_salt = ?, pin_enabled = 1, updated_at = ? 
      WHERE id = ?
    `).run(hash, salt, now, userId);

    const userRow = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as unknown as UserRow;
    return this.toDTO(userRow);
  }

  async removePin(userId: string): Promise<UserProfileDTO> {
    const db = getDb();
    const now = new Date().toISOString();

    db.prepare(`
      UPDATE users 
      SET pin_hash = NULL, pin_salt = NULL, pin_enabled = 0, updated_at = ? 
      WHERE id = ?
    `).run(now, userId);

    const userRow = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as unknown as UserRow;
    return this.toDTO(userRow);
  }

  async verifyPin(userId: string, pin: string): Promise<boolean> {
    const db = getDb();
    const cleanPin = pin.trim();

    const userRow = db.prepare('SELECT pin_hash, pin_salt, pin_enabled FROM users WHERE id = ?').get(userId) as
      | { pin_hash: string | null; pin_salt: string | null; pin_enabled: number }
      | undefined;

    if (!userRow || !userRow.pin_enabled || !userRow.pin_hash || !userRow.pin_salt) {
      return false;
    }

    return verifySecret(cleanPin, userRow.pin_hash, userRow.pin_salt);
  }

  async authenticateByToken(token: string): Promise<UserProfileDTO | null> {
    const db = getDb();
    const session = db.prepare(`
      SELECT u.* 
      FROM auth_sessions s 
      JOIN users u ON s.user_id = u.id 
      WHERE s.token = ? AND s.expires_at > ?
    `).get(token, new Date().toISOString()) as unknown as UserRow | undefined;

    if (!session) return null;
    return this.toDTO(session);
  }

  async googleAuth(profile: {
    googleId: string;
    email: string;
    name?: string;
  }): Promise<{ user: UserProfileDTO; token: string }> {
    const db = getDb();
    const email = profile.email.toLowerCase().trim();
    const baseUsername = (profile.name?.replace(/[^a-zA-Z0-9]/g, '') || email.split('@')[0]).toLowerCase();

    let userRow = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as unknown as UserRow | undefined;

    const now = new Date().toISOString();

    if (!userRow) {
      // Find unique username
      let username = baseUsername;
      let counter = 1;
      while (db.prepare('SELECT id FROM users WHERE username = ?').get(username)) {
        username = `${baseUsername}${counter++}`;
      }

      const userId = crypto.randomUUID();
      const randomSecret = crypto.randomBytes(32).toString('hex');
      const { hash, salt } = hashSecret(randomSecret);

      db.prepare(`
        INSERT INTO users (
          id, username, email, password_hash, salt,
          pin_enabled, email_verified, phone_verified, provider, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, 0, 1, 0, 'google', ?, ?)
      `).run(userId, username, email, hash, salt, now, now);

      userRow = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as unknown as UserRow;
    }

    const token = generateToken();
    const sessionExpires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    db.prepare('INSERT INTO auth_sessions (id, user_id, token, expires_at, created_at) VALUES (?, ?, ?, ?, ?)').run(
      crypto.randomUUID(),
      userRow.id,
      token,
      sessionExpires,
      now
    );

    return {
      user: this.toDTO(userRow),
      token,
    };
  }
}

export const authService = new AuthService();
