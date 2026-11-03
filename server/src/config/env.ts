import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load environment variables from .env file at root or current directory
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const envSchema = z.object({
  PORT: z
    .string()
    .default('3001')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().positive().max(65535)),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_PATH: z.string().default('./data/potfolioo.db'),
  API_SECRET_KEY: z
    .string()
    .min(16, 'API_SECRET_KEY must be at least 16 characters long')
    .default('potfolioo_dev_secret_change_in_production_9f8d7c6b5a4'),
  CORS_ORIGIN: z.string().default('http://localhost:5173,http://localhost:4173'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_ANON_KEY: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid Server Environment Configuration:');
  console.error(parsed.error.format());
  process.exit(1);
}

export const env = {
  ...parsed.data,
  corsOrigins: parsed.data.CORS_ORIGIN.split(',').map((origin) => origin.trim()),
  isProduction: parsed.data.NODE_ENV === 'production',
  isDevelopment: parsed.data.NODE_ENV === 'development',
  isTest: parsed.data.NODE_ENV === 'test',
};
