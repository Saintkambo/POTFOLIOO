import { MonthSummary, calculateMonthSummary } from '../../domain/models/summary';
import { Transaction } from '../../domain/models/transaction';
import { TransactionRepositoryPort, TransactionFilter } from '../ports/transaction-repository';

export async function getMonthlySummary(
  repo: TransactionRepositoryPort,
  bookId: string,
  month: string
): Promise<MonthSummary> {
  const transactions = await repo.listByMonth(bookId, month);
  return calculateMonthSummary(month, transactions);
}

export async function listTransactions(
  repo: TransactionRepositoryPort,
  filter: TransactionFilter
): Promise<Transaction[]> {
  return repo.list(filter);
}
