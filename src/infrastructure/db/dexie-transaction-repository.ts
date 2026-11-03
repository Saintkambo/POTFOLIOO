import { TransactionRepositoryPort, TransactionFilter } from '../../application/ports/transaction-repository';
import { Transaction } from '../../domain/models/transaction';
import { db } from './database';
import { StorageError } from '../../domain/errors';
import { getMonthBounds } from '../../domain/date';

export class DexieTransactionRepository implements TransactionRepositoryPort {
  async create(txn: Transaction): Promise<void> {
    try {
      await db.transactions.add(txn);
    } catch (err) {
      throw new StorageError('Failed to record transaction', err);
    }
  }

  async update(txn: Transaction): Promise<void> {
    try {
      await db.transactions.put(txn);
    } catch (err) {
      throw new StorageError('Failed to update transaction', err);
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await db.transactions.delete(id);
    } catch (err) {
      throw new StorageError('Failed to delete transaction', err);
    }
  }

  async getById(id: string): Promise<Transaction | null> {
    try {
      const txn = await db.transactions.get(id);
      return txn || null;
    } catch (err) {
      throw new StorageError('Failed to fetch transaction', err);
    }
  }

  async list(filter: TransactionFilter): Promise<Transaction[]> {
    try {
      let query = db.transactions.where('bookId').equals(filter.bookId);

      // Fetch all for this book, then filter and sort
      let items = await query.toArray();

      if (filter.month) {
        const { start, end } = getMonthBounds(filter.month);
        items = items.filter(t => t.transactionDate >= start && t.transactionDate <= end);
      }

      if (filter.type) {
        items = items.filter(t => t.type === filter.type);
      }

      if (filter.searchQuery && filter.searchQuery.trim()) {
        const q = filter.searchQuery.trim().toLowerCase();
        items = items.filter(t => 
          (t.note && t.note.toLowerCase().includes(q)) ||
          (t.category && t.category.toLowerCase().includes(q))
        );
      }

      // Stable sort: Newest date first, then newest createdAt
      return items.sort((a, b) => {
        const dateComp = b.transactionDate.localeCompare(a.transactionDate);
        if (dateComp !== 0) return dateComp;
        return b.createdAt.localeCompare(a.createdAt);
      });
    } catch (err) {
      throw new StorageError('Failed to list transactions', err);
    }
  }

  async listByMonth(bookId: string, month: string): Promise<Transaction[]> {
    return this.list({ bookId, month });
  }

  async listAllByBook(bookId: string): Promise<Transaction[]> {
    return this.list({ bookId });
  }

  async countByBook(bookId: string): Promise<number> {
    try {
      return await db.transactions.where('bookId').equals(bookId).count();
    } catch (err) {
      throw new StorageError('Failed to count transactions', err);
    }
  }

  async replaceAll(bookId: string, transactions: Transaction[]): Promise<void> {
    try {
      await db.transaction('rw', db.transactions, async () => {
        // Delete all existing transactions for this book
        await db.transactions.where('bookId').equals(bookId).delete();
        // Insert all new transactions in a single atomic batch
        await db.transactions.bulkAdd(transactions);
      });
    } catch (err) {
      throw new StorageError('Failed to restore transactions atomically', err);
    }
  }
}
