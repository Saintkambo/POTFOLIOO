import { ValidationError } from '../errors';
import { SUPPORTED_CURRENCIES } from '../money';

export const CURRENT_SCHEMA_VERSION = 2;

export type BusinessCategory = 'rental' | 'retail' | 'other';

export interface Book {
  id: string;
  name: string;
  currencyCode: string;
  category: BusinessCategory;
  businessId?: string; // Link to business organization entity
  userId?: string; // Link business ledger to authenticated user profile
  createdAt: string;
  updatedAt: string;
  schemaVersion: number;
  lowStockThreshold?: number; // Customizable notification threshold for retail businesses (defaults to 10)
}

export function validateBook(book: Partial<Book>): asserts book is Book {
  if (!book.id || typeof book.id !== 'string') {
    throw new ValidationError('id', 'Book ID is required');
  }

  if (!book.name || typeof book.name !== 'string' || book.name.trim().length === 0) {
    throw new ValidationError('name', 'Book name cannot be empty');
  }

  if (book.name.trim().length > 50) {
    throw new ValidationError('name', 'Book name cannot exceed 50 characters');
  }

  if (book.currencyCode === 'USD') {
    book.currencyCode = 'TZS';
  }

  if (!book.currencyCode || !SUPPORTED_CURRENCIES[book.currencyCode]) {
    throw new ValidationError('currencyCode', `Unsupported currency: ${book.currencyCode}`);
  }

  if (book.category && book.category !== 'rental' && book.category !== 'retail' && book.category !== 'other') {
    throw new ValidationError('category', "Business category must be 'rental', 'retail', or 'other'");
  }

  if (!book.createdAt || !book.updatedAt) {
    throw new ValidationError('timestamps', 'Timestamps are required');
  }

  if (typeof book.schemaVersion !== 'number' || book.schemaVersion < 1) {
    throw new ValidationError('schemaVersion', 'Invalid schema version');
  }
}
