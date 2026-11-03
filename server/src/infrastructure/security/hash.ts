import crypto from 'node:crypto';

/**
 * Hash a secret (password or PIN) using PBKDF2 with SHA-512 and random salt.
 * Secrets are never stored in plain text.
 */
export function hashSecret(secret: string, customSalt?: string): { hash: string; salt: string } {
  const salt = customSalt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(secret, salt, 100000, 64, 'sha512').toString('hex');
  return { hash, salt };
}

/**
 * Verify a secret against stored hash and salt using timing-safe comparison
 * to eliminate timing attack vectors.
 */
export function verifySecret(secret: string, expectedHash: string, salt: string): boolean {
  if (!secret || !expectedHash || !salt) return false;
  try {
    const calculatedHash = crypto.pbkdf2Sync(secret, salt, 100000, 64, 'sha512').toString('hex');
    const expectedBuf = Buffer.from(expectedHash, 'hex');
    const calculatedBuf = Buffer.from(calculatedHash, 'hex');

    if (expectedBuf.length !== calculatedBuf.length) return false;
    return crypto.timingSafeEqual(expectedBuf, calculatedBuf);
  } catch {
    return false;
  }
}

/**
 * Generate a cryptographically secure 6-digit numeric verification or recovery code.
 */
export function generateNumericCode(length = 6): string {
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  const num = crypto.randomInt(min, max + 1);
  return String(num);
}

/**
 * Generate a secure random session token.
 */
export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}
