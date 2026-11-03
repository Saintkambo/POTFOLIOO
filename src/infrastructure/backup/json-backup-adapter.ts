import { BackupPort, BackupEnvelope, BackupValidationResult } from '../../application/ports/backup-port';
import { Book, validateBook, CURRENT_SCHEMA_VERSION } from '../../domain/models/book';
import { Transaction, validateTransaction } from '../../domain/models/transaction';
import { BackupCorruptError } from '../../domain/errors';
import { formatMoney } from '../../domain/money';

export class JsonBackupAdapter implements BackupPort {
  serializeBackup(book: Book, transactions: Transaction[]): string {
    const envelope: BackupEnvelope = {
      format: 'potfolioo-backup',
      formatVersion: CURRENT_SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      book,
      transactions,
    };
    return JSON.stringify(envelope, null, 2);
  }

  validateBackupFile(fileContent: string): BackupValidationResult {
    try {
      if (!fileContent || fileContent.trim().length === 0) {
        return { isValid: false, error: 'Backup file is empty' };
      }

      if (fileContent.length > 50 * 1024 * 1024) {
        return { isValid: false, error: 'Backup file exceeds 50MB safety limit' };
      }

      const parsed = JSON.parse(fileContent);

      if (parsed.format !== 'potfolioo-backup') {
        return { isValid: false, error: 'File is not a valid POTFOLIOO backup' };
      }

      if (typeof parsed.formatVersion !== 'number' || parsed.formatVersion > CURRENT_SCHEMA_VERSION) {
        return {
          isValid: false,
          error: `Unsupported backup version (v${parsed.formatVersion}). Current supported version is v${CURRENT_SCHEMA_VERSION}.`,
        };
      }

      if (!parsed.book || !Array.isArray(parsed.transactions)) {
        return { isValid: false, error: 'Backup missing required book or transactions records' };
      }

      // Default category if restoring from v1
      if (!parsed.book.category) {
        parsed.book.category = 'other';
      }

      validateBook(parsed.book);

      // Verify transactions
      const idSet = new Set<string>();
      for (const txn of parsed.transactions) {
        validateTransaction(txn);
        if (idSet.has(txn.id)) {
          return { isValid: false, error: `Duplicate transaction ID detected: ${txn.id}` };
        }
        idSet.add(txn.id);
      }

      return {
        isValid: true,
        preview: {
          bookName: parsed.book.name,
          currencyCode: parsed.book.currencyCode,
          exportedAt: parsed.exportedAt || 'Unknown date',
          transactionCount: parsed.transactions.length,
        },
      };
    } catch (err) {
      return {
        isValid: false,
        error: err instanceof Error ? err.message : 'Invalid JSON file structure',
      };
    }
  }

  deserializeBackup(fileContent: string): BackupEnvelope {
    const validation = this.validateBackupFile(fileContent);
    if (!validation.isValid) {
      throw new BackupCorruptError(validation.error || 'Corrupt backup file');
    }
    const parsed = JSON.parse(fileContent) as BackupEnvelope;
    if (!parsed.book.category) {
      parsed.book.category = 'other';
    }
    return parsed;
  }

  generateCSV(book: Book, transactions: Transaction[]): string {
    const headers = ['Date', 'Type', 'Amount', 'Currency', 'Category', 'Room', 'Tenant', 'Phone', 'MonthsPaid', 'DueDate', 'Note'];
    const rows = transactions.map((t) => {
      // Escape and neutralize spreadsheet formula injection (=, +, -, @)
      const sanitize = (val: string | number | null | undefined): string => {
        if (val === null || val === undefined) return '""';
        let clean = String(val).replace(/"/g, '""');
        if (/^[=+\-@\t\r]/.test(clean)) {
          clean = `'${clean}`;
        }
        return `"${clean}"`;
      };

      const currency = book.currencyCode && book.currencyCode !== 'USD' ? book.currencyCode : 'TZS';
      const formattedAmount = formatMoney(t.amountMinor, currency);
      return [
        t.transactionDate,
        t.type.toUpperCase(),
        formattedAmount,
        currency,
        sanitize(t.category),
        sanitize(t.roomNumber),
        sanitize(t.tenantName),
        sanitize(t.phoneNumber),
        sanitize(t.monthsPaid),
        sanitize(t.dueDate),
        sanitize(t.note),
      ].join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  }
}
