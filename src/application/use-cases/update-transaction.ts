import { Transaction, TransactionType, validateTransaction } from '../../domain/models/transaction';
import { TransactionRepositoryPort } from '../ports/transaction-repository';
import { parseAmountToMinor } from '../../domain/money';
import { ValidationError } from '../../domain/errors';

export interface UpdateTransactionParams {
  id: string;
  type: TransactionType;
  amountInput: string;
  currencyCode: string;
  transactionDate: string;
  category?: string;
  note?: string;

  // Rental specific fields
  tenantName?: string;
  roomNumber?: string;
  phoneNumber?: string;
  chargePerRoomInput?: string;
  monthsPaid?: number;
  dueDate?: string;
}

export async function updateTransaction(
  repo: TransactionRepositoryPort,
  params: UpdateTransactionParams
): Promise<Transaction> {
  const existing = await repo.getById(params.id);
  if (!existing) {
    throw new ValidationError('id', 'Transaction not found');
  }

  const amountMinor = parseAmountToMinor(params.amountInput, params.currencyCode);

  let chargePerRoomMinor = existing.chargePerRoom ?? null;
  if (params.chargePerRoomInput !== undefined) {
    chargePerRoomMinor = params.chargePerRoomInput.trim().length > 0
      ? parseAmountToMinor(params.chargePerRoomInput, params.currencyCode)
      : null;
  }

  const updatedTxn: Transaction = {
    ...existing,
    type: params.type,
    amountMinor,
    transactionDate: params.transactionDate,
    category: params.category?.trim() || null,
    note: params.note?.trim() || null,
    tenantName: params.tenantName !== undefined ? params.tenantName.trim() || null : existing.tenantName,
    roomNumber: params.roomNumber !== undefined ? params.roomNumber.trim() || null : existing.roomNumber,
    phoneNumber: params.phoneNumber !== undefined ? params.phoneNumber.trim() || null : existing.phoneNumber,
    chargePerRoom: chargePerRoomMinor,
    monthsPaid: params.monthsPaid !== undefined ? params.monthsPaid : existing.monthsPaid,
    dueDate: params.dueDate !== undefined ? params.dueDate.trim() || null : existing.dueDate,
    updatedAt: new Date().toISOString(),
  };

  validateTransaction(updatedTxn);
  await repo.update(updatedTxn);
  return updatedTxn;
}

export async function deleteTransaction(
  repo: TransactionRepositoryPort,
  id: string
): Promise<void> {
  await repo.delete(id);
}
