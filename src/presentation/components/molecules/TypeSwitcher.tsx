import React from 'react';
import { TransactionType } from '../../../domain/models/transaction';
import { ArrowDownLeft, ArrowUpRight, Check } from 'lucide-react';
import { clsx } from 'clsx';

interface TypeSwitcherProps {
  value: TransactionType;
  onChange: (type: TransactionType) => void;
}

export const TypeSwitcher: React.FC<TypeSwitcherProps> = ({ value, onChange }) => {
  return (
    <div className="space-y-1.5 w-full">
      <div className="flex items-center justify-between px-0.5">
        <label className="text-[11px] font-black uppercase tracking-wider text-blackstone/70">
          Flow Type
        </label>
        <span className={clsx('text-[11px] font-extrabold', value === 'income' ? 'text-blackstone' : 'text-vivid-amber-dark')}>
          {value === 'income' ? '● Cash Inflow' : '▲ Cash Outflow'}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {/* Income Segment */}
        <button
          type="button"
          onClick={() => onChange('income')}
          className={clsx(
            'relative h-12 rounded-control border-2 border-blackstone flex items-center justify-center gap-2 font-black text-sm tracking-wide transition-all cursor-pointer neo-press',
            value === 'income'
              ? 'bg-citron-lime text-blackstone shadow-brutal'
              : 'bg-surface text-blackstone/70 hover:bg-canvas shadow-brutal-sm'
          )}
        >
          <div className="w-4 h-4 rounded-full bg-black/10 flex items-center justify-center">
            {value === 'income' ? (
              <Check className="w-2.5 h-2.5 stroke-[2.5] text-blackstone" />
            ) : (
              <ArrowDownLeft className="w-2.5 h-2.5 text-blackstone" />
            )}
          </div>
          <span>+ Income</span>
        </button>

        {/* Expense Segment */}
        <button
          type="button"
          onClick={() => onChange('expense')}
          className={clsx(
            'relative h-12 rounded-control border-2 border-blackstone flex items-center justify-center gap-2 font-black text-sm tracking-wide transition-all cursor-pointer neo-press',
            value === 'expense'
              ? 'bg-vivid-amber text-blackstone shadow-brutal'
              : 'bg-surface text-blackstone/70 hover:bg-canvas shadow-brutal-sm'
          )}
        >
          <div className="w-4 h-4 rounded-full bg-black/10 flex items-center justify-center">
            {value === 'expense' ? (
              <Check className="w-2.5 h-2.5 stroke-[2.5] text-blackstone" />
            ) : (
              <ArrowUpRight className="w-2.5 h-2.5 text-blackstone" />
            )}
          </div>
          <span>- Expense</span>
        </button>
      </div>
    </div>
  );
};
