import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { env } from '../../config/env.js';

let dbInstance: DatabaseSync | null = null;

export function getDb(): DatabaseSync {
  if (dbInstance) {
    return dbInstance;
  }

  const dbPath = path.resolve(process.cwd(), env.DATABASE_PATH);
  const dbDir = path.dirname(dbPath);

  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  dbInstance = new DatabaseSync(dbPath);

  // Enable WAL mode for high concurrency read/write performance
  dbInstance.exec('PRAGMA journal_mode = WAL;');
  // Enforce foreign key constraints
  dbInstance.exec('PRAGMA foreign_keys = ON;');
  // Set synchronous to NORMAL for optimal write performance with WAL
  dbInstance.exec('PRAGMA synchronous = NORMAL;');

  return dbInstance;
}

export function closeDb(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}
