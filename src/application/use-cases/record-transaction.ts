import { Transaction, TransactionType, validateTransaction } from '../../domain/models/transaction';
import { TransactionRepositoryPort } from '../ports/transaction-repository';
import { parseAmountToMinor } from '../../domain/money';

export interface RecordTransactionParams {
  bookId: string;
  businessId?: string;
  type: TransactionType;
  amountInput: string;
  currencyCode: string;
  transactionDate: string; // YYYY-MM-DD
  category?: string;
  note?: string;

  // Rental specific fields
  tenantName?: string;
  roomNumber?: string;
  phoneNumber?: string;
  chargePerRoomInput?: string;
  monthsPaid?: number;
  dueDate?: string;

  // Retail specific fields
  itemId?: string;
  itemName?: string;
  quantitySold?: number;
  unitPriceMinor?: number;
  unitCostMinor?: number;
  cogsMinor?: number;
}

export async function recordTransaction(
  repo: TransactionRepositoryPort,
  params: RecordTransactionParams
): Promise<Transaction> {
  const amountMinor = parseAmountToMinor(params.amountInput, params.currencyCode);
  const now = new Date().toISOString();

  let chargePerRoomMinor: number | null = null;
  if (params.chargePerRoomInput && params.chargePerRoomInput.trim().length > 0) {
    chargePerRoomMinor = parseAmountToMinor(params.chargePerRoomInput, params.currencyCode);
  }

  const newTxn: Transaction = {
    id: crypto.randomUUID(),
    bookId: params.bookId,
    businessId: params.businessId,
    type: params.type,
    amountMinor,
    transactionDate: params.transactionDate,
    category: params.category?.trim() || null,
    note: params.note?.trim() || null,
    createdAt: now,
    updatedAt: now,

    tenantName: params.tenantName?.trim() || null,
    roomNumber: params.roomNumber?.trim() || null,
    phoneNumber: params.phoneNumber?.trim() || null,
    chargePerRoom: chargePerRoomMinor,
    monthsPaid: params.monthsPaid ?? null,
    dueDate: params.dueDate?.trim() || null,

    itemId: params.itemId ?? null,
    itemName: params.itemName?.trim() || null,
    quantitySold: params.quantitySold ?? null,
    unitPriceMinor: params.unitPriceMinor ?? null,
    unitCostMinor: params.unitCostMinor ?? null,
    cogsMinor: params.cogsMinor ?? null,
  };

  validateTransaction(newTxn);
  await repo.create(newTxn);
  return newTxn;
}
