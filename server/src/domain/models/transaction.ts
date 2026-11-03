export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  bookId: string;
  type: TransactionType;
  amountMinor: number; // Positive integer in currency minor units (e.g. cents)
  transactionDate: string; // Calendar date in format YYYY-MM-DD
  category: string | null;
  note: string | null;
  tenantName?: string | null;
  roomNumber?: string | null;
  phoneNumber?: string | null;
  chargePerRoom?: number | null;
  monthsPaid?: number | null;
  dueDate?: string | null;
  itemId?: string | null;
  itemName?: string | null;
  quantitySold?: number | null;
  unitPriceMinor?: number | null;
  unitCostMinor?: number | null;
  cogsMinor?: number | null;
  customerName?: string | null;
  paymentStatus?: 'paid' | 'partial' | 'credit' | null;
  paymentMethod?: 'cash' | 'bank' | 'mobile' | null;
  amountPaidMinor?: number | null;
  outstandingBalanceMinor?: number | null;
  repayments?: any[] | null;
  createdAt: string; // ISO 8601 UTC
  updatedAt: string; // ISO 8601 UTC
}
