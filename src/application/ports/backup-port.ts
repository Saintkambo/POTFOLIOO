import { Book } from '../../domain/models/book';
import { Transaction } from '../../domain/models/transaction';

export interface BackupEnvelope {
  format: 'potfolioo-backup';
  formatVersion: number;
  exportedAt: string;
  book: Book;
  transactions: Transaction[];
}

export interface BackupValidationResult {
  isValid: boolean;
  error?: string;
  preview?: {
    bookName: string;
    currencyCode: string;
    exportedAt: string;
    transactionCount: number;
  };
}

export interface BackupPort {
  serializeBackup(book: Book, transactions: Transaction[]): string;
  validateBackupFile(fileContent: string): BackupValidationResult;
  deserializeBackup(fileContent: string): BackupEnvelope;
  generateCSV(book: Book, transactions: Transaction[]): string;
}
