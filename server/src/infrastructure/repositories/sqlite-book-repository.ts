import { getDb } from '../db/connection.js';
import { Book, BusinessCategory } from '../../domain/models/book.js';

interface BookRow {
  id: string;
  name: string;
  currency_code: string;
  category?: string;
  user_id?: string;
  created_at: string;
  updated_at: string;
  schema_version: number;
}

function mapRowToBook(row: BookRow): Book {
  return {
    id: row.id,
    name: row.name,
    currencyCode: row.currency_code,
    category: (row.category as BusinessCategory) || 'other',
    userId: row.user_id || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    schemaVersion: row.schema_version,
  };
}

export class SqliteBookRepository {
  findById(id: string): Book | null {
    const db = getDb();
    const row = db.prepare('SELECT * FROM books WHERE id = ?').get(id) as unknown as BookRow | undefined;
    return row ? mapRowToBook(row) : null;
  }

  findFirst(): Book | null {
    const db = getDb();
    const row = db.prepare('SELECT * FROM books ORDER BY created_at ASC LIMIT 1').get() as unknown as BookRow | undefined;
    return row ? mapRowToBook(row) : null;
  }

  list(userId?: string): Book[] {
    const db = getDb();
    if (userId) {
      const rows = db.prepare('SELECT * FROM books WHERE user_id = ? ORDER BY created_at DESC').all(userId) as unknown as BookRow[];
      return rows.map(mapRowToBook);
    }
    const rows = db.prepare('SELECT * FROM books ORDER BY created_at DESC').all() as unknown as BookRow[];
    return rows.map(mapRowToBook);
  }

  findByUserId(userId: string): Book[] {
    const db = getDb();
    const rows = db.prepare('SELECT * FROM books WHERE user_id = ? ORDER BY created_at DESC').all(userId) as unknown as BookRow[];
    return rows.map(mapRowToBook);
  }

  create(book: Book): void {
    const db = getDb();
    const stmt = db.prepare(`
      INSERT INTO books (id, name, currency_code, category, user_id, created_at, updated_at, schema_version)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      book.id,
      book.name,
      book.currencyCode,
      book.category || 'other',
      book.userId || null,
      book.createdAt,
      book.updatedAt,
      book.schemaVersion
    );
  }

  update(book: Book): void {
    const db = getDb();
    const stmt = db.prepare(`
      UPDATE books
      SET name = ?, currency_code = ?, category = ?, user_id = ?, updated_at = ?, schema_version = ?
      WHERE id = ?
    `);
    stmt.run(
      book.name,
      book.currencyCode,
      book.category || 'other',
      book.userId || null,
      book.updatedAt,
      book.schemaVersion,
      book.id
    );
  }

  delete(id: string): boolean {
    const db = getDb();
    const stmt = db.prepare('DELETE FROM books WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }
}
