import { Request, Response, NextFunction } from 'express';
import crypto from 'node:crypto';
import { env } from '../../config/env.js';
import { UnauthorizedError } from '../../domain/errors.js';

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
