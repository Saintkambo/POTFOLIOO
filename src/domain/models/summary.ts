import { Transaction } from './transaction';

export interface CategorySummary {
  category: string;
  totalMinor: number;
  percentage: number;
  count: number;
}

export interface MonthSummary {
  month: string; // YYYY-MM
  totalIncomeMinor: number;
  totalExpenseMinor: number;
  netProfitMinor: number;
  isProfit: boolean;
  transactionCount: number;
  incomeCount: number;
  expenseCount: number;
  categories: CategorySummary[];
}

/**
 * Calculates a month summary strictly from an array of transactions.
 * Pure deterministic domain calculation with zero float drift.
 */
export function calculateMonthSummary(month: string, transactions: Transaction[]): MonthSummary {
  let totalIncomeMinor = 0;
  let totalExpenseMinor = 0;
  let incomeCount = 0;
  let expenseCount = 0;

  const categoryTotals: Record<string, { total: number; count: number }> = {};

  for (const txn of transactions) {
    if (txn.type === 'income') {
      totalIncomeMinor += txn.amountMinor;
      incomeCount++;
    } else {
      totalExpenseMinor += txn.amountMinor;
      expenseCount++;

      // Track expense categories
      const cat = txn.category?.trim() || 'Uncategorized';
      if (!categoryTotals[cat]) {
        categoryTotals[cat] = { total: 0, count: 0 };
      }
      categoryTotals[cat].total += txn.amountMinor;
      categoryTotals[cat].count++;
    }
  }

  const netProfitMinor = totalIncomeMinor - totalExpenseMinor;
  const isProfit = netProfitMinor >= 0;

  // Compute category breakdown with rounded percentages
  const categories: CategorySummary[] = Object.entries(categoryTotals)
    .map(([category, data]) => ({
      category,
      totalMinor: data.total,
      percentage: totalExpenseMinor > 0 ? Math.round((data.total / totalExpenseMinor) * 100) : 0,
      count: data.count,
    }))
    .sort((a, b) => b.totalMinor - a.totalMinor);

  return {
    month,
    totalIncomeMinor,
    totalExpenseMinor,
    netProfitMinor,
    isProfit,
    transactionCount: transactions.length,
    incomeCount,
    expenseCount,
    categories,
  };
}
