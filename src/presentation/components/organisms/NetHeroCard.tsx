import React from 'react';
import { useBook } from '../../context/BookContext';
import { formatMoney } from '../../../domain/money';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';

export const NetHeroCard: React.FC = () => {
  const { summary, book } = useBook();
  const currencyCode = book?.currencyCode && book.currencyCode !== 'USD' ? book.currencyCode : 'TZS';
  const formattedNet = formatMoney(Math.abs(summary.netProfitMinor), currencyCode);
  const sign = summary.netProfitMinor > 0 ? '+' : summary.netProfitMinor < 0 ? '-' : '';

  return (
    <Card shadowSize="lg" className="relative overflow-hidden">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-extrabold tracking-wider text-blackstone/70 uppercase font-heading">
          Net Cash Flow
        </span>
        <Badge variant={summary.isProfit ? 'profit' : 'loss'}>
          <span>{summary.isProfit ? '● Net Profit' : '▲ Net Loss'}</span>
        </Badge>
      </div>

      <div className="my-3">
        <div className="text-[34px] font-black font-heading tracking-tight text-blackstone tabular-nums leading-none">
          {sign}{formattedNet}
        </div>
      </div>

      <div className="pt-2 border-t border-blackstone/10 flex items-center justify-between text-xs text-text-secondary font-medium">
        <span>Based on {summary.transactionCount} transactions this month</span>
        <span className={`w-2 h-2 rounded-full ${summary.isProfit ? 'bg-citron-lime-dark' : 'bg-vivid-amber-dark'}`} />
      </div>
    </Card>
  );
};
