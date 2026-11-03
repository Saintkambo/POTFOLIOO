import { createApp } from './presentation/app.js';
import { env } from './config/env.js';
import { runMigrations } from './infrastructure/db/migrations.js';
import { closeDb } from './infrastructure/db/connection.js';

async function bootstrap() {
  console.log(`[POTFOLIOO] Starting backend service in ${env.NODE_ENV} mode...`);

  // 1. Run database migrations
  try {
    runMigrations();
  } catch (err) {
    console.error('[POTFOLIOO] Fatal: Database migrations failed:', err);
    process.exit(1);
  }

  // 2. Initialize Express application
  const app = createApp();

  // 3. Start HTTP server
  const server = app.listen(env.PORT, () => {
    console.log(`[POTFOLIOO] Server successfully listening at http://localhost:${env.PORT}`);
    console.log(`[POTFOLIOO] Database path: ${env.DATABASE_PATH}`);
  });

  // 4. Graceful shutdown handler
  const shutdown = (signal: string) => {
    console.log(`[POTFOLIOO] Received ${signal}. Shutting down gracefully...`);
    server.close(() => {
      console.log('[POTFOLIOO] HTTP server closed.');
      closeDb();
      console.log('[POTFOLIOO] Database connection closed.');
      process.exit(0);
    });

    // Force exit if close takes too long
    setTimeout(() => {
      console.error('[POTFOLIOO] Forceful shutdown initiated after timeout.');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap().catch((err) => {
  console.error('[POTFOLIOO] Startup failure:', err);
  process.exit(1);
});
