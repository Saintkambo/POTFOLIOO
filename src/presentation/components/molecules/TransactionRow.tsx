import React from 'react';
import { Transaction } from '../../../domain/models/transaction';
import { formatMoney } from '../../../domain/money';
import { IconTile } from '../ui/IconTile';
import { Badge } from '../ui/Badge';
import { ArrowDownLeft, ArrowUpRight, Calendar, HandCoins } from 'lucide-react';

interface TransactionRowProps {
  transaction: Transaction;
  currencyCode: string;
  onClick?: () => void;
  onRepay?: () => void;
}

export const TransactionRow: React.FC<TransactionRowProps> = ({
  transaction,
  currencyCode,
  onClick,
  onRepay,
}) => {
  const isIncome = transaction.type === 'income';
  const effectiveCurrency = currencyCode && currencyCode !== 'USD' ? currencyCode : 'TZS';
  const formattedAmount = formatMoney(transaction.amountMinor, effectiveCurrency);
  const isRentalPayment = Boolean(transaction.tenantName || transaction.roomNumber);
  const outstandingMinor = transaction.outstandingBalanceMinor ?? 0;
  const hasOutstandingDebt = outstandingMinor > 0;

  return (
    <div
      onClick={onClick}
      className="bg-surface border-2 border-blackstone rounded-control p-3 shadow-brutal-sm flex items-center justify-between hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all cursor-pointer select-none"
    >
      <div className="flex items-center gap-3 min-w-0 pr-2">
        <IconTile
          variant={isIncome ? 'income' : 'expense'}
          size="sm"
          icon={
            isIncome ? (
              <ArrowDownLeft className="w-3.5 h-3.5 text-blackstone stroke-[2]" />
            ) : (
              <ArrowUpRight className="w-3.5 h-3.5 text-blackstone stroke-[2]" />
            )
          }
        />
        <div className="min-w-0">
          <p className="text-[13px] font-extrabold text-blackstone truncate leading-snug">
            {isRentalPayment ? (
              <span>
                {transaction.roomNumber ? `[Room ${transaction.roomNumber}] ` : ''}
                {transaction.tenantName}
              </span>
            ) : transaction.customerName ? (
              <span>
                {transaction.itemName || transaction.note || 'Retail Sale'}
                <span className="text-text-secondary font-bold text-xs ml-1">
                  ({transaction.customerName})
                </span>
              </span>
            ) : (
              transaction.note || transaction.category || 'Transaction'
            )}
          </p>

          <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-text-secondary flex-wrap">
            <span>{transaction.transactionDate}</span>
            {transaction.category && (
              <>
                <span>•</span>
                <span className="bg-canvas px-1.5 py-0.2 rounded border border-border-subtle truncate max-w-[120px]">
                  {transaction.category}
                </span>
              </>
            )}
            {transaction.paymentStatus && (
              <>
                <span>•</span>
                <span
                  className={`px-1.5 py-0.2 rounded border text-[9px] font-black uppercase tracking-wider ${
                    transaction.paymentStatus === 'paid'
                      ? 'bg-citron-lime text-blackstone border-blackstone'
                      : transaction.paymentStatus === 'partial'
                      ? 'bg-vivid-amber text-blackstone border-blackstone'
                      : 'bg-rose-100 text-rose-900 border-rose-400'
                  }`}
                >
                  {transaction.paymentStatus === 'paid'
                    ? 'Paid in full'
                    : transaction.paymentStatus === 'partial'
                    ? 'Partially paid'
                    : 'On credit'}
                </span>
              </>
            )}
            {hasOutstandingDebt && (
              <>
                <span>•</span>
                <span className="text-rose-600 font-black font-mono">
                  Due: {formatMoney(outstandingMinor, effectiveCurrency)}
                </span>
              </>
            )}
            {transaction.dueDate && (
              <>
                <span>•</span>
                <span className="font-mono text-blackstone font-bold flex items-center gap-0.5">
                  <Calendar className="w-2.5 h-2.5" />
                  Due: {transaction.dueDate}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="text-right shrink-0 flex items-center gap-2">
        <div>
          <span className="text-[14px] font-extrabold text-blackstone tabular-nums block font-mono">
            {isIncome ? `+${formattedAmount}` : `-${formattedAmount}`}
          </span>
          <Badge variant={isIncome ? 'income' : 'expense'} className="mt-0.5 text-[10px]">
            {isIncome ? 'Income' : 'Expense'}
          </Badge>
        </div>

        {hasOutstandingDebt && onRepay && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRepay();
            }}
            className="px-2 py-1 bg-electric-sky text-blackstone font-black text-[10px] rounded border border-blackstone shadow-xs hover:bg-electric-sky-dark neo-press flex items-center gap-1 cursor-pointer"
            title="Record debt repayment"
          >
            <HandCoins className="w-3 h-3" />
            <span>Repay</span>
          </button>
        )}
      </div>
    </div>
  );
};
