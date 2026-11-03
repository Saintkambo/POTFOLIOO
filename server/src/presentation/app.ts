import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { env } from '../config/env.js';
import { requestLogger } from './middlewares/logger.js';
import { errorHandler } from './middlewares/error-handler.js';
import { createBookRouter } from './routes/book-routes.js';
import { createTransactionRouter } from './routes/transaction-routes.js';
import { createSummaryRouter } from './routes/summary-routes.js';
import { createBackupRouter } from './routes/backup-routes.js';
import { createAuthRouter } from './routes/auth-routes.js';
import { NotFoundError } from '../domain/errors.js';

export function createApp(): express.Application {
  const app = express();

  // Security headers
  app.use(
    helmet({
      contentSecurityPolicy: env.isProduction ? undefined : false,
    })
  );

  // Cross-Origin Resource Sharing
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (e.g. mobile apps, curl, or same-origin)
        if (!origin || env.corsOrigins.includes('*') || env.corsOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error(`CORS origin '${origin}' not allowed.`));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
    })
  );

  // Request body parsing with safe limit for versioned JSON backups
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Request logger (privacy-preserving, no financial amounts or notes logged)
  app.use(requestLogger);

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'potfolioo-api',
      environment: env.NODE_ENV,
      timestamp: new Date().toISOString(),
    });
  });

  // Mount API Routers
  app.use('/api/auth', createAuthRouter());
  app.use('/api/books', createBookRouter());
  app.use('/api', createTransactionRouter());
  app.use('/api/books', createSummaryRouter());
  app.use('/api', createBackupRouter());

  // 404 Route Handler
  app.use((req, _res, next) => {
    next(new NotFoundError(`Endpoint ${req.method} ${req.path}`));
  });

  // Global Error Handler
  app.use(errorHandler);

  return app;
}
