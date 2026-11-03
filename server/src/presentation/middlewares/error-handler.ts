import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../domain/errors.js';
import { env } from '../../config/env.js';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.errorCode,
        message: err.message,
        details: err.details,
      },
    });
    return;
  }

  // Unhandled internal server error
  console.error('[Unhandled Server Error]', err);

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: env.isProduction
        ? 'An unexpected internal server error occurred.'
        : err.message,
      ...(env.isDevelopment ? { stack: err.stack } : {}),
    },
  });
}
