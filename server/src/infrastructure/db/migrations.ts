import { DatabaseSync } from 'node:sqlite';
import { getDb } from './connection.js';

interface Migration {
  version: number;
  name: string;
  up: (db: DatabaseSync) => void;
}

const migrations: Migration[] = [
  {
    version: 1,
    name: 'initial_schema',
    up: (db) => {
      // Books table
      db.exec(`
        CREATE TABLE IF NOT EXISTS books (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          currency_code TEXT NOT NULL,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          schema_version INTEGER NOT NULL DEFAULT 1
        );
      `);

      // Transactions table
      db.exec(`
        CREATE TABLE IF NOT EXISTS transactions (
          id TEXT PRIMARY KEY,
          book_id TEXT NOT NULL,
          type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
          amount_minor INTEGER NOT NULL CHECK(amount_minor > 0),
          transaction_date TEXT NOT NULL CHECK(length(transaction_date) = 10),
          category TEXT,
          note TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
        );
      `);

      // Performance and range query indexes
      db.exec(`
        CREATE INDEX IF NOT EXISTS idx_transactions_book_date 
        ON transactions(book_id, transaction_date);

        CREATE INDEX IF NOT EXISTS idx_transactions_book_type 
        ON transactions(book_id, type);

        CREATE INDEX IF NOT EXISTS idx_transactions_book_category 
        ON transactions(book_id, category);
      `);
    },
  },
  {
    version: 2,
    name: 'rental_and_business_categories',
    up: (db) => {
      // Add category column to books
      try {
        db.exec(`ALTER TABLE books ADD COLUMN category TEXT NOT NULL DEFAULT 'other';`);
      } catch {
        // Column may already exist
      }

      // Add rental specific fields to transactions
      try {
        db.exec(`ALTER TABLE transactions ADD COLUMN tenant_name TEXT;`);
        db.exec(`ALTER TABLE transactions ADD COLUMN room_number TEXT;`);
        db.exec(`ALTER TABLE transactions ADD COLUMN phone_number TEXT;`);
        db.exec(`ALTER TABLE transactions ADD COLUMN charge_per_room INTEGER;`);
        db.exec(`ALTER TABLE transactions ADD COLUMN months_paid REAL;`);
        db.exec(`ALTER TABLE transactions ADD COLUMN due_date TEXT;`);
      } catch {
        // Columns may already exist
      }

      db.exec(`CREATE INDEX IF NOT EXISTS idx_transactions_due_date ON transactions(due_date);`);
    },
  },
  {
    version: 3,
    name: 'retail_inventory_and_sales',
    up: (db) => {
      // Add retail specific fields to transactions
      try {
        db.exec(`ALTER TABLE transactions ADD COLUMN item_id TEXT;`);
        db.exec(`ALTER TABLE transactions ADD COLUMN item_name TEXT;`);
        db.exec(`ALTER TABLE transactions ADD COLUMN quantity_sold REAL;`);
        db.exec(`ALTER TABLE transactions ADD COLUMN unit_price_minor INTEGER;`);
        db.exec(`ALTER TABLE transactions ADD COLUMN unit_cost_minor INTEGER;`);
        db.exec(`ALTER TABLE transactions ADD COLUMN cogs_minor INTEGER;`);
      } catch {
        // Columns may already exist
      }

      // Create inventory items table
      db.exec(`
        CREATE TABLE IF NOT EXISTS inventory_items (
          id TEXT PRIMARY KEY,
          book_id TEXT NOT NULL,
          name TEXT NOT NULL,
          current_quantity REAL NOT NULL DEFAULT 0,
          avg_purchase_price_minor INTEGER NOT NULL DEFAULT 0,
          status TEXT NOT NULL DEFAULT 'empty',
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
        );
      `);

      db.exec(`CREATE INDEX IF NOT EXISTS idx_inventory_items_book_id ON inventory_items(book_id);`);
      db.exec(`CREATE INDEX IF NOT EXISTS idx_transactions_item_id ON transactions(item_id);`);
    },
  },
  {
    version: 4,
    name: 'user_profiles_and_auth',
    up: (db) => {
      // 1. Users table
      db.exec(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          username TEXT NOT NULL UNIQUE,
          email TEXT UNIQUE,
          phone TEXT UNIQUE,
          password_hash TEXT NOT NULL,
          salt TEXT NOT NULL,
          pin_hash TEXT,
          pin_salt TEXT,
          pin_enabled INTEGER NOT NULL DEFAULT 0,
          email_verified INTEGER NOT NULL DEFAULT 0,
          phone_verified INTEGER NOT NULL DEFAULT 0,
          provider TEXT NOT NULL DEFAULT 'local',
          verification_code TEXT,
          verification_expires_at TEXT,
          recovery_code TEXT,
          recovery_expires_at TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );
      `);

      // 2. Auth sessions table
      db.exec(`
        CREATE TABLE IF NOT EXISTS auth_sessions (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          token TEXT NOT NULL UNIQUE,
          expires_at TEXT NOT NULL,
          created_at TEXT NOT NULL,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
      `);

      // 3. Rate limits table
      db.exec(`
        CREATE TABLE IF NOT EXISTS rate_limits (
          key TEXT PRIMARY KEY,
          attempts INTEGER NOT NULL DEFAULT 1,
          reset_at TEXT NOT NULL
        );
      `);

      // 4. Link books to users
      try {
        db.exec(`ALTER TABLE books ADD COLUMN user_id TEXT;`);
      } catch {
        // Column may already exist
      }

      db.exec(`CREATE INDEX IF NOT EXISTS idx_books_user_id ON books(user_id);`);
      db.exec(`CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);`);
      db.exec(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);`);
      db.exec(`CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);`);
      db.exec(`CREATE INDEX IF NOT EXISTS idx_auth_sessions_token ON auth_sessions(token);`);
    },
  },
  {
    version: 5,
    name: 'businesses_and_memberships',
    up: (db) => {
      // 1. Businesses table
      db.exec(`
        CREATE TABLE IF NOT EXISTS businesses (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          type TEXT NOT NULL DEFAULT 'retail',
          category TEXT NOT NULL DEFAULT 'retail',
          currency_code TEXT NOT NULL DEFAULT 'TZS',
          location TEXT,
          address TEXT,
          financial_year_start TEXT NOT NULL DEFAULT '01-01',
          accounting_preferences TEXT NOT NULL DEFAULT '{}',
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );
      `);

      // 2. Business members table
      db.exec(`
        CREATE TABLE IF NOT EXISTS business_members (
          id TEXT PRIMARY KEY,
          business_id TEXT NOT NULL,
          user_id TEXT NOT NULL,
          role TEXT NOT NULL DEFAULT 'owner',
          permissions TEXT NOT NULL DEFAULT '["all"]',
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          UNIQUE(business_id, user_id)
        );
      `);

      // 3. Add business_id to books
      try {
        db.exec(`ALTER TABLE books ADD COLUMN business_id TEXT REFERENCES businesses(id) ON DELETE CASCADE;`);
      } catch {}

      // 4. Add business_id to transactions
      try {
        db.exec(`ALTER TABLE transactions ADD COLUMN business_id TEXT REFERENCES businesses(id) ON DELETE CASCADE;`);
      } catch {}

      // 5. Add business_id to inventory_items
      try {
        db.exec(`ALTER TABLE inventory_items ADD COLUMN business_id TEXT REFERENCES businesses(id) ON DELETE CASCADE;`);
      } catch {}

      db.exec(`CREATE INDEX IF NOT EXISTS idx_business_members_user ON business_members(user_id);`);
      db.exec(`CREATE INDEX IF NOT EXISTS idx_business_members_business ON business_members(business_id);`);
      db.exec(`CREATE INDEX IF NOT EXISTS idx_books_business ON books(business_id);`);
    },
  },
];

export function runMigrations(): void {
  const db = getDb();

  // Create migrations tracker table
  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      version INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at TEXT NOT NULL
    );
  `);

  const appliedRows = db.prepare('SELECT version FROM _migrations ORDER BY version ASC').all() as unknown as Array<{ version: number }>;
  const appliedVersions = new Set(appliedRows.map((r) => r.version));

  for (const migration of migrations) {
    if (!appliedVersions.has(migration.version)) {
      console.log(`[Database] Applying migration v${migration.version}: ${migration.name}...`);
      
      // Execute migration inside an immediate transaction
      db.exec('BEGIN IMMEDIATE TRANSACTION;');
      try {
        migration.up(db);
        const stmt = db.prepare('INSERT INTO _migrations (version, name, applied_at) VALUES (?, ?, ?)');
        stmt.run(migration.version, migration.name, new Date().toISOString());
        db.exec('COMMIT;');
        console.log(`[Database] Migration v${migration.version} successfully applied.`);
      } catch (err) {
        db.exec('ROLLBACK;');
        console.error(`[Database] Migration v${migration.version} failed:`, err);
        throw err;
      }
    }
  }
}
