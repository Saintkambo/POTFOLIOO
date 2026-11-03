import { ValidationError } from './errors';

/**
 * Returns today's local date string formatted strictly as YYYY-MM-DD.
 */
export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns the current local month string formatted as YYYY-MM.
 */
export function getCurrentMonthString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Validates a YYYY-MM-DD date string.
 */
export function validateDateString(dateStr: string): void {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    throw new ValidationError('transactionDate', 'Date must be formatted as YYYY-MM-DD');
  }

  const [year, month, day] = dateStr.split('-').map(Number);
  const dateObj = new Date(year, month - 1, day);
  
  if (
    dateObj.getFullYear() !== year ||
    dateObj.getMonth() !== month - 1 ||
    dateObj.getDate() !== day
  ) {
    throw new ValidationError('transactionDate', 'Invalid calendar date');
  }
}

/**
 * Extracts the reporting month (YYYY-MM) from a YYYY-MM-DD string.
 */
export function getMonthFromDate(dateStr: string): string {
  validateDateString(dateStr);
  return dateStr.substring(0, 7);
}

/**
 * Returns start and end date bounds for a given month YYYY-MM.
 */
export function getMonthBounds(monthStr: string): { start: string; end: string } {
  if (!/^\d{4}-\d{2}$/.test(monthStr)) {
    throw new ValidationError('month', 'Month must be in YYYY-MM format');
  }
  const [year, month] = monthStr.split('-').map(Number);
  const lastDay = new Date(year, month, 0).getDate();
  const start = `${monthStr}-01`;
  const end = `${monthStr}-${String(lastDay).padStart(2, '0')}`;
  return { start, end };
}

/**
 * Adds or subtracts months from a given YYYY-MM month string.
 */
export function offsetMonth(monthStr: string, delta: number): string {
  const [year, month] = monthStr.split('-').map(Number);
  const d = new Date(year, month - 1 + delta, 1);
  const newYear = d.getFullYear();
  const newMonth = String(d.getMonth() + 1).padStart(2, '0');
  return `${newYear}-${newMonth}`;
}

/**
 * Formats YYYY-MM for human display, e.g. "November 2026".
 */
export function formatMonthName(monthStr: string): string {
  const [year, month] = monthStr.split('-').map(Number);
  const d = new Date(year, month - 1, 1);
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}
