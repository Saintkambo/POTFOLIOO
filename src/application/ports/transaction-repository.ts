import { Transaction } from '../../domain/models/transaction';

export interface TransactionFilter {
  bookId: string;
  month?: string; // YYYY-MM
  type?: 'income' | 'expense';
  searchQuery?: string;
}

export interface TransactionRepositoryPort {
  create(txn: Transaction): Promise<void>;
  update(txn: Transaction): Promise<void>;
  delete(id: string): Promise<void>;
  getById(id: string): Promise<Transaction | null>;
  list(filter: TransactionFilter): Promise<Transaction[]>;
  listByMonth(bookId: string, month: string): Promise<Transaction[]>;
  listAllByBook(bookId: string): Promise<Transaction[]>;
  countByBook(bookId: string): Promise<number>;
  replaceAll(bookId: string, transactions: Transaction[]): Promise<void>;
}
