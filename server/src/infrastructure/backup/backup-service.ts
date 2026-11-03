import { getDb } from '../db/connection.js';
import { SqliteBookRepository } from '../repositories/sqlite-book-repository.js';
import { SqliteTransactionRepository } from '../repositories/sqlite-transaction-repository.js';
import { BackupEnvelope, RestoreResult } from '../../domain/models/backup.js';
import { DatabaseError } from '../../domain/errors.js';

export class BackupService {
  constructor(
    private bookRepo = new SqliteBookRepository(),
    private txRepo = new SqliteTransactionRepository()
  ) {}

  exportBackup(bookId: string): BackupEnvelope {
    const book = this.bookRepo.findById(bookId);
    if (!book) {
      throw new DatabaseError(`Book with ID ${bookId} not found`);
    }

    const transactions = this.txRepo.listByBook(bookId);

    return {
      format: 'potfolioo-backup',
      formatVersion: 2,
      exportedAt: new Date().toISOString(),
      book: {
        id: book.id,
        name: book.name,
        category: book.category,
        currencyCode: book.currencyCode,
        createdAt: book.createdAt,
        updatedAt: book.updatedAt,
        schemaVersion: book.schemaVersion,
      },
      transactions: transactions.map((t) => ({
        id: t.id,
        bookId: t.bookId,
        type: t.type,
        amountMinor: t.amountMinor,
        transactionDate: t.transactionDate,
        category: t.category,
        note: t.note,
        tenantName: t.tenantName,
        roomNumber: t.roomNumber,
        phoneNumber: t.phoneNumber,
        chargePerRoom: t.chargePerRoom,
        monthsPaid: t.monthsPaid,
        dueDate: t.dueDate,
      })),
    };
  }

  restoreBackup(backup: BackupEnvelope): RestoreResult {
    const db = getDb();
    const now = new Date().toISOString();

    db.exec('BEGIN IMMEDIATE TRANSACTION;');
    try {
      // 1. Upsert the book
      const existingBook = this.bookRepo.findById(backup.book.id);
      if (existingBook) {
        this.bookRepo.update({
          id: backup.book.id,
          name: backup.book.name,
          category: backup.book.category || 'other',
          currencyCode: backup.book.currencyCode,
          createdAt: existingBook.createdAt,
          updatedAt: now,
          schemaVersion: 2,
        });
      } else {
        this.bookRepo.create({
          id: backup.book.id,
          name: backup.book.name,
          category: backup.book.category || 'other',
          currencyCode: backup.book.currencyCode,
          createdAt: now,
          updatedAt: now,
          schemaVersion: 2,
        });
      }

      // 2. Clear existing transactions for this book to avoid duplicates or orphaned entries
      db.prepare('DELETE FROM transactions WHERE book_id = ?').run(backup.book.id);

      // 3. Insert all transactions from backup
      const insertStmt = db.prepare(`
        INSERT INTO transactions (
          id, book_id, type, amount_minor, transaction_date, category, note,
          tenant_name, room_number, phone_number, charge_per_room, months_paid, due_date,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const tx of backup.transactions) {
        insertStmt.run(
          tx.id,
          backup.book.id,
          tx.type,
          tx.amountMinor,
          tx.transactionDate,
          tx.category ?? null,
          tx.note ?? null,
          tx.tenantName ?? null,
          tx.roomNumber ?? null,
          tx.phoneNumber ?? null,
          tx.chargePerRoom ?? null,
          tx.monthsPaid ?? null,
          tx.dueDate ?? null,
          now,
          now
        );
      }

      db.exec('COMMIT;');

      return {
        restoredBookId: backup.book.id,
        bookName: backup.book.name,
        currencyCode: backup.book.currencyCode,
        restoredTransactionCount: backup.transactions.length,
        restoredAt: now,
      };
    } catch (err) {
      db.exec('ROLLBACK;');
      throw new DatabaseError(
        `Failed to restore backup: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }
}
