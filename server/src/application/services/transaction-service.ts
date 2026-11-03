import crypto from 'node:crypto';
import { SqliteTransactionRepository } from '../../infrastructure/repositories/sqlite-transaction-repository.js';
import { SqliteBookRepository } from '../../infrastructure/repositories/sqlite-book-repository.js';
import { Transaction, TransactionType } from '../../domain/models/transaction.js';
import { NotFoundError } from '../../domain/errors.js';

export class TransactionService {
  constructor(
    private txRepo = new SqliteTransactionRepository(),
    private bookRepo = new SqliteBookRepository()
  ) {}

  getTransaction(id: string): Transaction {
    const tx = this.txRepo.findById(id);
    if (!tx) {
      throw new NotFoundError('Transaction', id);
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
    }
  ): Transaction[] {
    const book = this.bookRepo.findById(bookId);
    if (!book) {
      throw new NotFoundError('Book', bookId);
    }
    return this.txRepo.listByBook(bookId, filters);
  }

  createTransaction(data: {
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
  }): Transaction {
    const book = this.bookRepo.findById(data.bookId);
    if (!book) {
      throw new NotFoundError('Book', data.bookId);
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
    }
  ): Transaction {
    const existing = this.getTransaction(id);

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

  deleteTransaction(id: string, bookId?: string): void {
    const deleted = this.txRepo.delete(id, bookId);
    if (!deleted) {
      throw new NotFoundError('Transaction', id);
    }
  }
}
