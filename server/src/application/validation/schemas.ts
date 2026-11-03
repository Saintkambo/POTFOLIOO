import { z } from 'zod';
import { SUPPORTED_CURRENCIES } from '../../domain/models/book.js';

const validCurrencyCodes = Object.keys(SUPPORTED_CURRENCIES);

export const CreateBookSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1, 'Book name is required').max(100, 'Book name must not exceed 100 characters'),
  category: z.enum(['rental', 'other']).default('other'),
  currencyCode: z
    .string()
    .trim()
    .toUpperCase()
    .default('TZS')
    .refine((code) => validCurrencyCodes.includes(code), {
      message: `Invalid currency. Supported currency is: ${validCurrencyCodes.join(', ')}`,
    }),
});

export const UpdateBookSchema = z.object({
  name: z.string().trim().min(1, 'Book name is required').max(100, 'Book name must not exceed 100 characters').optional(),
  category: z.enum(['rental', 'other']).optional(),
  currencyCode: z
    .string()
    .trim()
    .toUpperCase()
    .refine((code) => validCurrencyCodes.includes(code), {
      message: `Invalid currency. Supported currencies: ${validCurrencyCodes.join(', ')}`,
    })
    .optional(),
});

export const CreateTransactionSchema = z.object({
  id: z.string().uuid().optional(),
  bookId: z.string().min(1, 'Book ID is required'),
  type: z.enum(['income', 'expense'], {
    errorMap: () => ({ message: "Type must be either 'income' or 'expense'" }),
  }),
  amountMinor: z
    .number()
    .int('Amount in minor units must be an integer')
    .positive('Amount in minor units must be greater than zero'),
  transactionDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in format YYYY-MM-DD')
    .refine((val) => !isNaN(Date.parse(val)), {
      message: 'Date is invalid',
    }),
  category: z.string().trim().max(50, 'Category must not exceed 50 characters').nullable().optional(),
  note: z.string().trim().max(500, 'Note must not exceed 500 characters').nullable().optional(),
  tenantName: z.string().trim().max(100).nullable().optional(),
  roomNumber: z.string().trim().max(50).nullable().optional(),
  phoneNumber: z.string().trim().max(50).nullable().optional(),
  chargePerRoom: z.number().int().positive().nullable().optional(),
  monthsPaid: z.number().positive().nullable().optional(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
});

export const UpdateTransactionSchema = z.object({
  type: z.enum(['income', 'expense']).optional(),
  amountMinor: z.number().int().positive().optional(),
  transactionDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in format YYYY-MM-DD')
    .refine((val) => !isNaN(Date.parse(val)), {
      message: 'Date is invalid',
    })
    .optional(),
  category: z.string().trim().max(50).nullable().optional(),
  note: z.string().trim().max(500).nullable().optional(),
  tenantName: z.string().trim().max(100).nullable().optional(),
  roomNumber: z.string().trim().max(50).nullable().optional(),
  phoneNumber: z.string().trim().max(50).nullable().optional(),
  chargePerRoom: z.number().int().positive().nullable().optional(),
  monthsPaid: z.number().positive().nullable().optional(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
});

export const ListTransactionsQuerySchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  type: z.enum(['income', 'expense']).optional(),
  category: z.string().optional(),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined)),
  offset: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined)),
});

export const MonthlySummaryQuerySchema = z.object({
  monthYear: z.string().regex(/^\d{4}-\d{2}$/, 'monthYear must be in format YYYY-MM'),
});

export const RestoreBackupSchema = z.object({
  format: z.literal('potfolioo-backup', {
    errorMap: () => ({ message: "Invalid backup format. Must be 'potfolioo-backup'" }),
  }),
  formatVersion: z.union([z.literal(1), z.literal(2)], {
    errorMap: () => ({ message: 'Unsupported backup format version. Supported versions: 1, 2' }),
  }),
  exportedAt: z.string(),
  book: z.object({
    id: z.string().min(1),
    name: z.string().trim().min(1).max(100),
    category: z.enum(['rental', 'other']).default('other'),
    currencyCode: z
      .string()
      .trim()
      .toUpperCase()
      .refine((code) => validCurrencyCodes.includes(code), {
        message: 'Invalid currency in backup book',
      }),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
    schemaVersion: z.number().int().optional(),
  }),
  transactions: z.array(CreateTransactionSchema),
});
