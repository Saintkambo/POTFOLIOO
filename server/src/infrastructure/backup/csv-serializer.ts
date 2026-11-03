import { Transaction } from '../../domain/models/transaction.js';
import { SUPPORTED_CURRENCIES } from '../../domain/models/book.js';

/**
 * Escapes CSV field according to RFC 4180 and protects against CSV formula injection.
 * If a cell begins with '=', '+', '-', '@', '\t', or '\r', an apostrophe is prepended.
 */
function escapeCsvField(val: string | null | undefined): string {
  if (val === null || val === undefined) {
    return '""';
  }

  let text = String(val).trim();

  // Neutralize spreadsheet formula injection characters
  if (/^[=+\-@\t\r]/.test(text)) {
    text = `'${text}`;
  }

  // Double up any quotes
  text = text.replace(/"/g, '""');

  return `"${text}"`;
}

export function serializeTransactionsToCsv(
  transactions: Transaction[],
  currencyCode: string
): string {
  const currency = SUPPORTED_CURRENCIES[currencyCode] || { fractionDigits: 2 };
  const divisor = Math.pow(10, currency.fractionDigits);

  const header = ['Date', 'Type', 'Amount', 'Currency', 'Category', 'Note'].join(',');

  const rows = transactions.map((t) => {
    const formattedAmount = (t.amountMinor / divisor).toFixed(currency.fractionDigits);
    return [
      escapeCsvField(t.transactionDate),
      escapeCsvField(t.type),
      escapeCsvField(formattedAmount),
      escapeCsvField(currencyCode),
      escapeCsvField(t.category || ''),
      escapeCsvField(t.note || ''),
    ].join(',');
  });

  return [header, ...rows].join('\r\n');
}
