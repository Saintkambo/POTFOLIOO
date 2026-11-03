import { Book } from '../../domain/models/book';
import { BookRepositoryPort } from '../ports/book-repository';
import { TransactionRepositoryPort } from '../ports/transaction-repository';
import { BackupPort, BackupValidationResult } from '../ports/backup-port';
import { ValidationError, BackupCorruptError } from '../../domain/errors';
import { InventoryItem } from '../../domain/models/inventory';
import { generateExcelWorkbook } from '../../infrastructure/export/excel-export-service';
import { generateRetailPdfReport } from '../../infrastructure/export/pdf-export-service';

export async function exportBackup(
  bookRepo: BookRepositoryPort,
  txnRepo: TransactionRepositoryPort,
  backupPort: BackupPort
): Promise<{ filename: string; content: string }> {
  const book = await bookRepo.getActiveBook();
  if (!book) {
    throw new ValidationError('book', 'No active book to export');
  }

  const transactions = await txnRepo.listAllByBook(book.id);
  const content = backupPort.serializeBackup(book, transactions);
  const dateStr = new Date().toISOString().slice(0, 10);
  const filename = `${book.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_backup_${dateStr}.json`;

  return { filename, content };
}

export function validateBackup(
  backupPort: BackupPort,
  fileContent: string
): BackupValidationResult {
  return backupPort.validateBackupFile(fileContent);
}

export async function restoreBackup(
  bookRepo: BookRepositoryPort,
  txnRepo: TransactionRepositoryPort,
  backupPort: BackupPort,
  fileContent: string
): Promise<{ book: Book; transactionCount: number }> {
  const envelope = backupPort.deserializeBackup(fileContent);

  if (envelope.format !== 'potfolioo-backup') {
    throw new BackupCorruptError('Unrecognized backup format');
  }

  // Atomically replace book and transactions
  await bookRepo.saveBook(envelope.book);
  await txnRepo.replaceAll(envelope.book.id, envelope.transactions);

  return {
    book: envelope.book,
    transactionCount: envelope.transactions.length,
  };
}

export async function exportCSV(
  bookRepo: BookRepositoryPort,
  txnRepo: TransactionRepositoryPort,
  backupPort: BackupPort
): Promise<{ filename: string; content: string }> {
  const book = await bookRepo.getActiveBook();
  if (!book) {
    throw new ValidationError('book', 'No active book to export');
  }

  const transactions = await txnRepo.listAllByBook(book.id);
  const content = backupPort.generateCSV(book, transactions);
  const dateStr = new Date().toISOString().slice(0, 10);
  const filename = `${book.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_transactions_${dateStr}.csv`;

  return { filename, content };
}

export async function exportExcel(
  bookRepo: BookRepositoryPort,
  txnRepo: TransactionRepositoryPort,
  inventoryItems: InventoryItem[] = [],
  reportingPeriod?: string
): Promise<{ filename: string; content: Uint8Array }> {
  const book = await bookRepo.getActiveBook();
  if (!book) {
    throw new ValidationError('book', 'No active book to export');
  }

  const transactions = await txnRepo.listAllByBook(book.id);
  return generateExcelWorkbook(book, transactions, inventoryItems, reportingPeriod);
}

export async function exportPDF(
  bookRepo: BookRepositoryPort,
  txnRepo: TransactionRepositoryPort,
  inventoryItems: InventoryItem[] = [],
  reportingPeriod?: string
): Promise<{ filename: string; content: Uint8Array }> {
  const book = await bookRepo.getActiveBook();
  if (!book) {
    throw new ValidationError('book', 'No active book to export');
  }

  const transactions = await txnRepo.listAllByBook(book.id);
  return generateRetailPdfReport(book, transactions, inventoryItems, reportingPeriod);
}
