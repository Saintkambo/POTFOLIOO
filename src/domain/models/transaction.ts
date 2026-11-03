import { ValidationError } from '../errors';
import { validateDateString } from '../date';

export type TransactionType = 'income' | 'expense';
export type PaymentStatus = 'paid' | 'partial' | 'credit';
export type PaymentMethod = 'cash' | 'bank' | 'mobile';

export interface DebtRepayment {
  id: string;
  amountMinor: number;
  paymentMethod: PaymentMethod;
  repaymentDate: string;
  note?: string;
  createdAt: string;
}

export interface Transaction {
  id: string;
  bookId: string;
  businessId?: string;
  type: TransactionType;
  amountMinor: number;
  transactionDate: string; // YYYY-MM-DD
  category: string | null;
  note: string | null;
  createdAt: string;
  updatedAt: string;

  // Rental specific fields (optional, populated for rental businesses)
  tenantName?: string | null;
  roomNumber?: string | null;
  phoneNumber?: string | null;
  chargePerRoom?: number | null; // Minor units
  monthsPaid?: number | null; // e.g. 1.0, 2.5
  dueDate?: string | null; // YYYY-MM-DD

  // Retail / Wholesale specific fields (optional, populated for sales transactions)
  itemId?: string | null;
  itemName?: string | null;
  quantitySold?: number | null;
  unitPriceMinor?: number | null; // Unit selling price in minor units
  unitCostMinor?: number | null; // Weighted average purchase cost per unit in minor units
  cogsMinor?: number | null; // Total Cost of Goods Sold = quantitySold * unitCostMinor

  // Retail Debtors & Payment Tracking
  customerName?: string | null;
  paymentStatus?: PaymentStatus | null;
  paymentMethod?: PaymentMethod | null;
  amountPaidMinor?: number | null;
  outstandingBalanceMinor?: number | null;
  repayments?: DebtRepayment[] | null;
}

export function validateTransaction(txn: Partial<Transaction>): asserts txn is Transaction {
  if (!txn.id || typeof txn.id !== 'string') {
    throw new ValidationError('id', 'Transaction ID is required');
  }

  if (!txn.bookId || typeof txn.bookId !== 'string') {
    throw new ValidationError('bookId', 'Associated Book ID is required');
  }

  if (txn.type !== 'income' && txn.type !== 'expense') {
    throw new ValidationError('type', "Transaction type must be 'income' or 'expense'");
  }

  if (typeof txn.amountMinor !== 'number' || !Number.isInteger(txn.amountMinor) || txn.amountMinor <= 0) {
    throw new ValidationError('amountMinor', 'Amount must be a positive integer in minor units');
  }

  if (!txn.transactionDate) {
    throw new ValidationError('transactionDate', 'Transaction date is required');
  }
  validateDateString(txn.transactionDate);

  if (txn.dueDate) {
    validateDateString(txn.dueDate);
  }

  if (txn.category && txn.category.length > 50) {
    throw new ValidationError('category', 'Category name cannot exceed 50 characters');
  }

  if (txn.note && txn.note.length > 250) {
    throw new ValidationError('note', 'Note cannot exceed 250 characters');
  }

  if (txn.tenantName && txn.tenantName.length > 100) {
    throw new ValidationError('tenantName', 'Tenant name cannot exceed 100 characters');
  }

  if (txn.roomNumber && txn.roomNumber.length > 50) {
    throw new ValidationError('roomNumber', 'Room number cannot exceed 50 characters');
  }

  if (!txn.createdAt || !txn.updatedAt) {
    throw new ValidationError('timestamps', 'Timestamps are required');
  }
}
