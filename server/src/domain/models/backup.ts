import { BusinessCategory } from './book.js';

export interface BackupEnvelope {
  format: 'potfolioo-backup';
  formatVersion: 1 | 2;
  exportedAt: string;
  book: {
    id: string;
    name: string;
    currencyCode: string;
    category?: BusinessCategory;
    createdAt?: string;
    updatedAt?: string;
    schemaVersion?: number;
  };
  transactions: Array<{
    id: string;
    bookId?: string;
    type: 'income' | 'expense';
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
  }>;
}

export interface RestoreResult {
  restoredBookId: string;
  bookName: string;
  currencyCode: string;
  restoredTransactionCount: number;
  restoredAt: string;
}
