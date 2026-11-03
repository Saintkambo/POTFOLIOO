import React from 'react';
import { useBook } from '../../context/BookContext';
import { formatMoney } from '../../../domain/money';
import { Card } from '../ui/Card';
import { IconTile } from '../ui/IconTile';
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';

export const SummaryCards: React.FC = () => {
  const { summary, book } = useBook();
  const currencyCode = book?.currencyCode && book.currencyCode !== 'USD' ? book.currencyCode : 'TZS';

  return (
    <div className="grid grid-cols-2 gap-3 w-full">
      {/* Income Card */}
      <Card shadowSize="md" className="p-3">
        <div className="flex items-center justify-between mb-2">
          <IconTile
            variant="income"
            size="md"
            icon={<ArrowDownLeft className="w-4 h-4 text-blackstone stroke-[2]" />}
          />
          <span className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-citron-lime-tint text-blackstone border border-citron-lime">
            {summary.incomeCount} entries
          </span>
        </div>
        <span className="text-xs font-bold text-blackstone/70 block uppercase tracking-wide">Total Income</span>
        <span
          className="text-lg sm:text-xl font-black font-heading text-blackstone tabular-nums leading-tight block mt-1 tracking-tight truncate"
          title={formatMoney(summary.totalIncomeMinor, currencyCode)}
        >
          {formatMoney(summary.totalIncomeMinor, currencyCode)}
        </span>
      </Card>

      {/* Expense Card */}
      <Card shadowSize="md" className="p-3">
        <div className="flex items-center justify-between mb-2">
          <IconTile
            variant="expense"
            size="md"
            icon={<ArrowUpRight className="w-4 h-4 text-blackstone stroke-[2]" />}
          />
          <span className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-vivid-amber-tint text-blackstone border border-vivid-amber">
            {summary.expenseCount} entries
          </span>
        </div>
        <span className="text-xs font-bold text-blackstone/70 block uppercase tracking-wide">Total Expenses</span>
        <span
          className="text-lg sm:text-xl font-black font-heading text-blackstone tabular-nums leading-tight block mt-1 tracking-tight truncate"
          title={formatMoney(summary.totalExpenseMinor, currencyCode)}
        >
          {formatMoney(summary.totalExpenseMinor, currencyCode)}
        </span>
      </Card>
    </div>
  );
};
