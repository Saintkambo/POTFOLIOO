import React from 'react';
import { useBook } from '../../context/BookContext';
import { formatMonthName, getCurrentMonthString } from '../../../domain/date';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const MonthNavigator: React.FC = () => {
  const { selectedMonth, nextMonth, prevMonth, resetToCurrentMonth } = useBook();
  const isCurrentMonth = selectedMonth === getCurrentMonthString();

  return (
    <div className="flex flex-col items-center w-full">
      <div className="w-full bg-surface border-2 border-blackstone rounded-control px-3 py-2 flex items-center justify-between shadow-brutal-sm">
        <button
          onClick={prevMonth}
          aria-label="Previous month"
          className="w-8 h-8 rounded-lg bg-canvas border border-blackstone flex items-center justify-center font-bold text-sm hover:bg-blackstone/5 active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
        >
          <ChevronLeft className="w-3.5 h-3.5 text-blackstone stroke-[2.2]" />
        </button>

        <span className="text-[15px] font-bold font-heading tracking-tight text-blackstone select-none">
          {formatMonthName(selectedMonth)}
        </span>

        <button
          onClick={nextMonth}
          aria-label="Next month"
          className="w-8 h-8 rounded-lg bg-canvas border border-blackstone flex items-center justify-center font-bold text-sm hover:bg-blackstone/5 active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
        >
          <ChevronRight className="w-3.5 h-3.5 text-blackstone stroke-[2.2]" />
        </button>
      </div>

      {!isCurrentMonth && (
        <button
          onClick={resetToCurrentMonth}
          className="mt-1 text-[11px] font-bold text-electric-sky-dark hover:underline uppercase tracking-wider cursor-pointer"
        >
          Return to Current Month
        </button>
      )}
    </div>
  );
};
