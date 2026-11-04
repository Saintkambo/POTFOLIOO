import crypto from 'node:crypto';
import { SqliteTransactionRepository } from '../../infrastructure/repositories/sqlite-transaction-repository.js';
import { SqliteBookRepository } from '../../infrastructure/repositories/sqlite-book-repository.js';
import { Transaction, TransactionType } from '../../domain/models/transaction.js';
import { NotFoundError, ForbiddenError } from '../../domain/errors.js';

export class TransactionService {
  constructor(
    private txRepo = new SqliteTransactionRepository(),
    private bookRepo = new SqliteBookRepository()
  ) {}

  getTransaction(id: string, userId?: string): Transaction {
    const tx = this.txRepo.findById(id);
    if (!tx) {
      throw new NotFoundError('Transaction', id);
    }
    if (userId) {
      const book = this.bookRepo.findById(tx.bookId);
      if (book && book.userId && book.userId !== userId) {
        throw new ForbiddenError('You do not have permission to access this transaction.');
      }
    }
    return tx;
  }

  listTransactions(
    bookId: string,
    filters?: {
      startDate?: string;
      endDate?: string;
      type?: TransactionType;
      category?: string;
      limit?: number;
      offset?: number;
    },
    userId?: string
  ): Transaction[] {
    const book = this.bookRepo.findById(bookId);
    if (!book) {
      throw new NotFoundError('Book', bookId);
    }
    if (userId && book.userId && book.userId !== userId) {
      throw new ForbiddenError('You do not have permission to access this book.');
    }
    return this.txRepo.listByBook(bookId, filters);
  }

  createTransaction(
    data: {
      id?: string;
      bookId: string;
      type: TransactionType;
      amountMinor: number;
      transactionDate: string;
      category?: string | null;
      note?: string | null;
      tenantName?: string | null;
      roomNumber?: string | null;
      phoneNumber?: string | null;
      chargePerRoom?: number | null;
      monthsPaid?: number | null;
      dueDate?: string | null;
    },
    userId?: string
  ): Transaction {
    const book = this.bookRepo.findById(data.bookId);
    if (!book) {
      throw new NotFoundError('Book', data.bookId);
    }
    if (userId && book.userId && book.userId !== userId) {
      throw new ForbiddenError('You do not have permission to record transactions in this book.');
    }

    const now = new Date().toISOString();
    const tx: Transaction = {
      id: data.id || crypto.randomUUID(),
      bookId: data.bookId,
      type: data.type,
      amountMinor: data.amountMinor,
      transactionDate: data.transactionDate,
      category: data.category?.trim() || null,
      note: data.note?.trim() || null,
      tenantName: data.tenantName?.trim() || null,
      roomNumber: data.roomNumber?.trim() || null,
      phoneNumber: data.phoneNumber?.trim() || null,
      chargePerRoom: data.chargePerRoom ?? null,
      monthsPaid: data.monthsPaid ?? null,
      dueDate: data.dueDate?.trim() || null,
      createdAt: now,
      updatedAt: now,
    };

    this.txRepo.create(tx);
    return tx;
  }

  updateTransaction(
    id: string,
    data: {
      type?: TransactionType;
      amountMinor?: number;
      transactionDate?: string;
      category?: string | null;
      note?: string | null;
      tenantName?: string | null;
      roomNumber?: string | null;
      phoneNumber?: string | null;
      chargePerRoom?: number | null;
      monthsPaid?: number | null;
      dueDate?: string | null;
    },
    userId?: string
  ): Transaction {
    const existing = this.getTransaction(id, userId);

    const updated: Transaction = {
      ...existing,
      type: data.type ?? existing.type,
      amountMinor: data.amountMinor ?? existing.amountMinor,
      transactionDate: data.transactionDate ?? existing.transactionDate,
      category: data.category !== undefined ? (data.category?.trim() || null) : existing.category,
      note: data.note !== undefined ? (data.note?.trim() || null) : existing.note,
      tenantName: data.tenantName !== undefined ? (data.tenantName?.trim() || null) : existing.tenantName,
      roomNumber: data.roomNumber !== undefined ? (data.roomNumber?.trim() || null) : existing.roomNumber,
      phoneNumber: data.phoneNumber !== undefined ? (data.phoneNumber?.trim() || null) : existing.phoneNumber,
      chargePerRoom: data.chargePerRoom !== undefined ? data.chargePerRoom : existing.chargePerRoom,
      monthsPaid: data.monthsPaid !== undefined ? data.monthsPaid : existing.monthsPaid,
      dueDate: data.dueDate !== undefined ? (data.dueDate?.trim() || null) : existing.dueDate,
      updatedAt: new Date().toISOString(),
    };

    this.txRepo.update(updated);
    return updated;
  }

  deleteTransaction(id: string, bookId?: string, userId?: string): void {
    const existing = this.getTransaction(id, userId);
    const deleted = this.txRepo.delete(id, bookId || existing.bookId);
    if (!deleted) {
      throw new NotFoundError('Transaction', id);
    }
  }
}
