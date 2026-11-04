import { Request, Response, NextFunction } from 'express';
import crypto from 'node:crypto';
import { env } from '../../config/env.js';
import { UnauthorizedError } from '../../domain/errors.js';
import { authService } from '../../application/services/auth-service.js';

export async function requireAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Missing or invalid Authorization header. Please log in.'));
  }
  const token = authHeader.substring(7).trim();
  const user = await authService.authenticateByToken(token);
  if (!user) {
    return next(new UnauthorizedError('Invalid or expired session token. Please log in again.'));
  }
  (req as any).user = user;
  next();
}

export function requireApiKey(req: Request, _res: Response, next: NextFunction): void {
  // Allow bypassing auth in dev if header is not supplied, or strictly require when present
  const apiKey = (req.headers['x-api-key'] as string) || req.headers.authorization?.replace(/^Bearer\s+/i, '');

  if (!apiKey) {
    if (env.isProduction) {
      return next(new UnauthorizedError('Missing required x-api-key or Bearer token header.'));
    }
    // In dev, if no key is provided, log warning but allow request
    return next();
  }

  // Timing-safe comparison to prevent timing attacks
  const expectedKeyBuffer = Buffer.from(env.API_SECRET_KEY);
  const suppliedKeyBuffer = Buffer.from(apiKey);

  if (
    expectedKeyBuffer.length !== suppliedKeyBuffer.length ||
    !crypto.timingSafeEqual(expectedKeyBuffer, suppliedKeyBuffer)
  ) {
    return next(new UnauthorizedError('Invalid API secret key.'));
  }

  next();
}
